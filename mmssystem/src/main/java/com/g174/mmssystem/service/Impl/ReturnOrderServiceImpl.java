package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.ReturnOrderItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.ReturnOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ReturnOrderListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ReturnOrderResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.ReturnOrderMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IReturnOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReturnOrderServiceImpl implements IReturnOrderService {

    private final ReturnOrderRepository returnOrderRepository;
    private final ReturnOrderItemRepository returnOrderItemRepository;
    private final DeliveryRepository deliveryRepository;
    private final DeliveryItemRepository deliveryItemRepository;
    private final ARInvoiceRepository arInvoiceRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final ReturnOrderMapper returnOrderMapper;

    @Override
    public ReturnOrderResponseDTO createReturnOrder(ReturnOrderRequestDTO request) {
        Delivery delivery = getDelivery(request.getDeliveryId());
        validateDeliveryForReturn(delivery);

        // Tự động tìm Invoice từ Delivery nếu chưa được chỉ định
        ARInvoice invoice = null;
        if (request.getInvoiceId() != null) {
            invoice = getInvoice(request.getInvoiceId());
        } else {
            // Tìm Invoice từ Delivery (qua SalesOrder)
            SalesOrder salesOrder = delivery.getSalesOrder();
            if (salesOrder != null) {
                List<ARInvoice> invoices = arInvoiceRepository.findByCustomerIdAndNotDeleted(
                        salesOrder.getCustomer().getCustomerId());
                // Tìm Invoice có liên kết với Delivery này hoặc SalesOrder này
                invoice = invoices.stream()
                        .filter(inv -> inv.getDelivery() != null && inv.getDelivery().getDeliveryId().equals(delivery.getDeliveryId()))
                        .findFirst()
                        .orElse(invoices.stream()
                                .filter(inv -> inv.getSalesOrder() != null && inv.getSalesOrder().getSoId().equals(salesOrder.getSoId()))
                                .findFirst()
                                .orElse(null));
            }
        }

        Warehouse warehouse = getWarehouse(request.getWarehouseId());
        User currentUser = getCurrentUser();

        ReturnOrder returnOrder = returnOrderMapper.toEntity(request, delivery, invoice, warehouse, currentUser);
        returnOrder.setReturnNo(generateReturnNo());
        // Tự động approve khi tạo (giống Good Issue)
        returnOrder.setStatus(ReturnOrder.ReturnStatus.Approved);

        List<ReturnOrderItem> items = buildItems(returnOrder, request.getItems(), delivery);
        returnOrder.getItems().clear();
        returnOrder.getItems().addAll(items);

        ReturnOrder saved = returnOrderRepository.save(returnOrder);
        return returnOrderMapper.toResponse(saved, items);
    }

    @Override
    public ReturnOrderResponseDTO updateReturnOrder(Integer id, ReturnOrderRequestDTO request) {
        ReturnOrder returnOrder = getReturnOrderEntity(id);

        // Chỉ cho phép chỉnh sửa khi ở trạng thái Draft hoặc Approved (Manager có thể sửa cả Approved)
        if (returnOrder.getStatus() == ReturnOrder.ReturnStatus.Completed ||
                returnOrder.getStatus() == ReturnOrder.ReturnStatus.Cancelled) {
            throw new IllegalStateException("Không thể chỉnh sửa đơn trả hàng đã hoàn thành hoặc đã hủy");
        }

        Warehouse warehouse = getWarehouse(request.getWarehouseId());
        User currentUser = getCurrentUser();
        Delivery delivery = returnOrder.getDelivery();

        returnOrderMapper.updateEntity(returnOrder, request, warehouse, currentUser);

        returnOrderItemRepository.deleteByReturnOrder_RoId(id);
        returnOrder.getItems().clear();
        List<ReturnOrderItem> items = buildItems(returnOrder, request.getItems(), delivery);
        returnOrder.getItems().addAll(items);

        ReturnOrder saved = returnOrderRepository.save(returnOrder);
        return returnOrderMapper.toResponse(saved, items);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnOrderResponseDTO getReturnOrder(Integer id) {
        ReturnOrder returnOrder = getReturnOrderEntity(id);
        List<ReturnOrderItem> items = returnOrderItemRepository.findByReturnOrder_RoId(id);
        return returnOrderMapper.toResponse(returnOrder, items);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReturnOrderListResponseDTO> getAllReturnOrders(Integer deliveryId, Integer invoiceId, String status, String keyword) {
        List<ReturnOrder> returnOrders = returnOrderRepository.findAll().stream()
                .filter(ro -> ro.getDeletedAt() == null)
                .filter(ro -> deliveryId == null || (ro.getDelivery() != null && ro.getDelivery().getDeliveryId().equals(deliveryId)))
                .filter(ro -> invoiceId == null || (ro.getInvoice() != null && ro.getInvoice().getArInvoiceId().equals(invoiceId)))
                .filter(ro -> status == null || status.isEmpty() || ro.getStatus().name().equals(status))
                .filter(ro -> keyword == null || keyword.isEmpty() ||
                        (ro.getReturnNo() != null && ro.getReturnNo().toLowerCase().contains(keyword.toLowerCase())))
                .collect(Collectors.toList());

        return returnOrders.stream()
                .map(returnOrderMapper::toListResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteReturnOrder(Integer id) {
        ReturnOrder returnOrder = getReturnOrderEntity(id);

        // Chỉ cho phép xóa khi ở trạng thái Draft hoặc Approved (chưa Completed)
        if (returnOrder.getStatus() == ReturnOrder.ReturnStatus.Completed) {
            throw new IllegalStateException("Không thể xóa đơn trả hàng đã hoàn thành");
        }

        returnOrder.setDeletedAt(Instant.now());
        returnOrderRepository.save(returnOrder);
    }

    @Override
    public ReturnOrderResponseDTO changeStatus(Integer id, String status) {
        ReturnOrder returnOrder = getReturnOrderEntity(id);
        ReturnOrder.ReturnStatus oldStatus = returnOrder.getStatus();
        ReturnOrder.ReturnStatus newStatus = parseStatus(status);

        if (newStatus == null) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }

        validateStatusTransition(oldStatus, newStatus);

        returnOrder.setStatus(newStatus);

        ReturnOrder saved = returnOrderRepository.save(returnOrder);
        List<ReturnOrderItem> items = returnOrderItemRepository.findByReturnOrder_RoId(id);
        return returnOrderMapper.toResponse(saved, items);
    }

    private List<ReturnOrderItem> buildItems(ReturnOrder returnOrder, List<ReturnOrderItemRequestDTO> requestItems, Delivery delivery) {
        if (requestItems == null || requestItems.isEmpty()) {
            throw new IllegalArgumentException("Cần ít nhất một dòng sản phẩm trả lại");
        }

        List<ReturnOrderItem> items = new ArrayList<>();
        for (ReturnOrderItemRequestDTO dto : requestItems) {
            DeliveryItem deliveryItem = deliveryItemRepository.findById(dto.getDeliveryItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Delivery Item ID " + dto.getDeliveryItemId()));

            // Validate: số lượng trả lại không được vượt quá số lượng đã giao
            BigDecimal alreadyReturned = getAlreadyReturnedQty(deliveryItem.getDiId());
            BigDecimal maxReturnable = deliveryItem.getDeliveredQty().subtract(alreadyReturned);
            if (dto.getReturnedQty().compareTo(maxReturnable) > 0) {
                throw new IllegalArgumentException(
                        String.format("Số lượng trả lại (%s) vượt quá số lượng có thể trả (%s)",
                                dto.getReturnedQty(), maxReturnable));
            }

            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID " + dto.getProductId()));
            Warehouse warehouse = getWarehouse(dto.getWarehouseId());

            ReturnOrderItem item = returnOrderMapper.toItemEntity(returnOrder, dto, deliveryItem, product, warehouse);
            items.add(item);
        }
        return items;
    }

    private BigDecimal getAlreadyReturnedQty(Integer deliveryItemId) {
        return returnOrderItemRepository.findByDeliveryItem_DiId(deliveryItemId).stream()
                .filter(item -> item.getReturnOrder().getStatus() == ReturnOrder.ReturnStatus.Approved)
                .map(ReturnOrderItem::getReturnedQty)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void validateStatusTransition(ReturnOrder.ReturnStatus currentStatus, ReturnOrder.ReturnStatus newStatus) {
        if (currentStatus == ReturnOrder.ReturnStatus.Cancelled) {
            throw new IllegalStateException("Không thể thay đổi trạng thái của đơn trả hàng đã hủy");
        }

        if (currentStatus == ReturnOrder.ReturnStatus.Completed) {
            throw new IllegalStateException("Không thể thay đổi trạng thái của đơn trả hàng đã hoàn thành");
        }

        switch (currentStatus) {
            case Draft:
                // Draft có thể chuyển sang Approved hoặc Cancelled
                if (newStatus != ReturnOrder.ReturnStatus.Approved && newStatus != ReturnOrder.ReturnStatus.Cancelled) {
                    throw new IllegalStateException("Chỉ có thể chuyển từ Draft sang Approved hoặc Cancelled");
                }
                break;
            case Approved:
                // Approved có thể chuyển sang Completed hoặc Cancelled
                if (newStatus != ReturnOrder.ReturnStatus.Completed && newStatus != ReturnOrder.ReturnStatus.Cancelled) {
                    throw new IllegalStateException("Chỉ có thể chuyển từ Approved sang Completed hoặc Cancelled");
                }
                break;
            default:
                throw new IllegalStateException("Không thể thay đổi trạng thái từ " + currentStatus);
        }
    }

    private void validateDeliveryForReturn(Delivery delivery) {
        if (delivery.getStatus() != Delivery.DeliveryStatus.Delivered) {
            throw new IllegalStateException("Chỉ có thể tạo đơn trả hàng cho phiếu giao hàng đã giao (Delivered)");
        }
    }

    private ReturnOrder getReturnOrderEntity(Integer id) {
        ReturnOrder returnOrder = returnOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn trả hàng ID " + id));
        if (returnOrder.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Đơn trả hàng đã bị xóa");
        }
        return returnOrder;
    }

    private Delivery getDelivery(Integer id) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Delivery ID " + id));
        if (delivery.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Delivery đã bị xóa");
        }
        return delivery;
    }

    private ARInvoice getInvoice(Integer id) {
        return arInvoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Invoice ID " + id));
    }

    private Warehouse getWarehouse(Integer id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho ID " + id));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + authentication.getName()));
    }

    private ReturnOrder.ReturnStatus parseStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        try {
            return ReturnOrder.ReturnStatus.valueOf(status.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String generateReturnNo() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        String candidate = "RO-" + datePart + "-" + unique;

        while (returnOrderRepository.findByReturnNo(candidate) != null) {
            unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
            candidate = "RO-" + datePart + "-" + unique;
        }
        return candidate;
    }
}


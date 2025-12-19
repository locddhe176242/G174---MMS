package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.SalesReturnInboundOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesReturnInboundOrderResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.SalesReturnInboundOrderMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.ISalesReturnInboundOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SalesReturnInboundOrderServiceImpl implements ISalesReturnInboundOrderService {

    private final SalesReturnInboundOrderRepository inboundOrderRepository;
    private final SalesReturnInboundOrderItemRepository inboundOrderItemRepository;
    private final ReturnOrderRepository returnOrderRepository;
    private final ReturnOrderItemRepository returnOrderItemRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SalesReturnInboundOrderMapper mapper;

    @Override
    public SalesReturnInboundOrderResponseDTO createFromReturnOrder(SalesReturnInboundOrderRequestDTO request) {
        ReturnOrder returnOrder = getReturnOrder(request.getRoId());

        if (returnOrder.getStatus() == ReturnOrder.ReturnStatus.Cancelled) {
            throw new IllegalStateException("Không thể tạo Đơn nhập hàng lại cho Đơn trả hàng đã hủy");
        }

        // Warehouse: ưu tiên DTO, nếu null thì lấy từ ReturnOrder
        Warehouse warehouse;
        if (request.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho ID " + request.getWarehouseId()));
        } else {
            warehouse = returnOrder.getWarehouse();
        }

        if (warehouse == null) {
            throw new IllegalStateException("Đơn trả hàng không có thông tin kho, vui lòng chọn kho nhập lại");
        }

        // Người tạo: lấy từ user hiện tại (giống các chứng từ phần bán khác)
        User createdBy = getCurrentUser();

        // Tạo entity chính
        // Khi tạo mới: mặc định là Draft
        // Khi lưu form (đủ thông tin): tự động chuyển sang SentToWarehouse (không cần duyệt)
        final Warehouse baseWarehouse = warehouse; // dùng trong lambda (effectively final)
        final SalesReturnInboundOrder inboundOrder = SalesReturnInboundOrder.builder()
                .sriNo(generateSriNo())
                .returnOrder(returnOrder)
                .warehouse(baseWarehouse)
                .expectedReceiptDate(request.getExpectedReceiptDate() != null
                        ? request.getExpectedReceiptDate()
                        : LocalDateTime.now())
                .status(SalesReturnInboundOrder.Status.Draft) // Mặc định Draft khi tạo
                .notes(request.getNotes())
                .createdBy(createdBy)
                .build();

        // Lấy tất cả item của ReturnOrder có returnedQty > 0 (với JOIN FETCH để load product và warehouse)
        List<ReturnOrderItem> sourceItems = returnOrderItemRepository.findByReturnOrder_RoIdWithRelations(returnOrder.getRoId())
                .stream()
                .filter(roi -> roi.getReturnedQty() != null
                        && roi.getReturnedQty().compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());

        if (sourceItems.isEmpty()) {
            throw new IllegalStateException("Đơn trả hàng không có dòng nào có số lượng trả lại > 0");
        }

        // Tạo items cho Đơn nhập hàng lại (plannedQty = returnedQty)
        List<SalesReturnInboundOrderItem> items = sourceItems.stream()
                .map(roi -> {
                    // Product và Warehouse đã được JOIN FETCH, không cần kiểm tra null
                    Product product = roi.getProduct();
                    Warehouse lineWarehouse = roi.getWarehouse() != null ? roi.getWarehouse() : baseWarehouse;

                    SalesReturnInboundOrderItem item = new SalesReturnInboundOrderItem();
                    item.setInboundOrder(inboundOrder);
                    item.setReturnOrderItem(roi);
                    item.setProduct(product);
                    item.setWarehouse(lineWarehouse);
                    item.setPlannedQty(roi.getReturnedQty());
                    item.setUom(roi.getUom());
                    item.setNote(roi.getNote());
                    return item;
                })
                .collect(Collectors.toList());

        inboundOrder.setItems(items);

        SalesReturnInboundOrder saved = inboundOrderRepository.save(inboundOrder);

        // Tự động chuyển sang SentToWarehouse khi đã có đủ thông tin (không cần duyệt)
        // Điều kiện: có warehouse, có items, có expectedReceiptDate
        if (saved.getWarehouse() != null && 
            saved.getItems() != null && !saved.getItems().isEmpty() &&
            saved.getExpectedReceiptDate() != null) {
            saved.setStatus(SalesReturnInboundOrder.Status.SentToWarehouse);
            saved = inboundOrderRepository.save(saved);
            log.info("Đã tự động chuyển Đơn nhập hàng lại {} sang trạng thái SentToWarehouse", saved.getSriNo());
        }

        // Cập nhật trạng thái liên quan trên ReturnOrder (mới chỉ đánh dấu là đã có yêu cầu nhập lại)
        returnOrder.setGoodsReceiptStatus(ReturnOrder.GoodsReceiptStatus.Pending);
        returnOrderRepository.save(returnOrder);

        log.info("Đã tạo Đơn nhập hàng lại {} từ Đơn trả hàng {}", saved.getSriNo(), returnOrder.getReturnNo());

        return mapper.toResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public SalesReturnInboundOrderResponseDTO getById(Integer sriId) {
        SalesReturnInboundOrder inboundOrder = inboundOrderRepository.findById(sriId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Đơn nhập hàng lại ID " + sriId));
        if (inboundOrder.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Đơn nhập hàng lại đã bị xóa");
        }
        return mapper.toResponseDTO(inboundOrder);
    }

    @Transactional(readOnly = true)
    @Override
    public List<SalesReturnInboundOrderResponseDTO> getAll() {
        List<SalesReturnInboundOrder> list = inboundOrderRepository.findAllActive();
        return list.stream()
                .map(mapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Override
    public List<SalesReturnInboundOrderResponseDTO> getByReturnOrder(Integer roId) {
        List<SalesReturnInboundOrder> list = inboundOrderRepository.findByReturnOrderId(roId);
        return list.stream()
                .map(mapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    private ReturnOrder getReturnOrder(Integer roId) {
        ReturnOrder ro = returnOrderRepository.findById(roId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Đơn trả hàng ID " + roId));
        if (ro.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Đơn trả hàng đã bị xóa");
        }
        return ro;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName())
                .orElse(null);
    }

    private String generateSriNo() {
        String prefix = "SRI";
        String maxNo = inboundOrderRepository.findMaxSriNo(prefix);
        int nextNum = 1;
        if (maxNo != null && maxNo.startsWith(prefix)) {
            try {
                nextNum = Integer.parseInt(maxNo.substring(prefix.length())) + 1;
            } catch (NumberFormatException ignored) {
            }
        }
        return String.format("%s%04d", prefix, nextNum);
    }
}



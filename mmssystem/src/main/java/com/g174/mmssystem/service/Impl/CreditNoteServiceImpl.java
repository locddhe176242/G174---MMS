package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.CreditNoteItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.CreditNoteRequestDTO;
import com.g174.mmssystem.dto.responseDTO.CreditNoteListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.CreditNoteResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.CreditNoteMapper;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.ICreditNoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
public class CreditNoteServiceImpl implements ICreditNoteService {

    private final CreditNoteRepository creditNoteRepository;
    private final CreditNoteItemRepository creditNoteItemRepository;
    private final ARInvoiceRepository arInvoiceRepository;
    private final ReturnOrderRepository returnOrderRepository;
    private final ReturnOrderItemRepository returnOrderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CreditNoteMapper creditNoteMapper;
    private final com.g174.mmssystem.service.IService.ICustomerBalanceService customerBalanceService;

    @Override
    public CreditNoteResponseDTO createCreditNote(CreditNoteRequestDTO request) {
        ARInvoice invoice = getInvoice(request.getInvoiceId());
        ReturnOrder returnOrder = request.getReturnOrderId() != null ? getReturnOrder(request.getReturnOrderId()) : null;
        User currentUser = getCurrentUser();

        CreditNote creditNote = creditNoteMapper.toEntity(request, invoice, returnOrder, currentUser);
        creditNote.setCreditNoteNo(generateCreditNoteNo());
        creditNote.setStatus(CreditNote.CreditNoteStatus.Draft);

        List<CreditNoteItem> items = buildItems(creditNote, request.getItems());
        creditNote.getItems().clear();
        creditNote.getItems().addAll(items);

        recalcTotals(creditNote, items);

        CreditNote saved = creditNoteRepository.save(creditNote);
        return creditNoteMapper.toResponse(saved, items);
    }

    @Override
    public CreditNoteResponseDTO updateCreditNote(Integer id, CreditNoteRequestDTO request) {
        CreditNote creditNote = getCreditNoteEntity(id);

        if (creditNote.getStatus() == CreditNote.CreditNoteStatus.Issued ||
                creditNote.getStatus() == CreditNote.CreditNoteStatus.Applied ||
                creditNote.getStatus() == CreditNote.CreditNoteStatus.Cancelled) {
            throw new IllegalStateException("Không thể chỉnh sửa Credit Note đã xuất, đã áp dụng hoặc đã hủy");
        }

        User currentUser = getCurrentUser();
        creditNoteMapper.updateEntity(creditNote, request, currentUser);

        creditNoteItemRepository.deleteByCreditNote_CnId(id);
        creditNote.getItems().clear();
        List<CreditNoteItem> items = buildItems(creditNote, request.getItems());
        creditNote.getItems().addAll(items);

        recalcTotals(creditNote, items);

        CreditNote saved = creditNoteRepository.save(creditNote);
        return creditNoteMapper.toResponse(saved, items);
    }

    @Override
    @Transactional(readOnly = true)
    public CreditNoteResponseDTO getCreditNote(Integer id) {
        CreditNote creditNote = getCreditNoteEntity(id);
        List<CreditNoteItem> items = creditNoteItemRepository.findByCreditNote_CnId(id);
        return creditNoteMapper.toResponse(creditNote, items);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CreditNoteListResponseDTO> getAllCreditNotes(Integer invoiceId, Integer returnOrderId, String status, String keyword) {
        List<CreditNote> creditNotes = creditNoteRepository.findAll().stream()
                .filter(cn -> cn.getDeletedAt() == null)
                .filter(cn -> invoiceId == null || (cn.getInvoice() != null && cn.getInvoice().getArInvoiceId().equals(invoiceId)))
                .filter(cn -> returnOrderId == null || (cn.getReturnOrder() != null && cn.getReturnOrder().getRoId().equals(returnOrderId)))
                .filter(cn -> status == null || status.isEmpty() || cn.getStatus().name().equals(status))
                .filter(cn -> keyword == null || keyword.isEmpty() ||
                        (cn.getCreditNoteNo() != null && cn.getCreditNoteNo().toLowerCase().contains(keyword.toLowerCase())))
                .collect(Collectors.toList());

        return creditNotes.stream()
                .map(creditNoteMapper::toListResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteCreditNote(Integer id) {
        CreditNote creditNote = getCreditNoteEntity(id);

        if (creditNote.getStatus() == CreditNote.CreditNoteStatus.Issued ||
                creditNote.getStatus() == CreditNote.CreditNoteStatus.Applied) {
            throw new IllegalStateException("Không thể xóa Credit Note đã xuất hoặc đã áp dụng");
        }

        creditNote.setDeletedAt(Instant.now());
        creditNoteRepository.save(creditNote);
    }

    @Override
    public CreditNoteResponseDTO changeStatus(Integer id, String status) {
        CreditNote creditNote = getCreditNoteEntity(id);
        CreditNote.CreditNoteStatus oldStatus = creditNote.getStatus();
        CreditNote.CreditNoteStatus newStatus = parseStatus(status);

        if (newStatus == null) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }

        validateStatusTransition(oldStatus, newStatus);

        creditNote.setStatus(newStatus);

        // Khi chuyển sang Issued hoặc Applied, cập nhật Invoice balance và Customer balance
        if (newStatus == CreditNote.CreditNoteStatus.Issued || newStatus == CreditNote.CreditNoteStatus.Applied) {
            updateInvoiceBalance(creditNote);
            // Cập nhật customer balance
            if (creditNote.getInvoice() != null && creditNote.getInvoice().getCustomer() != null) {
                customerBalanceService.updateOnCreditNoteApplied(
                        creditNote.getInvoice().getCustomer().getCustomerId(),
                        creditNote.getTotalAmount());
            }
        }

        CreditNote saved = creditNoteRepository.save(creditNote);
        List<CreditNoteItem> items = creditNoteItemRepository.findByCreditNote_CnId(id);
        return creditNoteMapper.toResponse(saved, items);
    }

    @Override
    public CreditNoteResponseDTO createFromReturnOrder(Integer returnOrderId) {
        ReturnOrder returnOrder = getReturnOrder(returnOrderId);

        if (returnOrder.getStatus() != ReturnOrder.ReturnStatus.Completed) {
            throw new IllegalStateException("Chỉ có thể tạo Credit Note từ Return Order đã hoàn thành (Completed)");
        }

        if (returnOrder.getInvoice() == null) {
            throw new IllegalStateException("Return Order phải liên kết với Invoice để tạo Credit Note");
        }

        ARInvoice invoice = returnOrder.getInvoice();

        // Tạo Credit Note với các items từ Return Order
        CreditNoteRequestDTO request = new CreditNoteRequestDTO();
        request.setInvoiceId(invoice.getArInvoiceId());
        request.setReturnOrderId(returnOrderId);
        request.setCreditNoteDate(LocalDate.now());
        request.setReason("Tự động tạo từ Return Order: " + returnOrder.getReturnNo());

        List<CreditNoteItemRequestDTO> items = new ArrayList<>();
        for (ReturnOrderItem returnItem : returnOrder.getItems()) {
            // Lấy thông tin giá từ Sales Order Item gốc
            DeliveryItem deliveryItem = returnItem.getDeliveryItem();
            SalesOrderItem salesOrderItem = deliveryItem != null ? deliveryItem.getSalesOrderItem() : null;

            if (salesOrderItem != null) {
                CreditNoteItemRequestDTO item = new CreditNoteItemRequestDTO();
                item.setProductId(returnItem.getProduct().getProductId());
                item.setProductCode(returnItem.getProduct().getSku());
                item.setProductName(returnItem.getProduct().getName());
                item.setUom(returnItem.getUom());
                item.setQuantity(returnItem.getReturnedQty());
                item.setUnitPrice(salesOrderItem.getUnitPrice());
                item.setDiscountAmount(salesOrderItem.getDiscountAmount() != null ? salesOrderItem.getDiscountAmount() : BigDecimal.ZERO);
                item.setTaxRate(salesOrderItem.getTaxRate() != null ? salesOrderItem.getTaxRate() : BigDecimal.ZERO);
                items.add(item);
            }
        }

        if (items.isEmpty()) {
            throw new IllegalStateException("Không có sản phẩm nào để tạo Credit Note");
        }

        request.setItems(items);
        return createCreditNote(request);
    }

    private List<CreditNoteItem> buildItems(CreditNote creditNote, List<CreditNoteItemRequestDTO> requestItems) {
        if (requestItems == null || requestItems.isEmpty()) {
            throw new IllegalArgumentException("Cần ít nhất một dòng sản phẩm");
        }

        List<CreditNoteItem> items = new ArrayList<>();
        for (CreditNoteItemRequestDTO dto : requestItems) {
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm ID " + dto.getProductId()));

            CreditNoteItem item = creditNoteMapper.toItemEntity(creditNote, dto, product);
            items.add(item);
        }
        return items;
    }

    private void recalcTotals(CreditNote creditNote, List<CreditNoteItem> items) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (CreditNoteItem item : items) {
            BigDecimal lineSubtotal = item.getQuantity()
                    .multiply(item.getUnitPrice())
                    .subtract(item.getDiscountAmount())
                    .max(BigDecimal.ZERO);
            subtotal = subtotal.add(lineSubtotal);
            taxTotal = taxTotal.add(item.getTaxAmount());
        }

        BigDecimal total = subtotal.add(taxTotal);

        creditNote.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        creditNote.setTaxAmount(taxTotal.setScale(2, RoundingMode.HALF_UP));
        creditNote.setTotalAmount(total.setScale(2, RoundingMode.HALF_UP));
    }

    private void updateInvoiceBalance(CreditNote creditNote) {
        ARInvoice invoice = creditNote.getInvoice();
        if (invoice != null) {
            // Reload invoice để đảm bảo có dữ liệu mới nhất
            ARInvoice freshInvoice = arInvoiceRepository.findById(invoice.getArInvoiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Invoice ID " + invoice.getArInvoiceId()));
            
            // Giảm balance của Invoice bằng totalAmount của Credit Note
            BigDecimal newBalance = freshInvoice.getBalanceAmount()
                    .subtract(creditNote.getTotalAmount())
                    .max(BigDecimal.ZERO);
            freshInvoice.setBalanceAmount(newBalance);

            // Cập nhật status của Invoice nếu cần
            if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
                if (freshInvoice.getStatus() == ARInvoice.InvoiceStatus.PartiallyPaid || 
                    freshInvoice.getStatus() == ARInvoice.InvoiceStatus.Unpaid) {
                    freshInvoice.setStatus(ARInvoice.InvoiceStatus.Paid);
                }
            } else if (freshInvoice.getStatus() == ARInvoice.InvoiceStatus.Unpaid) {
                // Nếu còn nợ nhưng trước đó là Unpaid, chuyển sang PartiallyPaid
                freshInvoice.setStatus(ARInvoice.InvoiceStatus.PartiallyPaid);
            }

            arInvoiceRepository.save(freshInvoice);
            log.info("Đã cập nhật balance của Invoice {} từ {} xuống {}", 
                    freshInvoice.getInvoiceNo(), invoice.getBalanceAmount(), newBalance);
        }
    }

    private void validateStatusTransition(CreditNote.CreditNoteStatus currentStatus, CreditNote.CreditNoteStatus newStatus) {
        if (currentStatus == CreditNote.CreditNoteStatus.Cancelled) {
            throw new IllegalStateException("Không thể thay đổi trạng thái của Credit Note đã hủy");
        }

        if (currentStatus == CreditNote.CreditNoteStatus.Applied) {
            throw new IllegalStateException("Không thể thay đổi trạng thái của Credit Note đã áp dụng");
        }

        switch (currentStatus) {
            case Draft:
                if (newStatus != CreditNote.CreditNoteStatus.Issued && newStatus != CreditNote.CreditNoteStatus.Cancelled) {
                    throw new IllegalStateException("Chỉ có thể chuyển từ Draft sang Issued hoặc Cancelled");
                }
                break;
            case Issued:
                if (newStatus != CreditNote.CreditNoteStatus.Applied && newStatus != CreditNote.CreditNoteStatus.Cancelled) {
                    throw new IllegalStateException("Chỉ có thể chuyển từ Issued sang Applied hoặc Cancelled");
                }
                break;
        }
    }

    private CreditNote getCreditNoteEntity(Integer id) {
        CreditNote creditNote = creditNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Credit Note ID " + id));
        if (creditNote.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Credit Note đã bị xóa");
        }
        return creditNote;
    }

    private ARInvoice getInvoice(Integer id) {
        return arInvoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Invoice ID " + id));
    }

    private ReturnOrder getReturnOrder(Integer id) {
        return returnOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Return Order ID " + id));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + authentication.getName()));
    }

    private CreditNote.CreditNoteStatus parseStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        try {
            return CreditNote.CreditNoteStatus.valueOf(status.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String generateCreditNoteNo() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        String candidate = "CN-" + datePart + "-" + unique;

        while (creditNoteRepository.findByCreditNoteNo(candidate) != null) {
            unique = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
            candidate = "CN-" + datePart + "-" + unique;
        }
        return candidate;
    }
}


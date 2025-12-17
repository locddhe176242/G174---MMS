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
    private final ARInvoiceItemRepository arInvoiceItemRepository;
    private final ARPaymentRepository arPaymentRepository;
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
    public CreditNoteResponseDTO createFromInvoice(Integer invoiceId) {
        ARInvoice invoice = getInvoice(invoiceId);

        if (invoice.getStatus() == ARInvoice.InvoiceStatus.Cancelled) {
            throw new IllegalStateException("Không thể tạo Credit Note từ hóa đơn đã hủy");
        }

        // Copy toàn bộ thông tin từ Invoice gốc
        CreditNoteRequestDTO request = new CreditNoteRequestDTO();
        request.setInvoiceId(invoice.getArInvoiceId());
        request.setReturnOrderId(null); // Không liên kết với Return Order
        request.setCreditNoteDate(LocalDate.now());
        request.setReason("Hóa đơn điều chỉnh từ: " + invoice.getInvoiceNo());
        request.setNotes("Tự động tạo từ hóa đơn gốc. Vui lòng điều chỉnh số lượng theo nhu cầu.");

        // Copy tất cả items từ Invoice, cho phép người dùng điều chỉnh số lượng sau
        List<CreditNoteItemRequestDTO> items = new ArrayList<>();
        List<ARInvoiceItem> invoiceItems = arInvoiceItemRepository.findByInvoice_ArInvoiceId(invoiceId);

        for (ARInvoiceItem invoiceItem : invoiceItems) {
            CreditNoteItemRequestDTO item = new CreditNoteItemRequestDTO();
            item.setProductId(invoiceItem.getProduct().getProductId());
            item.setProductCode(invoiceItem.getProduct().getSku());
            item.setProductName(invoiceItem.getProduct().getName());

            // Lấy UOM từ SalesOrderItem hoặc Product
            String uom = null;
            if (invoiceItem.getSalesOrderItem() != null && invoiceItem.getSalesOrderItem().getUom() != null) {
                uom = invoiceItem.getSalesOrderItem().getUom();
            } else if (invoiceItem.getProduct() != null && invoiceItem.getProduct().getUom() != null) {
                uom = invoiceItem.getProduct().getUom();
            }
            item.setUom(uom);

            // Mặc định copy số lượng từ Invoice, người dùng có thể điều chỉnh sau
            item.setQuantity(invoiceItem.getQuantity());
            item.setUnitPrice(invoiceItem.getUnitPrice());

            // Lấy discountAmount từ SalesOrderItem (ARInvoiceItem không có field này)
            BigDecimal discountAmount = BigDecimal.ZERO;
            if (invoiceItem.getSalesOrderItem() != null && invoiceItem.getSalesOrderItem().getDiscountAmount() != null) {
                discountAmount = invoiceItem.getSalesOrderItem().getDiscountAmount();
            }
            item.setDiscountAmount(discountAmount);

            item.setTaxRate(invoiceItem.getTaxRate() != null ? invoiceItem.getTaxRate() : BigDecimal.ZERO);
            items.add(item);
        }

        if (items.isEmpty()) {
            throw new IllegalStateException("Hóa đơn không có sản phẩm nào để tạo Credit Note");
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
        // 1. Tính tổng sau chiết khấu từng dòng (line discount)
        BigDecimal lineSubtotalSum = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (CreditNoteItem item : items) {
            BigDecimal lineSubtotal = item.getQuantity()
                    .multiply(item.getUnitPrice())
                    .subtract(item.getDiscountAmount())
                    .max(BigDecimal.ZERO);
            lineSubtotalSum = lineSubtotalSum.add(lineSubtotal);
            taxTotal = taxTotal.add(item.getTaxAmount());
        }

        // 2. Áp dụng chiết khấu chung (header discount) trên tổng sau line discount
        BigDecimal headerDiscountPercent = creditNote.getHeaderDiscountPercent() != null ? 
                creditNote.getHeaderDiscountPercent() : BigDecimal.ZERO;
        BigDecimal headerDiscountAmount = lineSubtotalSum
                .multiply(headerDiscountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        creditNote.setHeaderDiscountAmount(headerDiscountAmount);
        
        // 3. Tính subtotal sau header discount
        BigDecimal subtotalAfterHeaderDiscount = lineSubtotalSum.subtract(headerDiscountAmount);
        
        // 4. Thuế đã được tính trên từng dòng (sau line discount), không cần tính lại
        // 5. Tổng = subtotal sau header discount + thuế
        BigDecimal total = subtotalAfterHeaderDiscount.add(taxTotal);

        creditNote.setSubtotal(subtotalAfterHeaderDiscount.setScale(2, RoundingMode.HALF_UP));
        creditNote.setTaxAmount(taxTotal.setScale(2, RoundingMode.HALF_UP));
        creditNote.setTotalAmount(total.setScale(2, RoundingMode.HALF_UP));
    }

    private void updateInvoiceBalance(CreditNote creditNote) {
        ARInvoice invoice = creditNote.getInvoice();
        if (invoice != null) {
            // Reload invoice để đảm bảo có dữ liệu mới nhất
            ARInvoice freshInvoice = arInvoiceRepository.findById(invoice.getArInvoiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Invoice ID " + invoice.getArInvoiceId()));

            // Tính lại balance từ đầu: totalAmount - tổng Credit Notes - tổng Payments
            // Đây là cách đúng trong ERP: không trừ trực tiếp, mà tính lại từ đầu để đảm bảo chính xác
            BigDecimal balance = freshInvoice.getTotalAmount();

            // Trừ đi tất cả Credit Notes đã áp dụng (Issued hoặc Applied)
            List<CreditNote> allCreditNotes = creditNoteRepository.findByInvoice_ArInvoiceIdAndDeletedAtIsNull(freshInvoice.getArInvoiceId());
            for (CreditNote cn : allCreditNotes) {
                if (cn.getStatus() == CreditNote.CreditNoteStatus.Issued ||
                        cn.getStatus() == CreditNote.CreditNoteStatus.Applied) {
                    balance = balance.subtract(cn.getTotalAmount());
                    log.debug("Trừ Credit Note {}: -{}", cn.getCreditNoteNo(), cn.getTotalAmount());
                }
            }

            // Trừ đi tất cả Payments
            BigDecimal totalPaid = arPaymentRepository.getTotalPaidByInvoiceId(freshInvoice.getArInvoiceId());
            if (totalPaid != null && totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                balance = balance.subtract(totalPaid);
                log.debug("Trừ Payments: -{}", totalPaid);
            }

            // Đảm bảo balance không âm
            balance = balance.max(BigDecimal.ZERO);

            BigDecimal oldBalance = freshInvoice.getBalanceAmount();
            freshInvoice.setBalanceAmount(balance);

            // Cập nhật status của Invoice nếu cần
            if (balance.compareTo(BigDecimal.ZERO) == 0) {
                if (freshInvoice.getStatus() == ARInvoice.InvoiceStatus.PartiallyPaid ||
                        freshInvoice.getStatus() == ARInvoice.InvoiceStatus.Unpaid) {
                    freshInvoice.setStatus(ARInvoice.InvoiceStatus.Paid);
                }
            } else if (freshInvoice.getStatus() == ARInvoice.InvoiceStatus.Unpaid &&
                    (totalPaid != null && totalPaid.compareTo(BigDecimal.ZERO) > 0 ||
                            !allCreditNotes.isEmpty())) {
                // Nếu còn nợ nhưng đã có payment hoặc credit note, chuyển sang PartiallyPaid
                freshInvoice.setStatus(ARInvoice.InvoiceStatus.PartiallyPaid);
            }

            arInvoiceRepository.save(freshInvoice);
            log.info("Đã tính lại balance của Invoice {}: {} -> {} (Total: {}, Credit Notes: {}, Payments: {})",
                    freshInvoice.getInvoiceNo(), oldBalance, balance,
                    freshInvoice.getTotalAmount(),
                    allCreditNotes.stream()
                            .filter(cn -> cn.getStatus() == CreditNote.CreditNoteStatus.Issued ||
                                    cn.getStatus() == CreditNote.CreditNoteStatus.Applied)
                            .map(CreditNote::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add),
                    totalPaid != null ? totalPaid : BigDecimal.ZERO);
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

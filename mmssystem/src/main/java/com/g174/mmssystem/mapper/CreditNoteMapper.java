package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.CreditNoteItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.CreditNoteRequestDTO;
import com.g174.mmssystem.dto.responseDTO.CreditNoteItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.CreditNoteListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.CreditNoteResponseDTO;
import com.g174.mmssystem.entity.*;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class CreditNoteMapper {

    public CreditNote toEntity(CreditNoteRequestDTO dto, ARInvoice invoice, ReturnOrder returnOrder, User currentUser) {
        CreditNote creditNote = new CreditNote();
        creditNote.setInvoice(invoice);
        creditNote.setReturnOrder(returnOrder);
        creditNote.setCreditNoteDate(dto.getCreditNoteDate() != null
                ? dto.getCreditNoteDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC)
                : java.time.Instant.now());
        creditNote.setHeaderDiscountPercent(
                dto.getHeaderDiscountPercent() != null ? dto.getHeaderDiscountPercent() : BigDecimal.ZERO);
        creditNote.setReason(dto.getReason());
        creditNote.setNotes(dto.getNotes());
        creditNote.setCreatedBy(currentUser);
        creditNote.setUpdatedBy(currentUser);
        return creditNote;
    }

    public void updateEntity(CreditNote creditNote, CreditNoteRequestDTO dto, User currentUser) {
        if (dto.getCreditNoteDate() != null) {
            creditNote.setCreditNoteDate(dto.getCreditNoteDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
        }
        if (dto.getHeaderDiscountPercent() != null) {
            creditNote.setHeaderDiscountPercent(dto.getHeaderDiscountPercent());
        }
        creditNote.setReason(dto.getReason());
        creditNote.setNotes(dto.getNotes());
        creditNote.setUpdatedBy(currentUser);
    }

    public CreditNoteItem toItemEntity(CreditNote creditNote, CreditNoteItemRequestDTO dto, Product product) {
        CreditNoteItem item = new CreditNoteItem();
        item.setCreditNote(creditNote);
        item.setProduct(product);
        if (product != null) {
            item.setProductCode(product.getSku());
            item.setProductName(product.getName());
            item.setUom(product.getUom());
        } else {
            item.setProductCode(dto.getProductCode());
            item.setProductName(dto.getProductName());
            item.setUom(dto.getUom());
        }
        item.setQuantity(dto.getQuantity());
        item.setUnitPrice(dto.getUnitPrice());
        item.setDiscountAmount(dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO);
        item.setTaxRate(dto.getTaxRate() != null ? dto.getTaxRate() : BigDecimal.ZERO);

        // Tính toán taxAmount và lineTotal
        BigDecimal taxable = item.getQuantity()
                .multiply(item.getUnitPrice())
                .subtract(item.getDiscountAmount())
                .max(BigDecimal.ZERO);
        BigDecimal taxAmount = taxable
                .multiply(item.getTaxRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal lineTotal = taxable.add(taxAmount);

        item.setTaxAmount(taxAmount);
        item.setLineTotal(lineTotal);
        item.setNote(dto.getNote());
        return item;
    }

    public CreditNoteResponseDTO toResponse(CreditNote creditNote, List<CreditNoteItem> items) {
        ARInvoice invoice = creditNote.getInvoice();
        SalesOrder salesOrder = invoice != null ? invoice.getSalesOrder() : null;
        Customer customer = invoice != null ? invoice.getCustomer() : null;
        ReturnOrder returnOrder = creditNote.getReturnOrder();

        return CreditNoteResponseDTO.builder()
                .cnId(creditNote.getCnId())
                .creditNoteNo(creditNote.getCreditNoteNo())
                .status(creditNote.getStatus())
                .invoiceId(invoice != null ? invoice.getArInvoiceId() : null)
                .invoiceNo(invoice != null ? invoice.getInvoiceNo() : null)
                .salesOrderId(salesOrder != null ? salesOrder.getSoId() : null)
                .salesOrderNo(salesOrder != null ? salesOrder.getSoNo() : null)
                .returnOrderId(returnOrder != null ? returnOrder.getRoId() : null)
                .returnOrderNo(returnOrder != null ? returnOrder.getReturnNo() : null)
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(getCustomerName(customer))
                .creditNoteDate(creditNote.getCreditNoteDate())
                .subtotal(creditNote.getSubtotal())
                .headerDiscountPercent(creditNote.getHeaderDiscountPercent())
                .headerDiscountAmount(creditNote.getHeaderDiscountAmount())
                .taxAmount(creditNote.getTaxAmount())
                .totalAmount(creditNote.getTotalAmount())
                .appliedToBalance(creditNote.getAppliedToBalance())
                .refundAmount(creditNote.getRefundAmount())
                .refundPaidAmount(creditNote.getRefundPaidAmount())
                .reason(creditNote.getReason())
                .notes(creditNote.getNotes())
                .createdAt(creditNote.getCreatedAt())
                .createdBy(creditNote.getCreatedBy() != null ? creditNote.getCreatedBy().getEmail() : null)
                .updatedAt(creditNote.getUpdatedAt())
                .updatedBy(creditNote.getUpdatedBy() != null ? creditNote.getUpdatedBy().getEmail() : null)
                .items(items.stream().map(this::toItemResponse).collect(Collectors.toList()))
                .build();
    }

    public CreditNoteListResponseDTO toListResponse(CreditNote creditNote) {
        ARInvoice invoice = creditNote.getInvoice();
        SalesOrder salesOrder = invoice != null ? invoice.getSalesOrder() : null;
        Customer customer = invoice != null ? invoice.getCustomer() : null;
        ReturnOrder returnOrder = creditNote.getReturnOrder();
        User createdBy = creditNote.getCreatedBy();
        User updatedBy = creditNote.getUpdatedBy();

        return CreditNoteListResponseDTO.builder()
                .cnId(creditNote.getCnId())
                .creditNoteNo(creditNote.getCreditNoteNo())
                .status(creditNote.getStatus())
                .invoiceId(invoice != null ? invoice.getArInvoiceId() : null)
                .invoiceNo(invoice != null ? invoice.getInvoiceNo() : null)
                .salesOrderId(salesOrder != null ? salesOrder.getSoId() : null)
                .salesOrderNo(salesOrder != null ? salesOrder.getSoNo() : null)
                .returnOrderId(returnOrder != null ? returnOrder.getRoId() : null)
                .returnOrderNo(returnOrder != null ? returnOrder.getReturnNo() : null)
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(getCustomerName(customer))
                .creditNoteDate(creditNote.getCreditNoteDate())
                .totalAmount(creditNote.getTotalAmount())
                .appliedToBalance(creditNote.getAppliedToBalance())
                .refundAmount(creditNote.getRefundAmount())
                .refundPaidAmount(creditNote.getRefundPaidAmount())
                .createdAt(creditNote.getCreatedAt())
                .updatedAt(creditNote.getUpdatedAt())
                .createdByDisplay(buildUserDisplay(createdBy))
                .updatedByDisplay(buildUserDisplay(updatedBy))
                .build();
    }

    private String getCustomerName(Customer customer) {
        if (customer == null) {
            return null;
        }
        return customer.getFirstName() + " " + customer.getLastName();
    }

    private CreditNoteItemResponseDTO toItemResponse(CreditNoteItem item) {
        Product product = item.getProduct();

        // Tính discountPercent từ discountAmount
        BigDecimal discountPercent = BigDecimal.ZERO;
        if (item.getQuantity() != null && item.getUnitPrice() != null &&
                item.getDiscountAmount() != null && item.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal subtotal = item.getQuantity().multiply(item.getUnitPrice());
            if (subtotal.compareTo(BigDecimal.ZERO) > 0) {
                discountPercent = item.getDiscountAmount()
                        .divide(subtotal, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }
        }

        return CreditNoteItemResponseDTO.builder()
                .cniId(item.getCniId())
                .productId(product != null ? product.getProductId() : null)
                .productSku(product != null ? product.getSku() : null)
                .productCode(item.getProductCode())
                .productName(item.getProductName())
                .uom(item.getUom())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountPercent(discountPercent)
                .discountAmount(item.getDiscountAmount())
                .taxRate(item.getTaxRate())
                .taxAmount(item.getTaxAmount())
                .lineTotal(item.getLineTotal())
                .note(item.getNote())
                .build();
    }

    private String buildUserDisplay(User user) {
        if (user == null) {
            return null;
        }
        String fullName = null;
        if (user.getProfile() != null) {
            String joinedName = Stream.of(user.getProfile().getFirstName(), user.getProfile().getLastName())
                    .filter(StringUtils::hasText)
                    .collect(Collectors.joining(" "));
            if (StringUtils.hasText(joinedName)) {
                fullName = joinedName.trim();
            }
        }
        if (StringUtils.hasText(fullName)) {
            return fullName;
        }
        if (StringUtils.hasText(user.getEmployeeCode())) {
            return user.getEmployeeCode();
        }
        return user.getEmail();
    }
}

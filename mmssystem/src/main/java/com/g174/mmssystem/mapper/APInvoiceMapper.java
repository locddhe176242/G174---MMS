package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.APInvoiceItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.APInvoiceResponseDTO;
import com.g174.mmssystem.dto.responseDTO.APPaymentResponseDTO;
import com.g174.mmssystem.entity.APInvoice;
import com.g174.mmssystem.entity.APInvoiceItem;
import com.g174.mmssystem.entity.APPayment;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class APInvoiceMapper {

    public APInvoiceResponseDTO toResponseDTO(APInvoice invoice) {
        if (invoice == null) {
            return null;
        }

        return APInvoiceResponseDTO.builder()
                .apInvoiceId(invoice.getApInvoiceId())
                .invoiceNo(invoice.getInvoiceNo())
                .vendorId(invoice.getVendor() != null ? invoice.getVendor().getVendorId() : null)
                .vendorName(invoice.getVendor() != null ? invoice.getVendor().getName() : null)
                .vendorCode(invoice.getVendor() != null ? invoice.getVendor().getVendorCode() : null)
                .orderId(invoice.getPurchaseOrder() != null ? invoice.getPurchaseOrder().getOrderId() : null)
                .poNo(invoice.getPurchaseOrder() != null ? invoice.getPurchaseOrder().getPoNo() : null)
                .receiptId(invoice.getGoodsReceipt() != null ? invoice.getGoodsReceipt().getReceiptId() : null)
                .receiptNo(invoice.getGoodsReceipt() != null ? invoice.getGoodsReceipt().getReceiptNo() : null)
                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .subtotal(invoice.getSubtotal())
                .taxAmount(invoice.getTaxAmount())
                .totalAmount(invoice.getTotalAmount())
                .balanceAmount(invoice.getBalanceAmount())
                .status(invoice.getStatus())
                .notes(invoice.getNotes())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .items(invoice.getItems() != null ?
                        invoice.getItems().stream()
                                .map(this::toItemResponseDTO)
                                .collect(Collectors.toList()) : null)
                .payments(invoice.getPayments() != null ?
                        invoice.getPayments().stream()
                                .map(this::toPaymentResponseDTO)
                                .collect(Collectors.toList()) : null)
                .build();
    }

    public APInvoiceItemResponseDTO toItemResponseDTO(APInvoiceItem item) {
        if (item == null) {
            return null;
        }

        String productName = null;
        String productSku = null;

        if (item.getPurchaseOrderItem() != null && item.getPurchaseOrderItem().getProduct() != null) {
            productName = item.getPurchaseOrderItem().getProduct().getName();
            productSku = item.getPurchaseOrderItem().getProduct().getSku();
        } else if (item.getGoodsReceiptItem() != null && item.getGoodsReceiptItem().getProduct() != null) {
            productName = item.getGoodsReceiptItem().getProduct().getName();
            productSku = item.getGoodsReceiptItem().getProduct().getSku();
        }

        return APInvoiceItemResponseDTO.builder()
                .apiId(item.getApiId())
                .apInvoiceId(item.getApInvoice() != null ? item.getApInvoice().getApInvoiceId() : null)
                .poiId(item.getPurchaseOrderItem() != null ? item.getPurchaseOrderItem().getPoiId() : null)
                .griId(item.getGoodsReceiptItem() != null ? item.getGoodsReceiptItem().getGriId() : null)
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .taxRate(item.getTaxRate())
                .lineTotal(item.getLineTotal())
                .productName(productName)
                .productSku(productSku)
                .build();
    }

    public APPaymentResponseDTO toPaymentResponseDTO(APPayment payment) {
        if (payment == null) {
            return null;
        }

        return APPaymentResponseDTO.builder()
                .apPaymentId(payment.getApPaymentId())
                .apInvoiceId(payment.getApInvoice() != null ? payment.getApInvoice().getApInvoiceId() : null)
                .invoiceNo(payment.getApInvoice() != null ? payment.getApInvoice().getInvoiceNo() : null)
                .paymentDate(payment.getPaymentDate())
                .amount(payment.getAmount())
                .method(payment.getMethod())
                .referenceNo(payment.getReferenceNo())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}

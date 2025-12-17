package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.ARInvoiceItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.ARInvoiceRequestDTO;
import com.g174.mmssystem.dto.requestDTO.ARPaymentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ARInvoiceItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ARInvoiceListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ARInvoiceResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ARPaymentResponseDTO;
import com.g174.mmssystem.entity.*;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ARInvoiceMapper {

    public ARInvoice toEntity(ARInvoiceRequestDTO dto, Customer customer, SalesOrder salesOrder,
            Delivery delivery, User currentUser) {
        ARInvoice invoice = new ARInvoice();
        invoice.setCustomer(customer);
        invoice.setSalesOrder(salesOrder);
        invoice.setDelivery(delivery);
        invoice.setInvoiceDate(dto.getInvoiceDate() != null ? dto.getInvoiceDate() : java.time.LocalDate.now());
        invoice.setDueDate(dto.getDueDate());
        invoice.setNotes(dto.getNotes());
        invoice.setHeaderDiscountPercent(
                dto.getHeaderDiscountPercent() != null ? dto.getHeaderDiscountPercent() : java.math.BigDecimal.ZERO);
        // createdBy và updatedBy sẽ được set trong service
        return invoice;
    }

    public void updateEntity(ARInvoice invoice, ARInvoiceRequestDTO dto, User currentUser) {
        if (dto.getInvoiceDate() != null) {
            invoice.setInvoiceDate(dto.getInvoiceDate());
        }
        invoice.setDueDate(dto.getDueDate());
        invoice.setNotes(dto.getNotes());
        // updatedBy sẽ được set trong service
    }

    public ARInvoiceItem toItemEntity(ARInvoice invoice, ARInvoiceItemRequestDTO dto,
            DeliveryItem deliveryItem, SalesOrderItem salesOrderItem, Product product) {
        ARInvoiceItem item = new ARInvoiceItem();
        item.setInvoice(invoice);
        item.setDeliveryItem(deliveryItem);
        item.setSalesOrderItem(salesOrderItem);
        item.setProduct(product);
        item.setDescription(dto.getDescription());
        item.setQuantity(dto.getQuantity());
        item.setUnitPrice(dto.getUnitPrice());
        item.setTaxRate(dto.getTaxRate() != null ? dto.getTaxRate() : java.math.BigDecimal.ZERO);
        item.setTaxAmount(dto.getTaxAmount() != null ? dto.getTaxAmount() : java.math.BigDecimal.ZERO);
        item.setLineTotal(dto.getLineTotal());
        return item;
    }

    public ARPayment toPaymentEntity(ARPaymentRequestDTO dto, ARInvoice invoice) {
        ARPayment payment = new ARPayment();
        payment.setInvoice(invoice);
        payment.setAmount(dto.getAmount());
        payment.setPaymentDate(dto.getPaymentDate() != null ? dto.getPaymentDate() : java.time.Instant.now());
        payment.setMethod(dto.getMethod());
        payment.setReferenceNo(dto.getReferenceNo());
        payment.setNotes(dto.getNotes());
        return payment;
    }

    public ARInvoiceResponseDTO toResponse(ARInvoice invoice, List<ARInvoiceItem> items, List<ARPayment> payments) {
        Customer customer = invoice.getCustomer();
        SalesOrder salesOrder = invoice.getSalesOrder();
        Delivery delivery = invoice.getDelivery();
        User createdBy = invoice.getCreatedBy();
        User updatedBy = invoice.getUpdatedBy();

        return ARInvoiceResponseDTO.builder()
                .arInvoiceId(invoice.getArInvoiceId())
                .invoiceNo(invoice.getInvoiceNo())
                .status(invoice.getStatus())
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(getCustomerName(customer))
                .customerCode(customer != null ? customer.getCustomerCode() : null)
                .salesOrderId(salesOrder != null ? salesOrder.getSoId() : null)
                .salesOrderNo(salesOrder != null ? salesOrder.getSoNo() : null)
                .deliveryId(delivery != null ? delivery.getDeliveryId() : null)
                .deliveryNo(delivery != null ? delivery.getDeliveryNo() : null)
                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .subtotal(invoice.getSubtotal())
                .headerDiscountPercent(invoice.getHeaderDiscountPercent())
                .headerDiscountAmount(invoice.getHeaderDiscountAmount())
                .taxAmount(invoice.getTaxAmount())
                .totalAmount(invoice.getTotalAmount())
                .balanceAmount(invoice.getBalanceAmount())
                .notes(invoice.getNotes())
                .createdAt(invoice.getCreatedAt())
                .createdBy(createdBy != null ? createdBy.getEmail() : null)
                .createdByDisplay(buildUserDisplay(createdBy))
                .updatedAt(invoice.getUpdatedAt())
                .updatedBy(updatedBy != null ? updatedBy.getEmail() : null)
                .updatedByDisplay(buildUserDisplay(updatedBy))
                .items(items != null ? items.stream().map(this::toItemResponse).collect(Collectors.toList()) : null)
                .payments(payments != null ? payments.stream().map(this::toPaymentResponse).collect(Collectors.toList())
                        : null)
                .build();
    }

    public ARInvoiceListResponseDTO toListResponse(ARInvoice invoice) {
        Customer customer = invoice.getCustomer();
        SalesOrder salesOrder = invoice.getSalesOrder();
        Delivery delivery = invoice.getDelivery();
        User createdBy = invoice.getCreatedBy();
        User updatedBy = invoice.getUpdatedBy();

        return ARInvoiceListResponseDTO.builder()
                .arInvoiceId(invoice.getArInvoiceId())
                .invoiceNo(invoice.getInvoiceNo())
                .status(invoice.getStatus())
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(getCustomerName(customer))
                .salesOrderId(salesOrder != null ? salesOrder.getSoId() : null)
                .salesOrderNo(salesOrder != null ? salesOrder.getSoNo() : null)
                .deliveryId(delivery != null ? delivery.getDeliveryId() : null)
                .deliveryNo(delivery != null ? delivery.getDeliveryNo() : null)
                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .totalAmount(invoice.getTotalAmount())
                .balanceAmount(invoice.getBalanceAmount())
                .createdAt(invoice.getCreatedAt())
                .createdByDisplay(buildUserDisplay(createdBy))
                .updatedAt(invoice.getUpdatedAt())
                .updatedByDisplay(buildUserDisplay(updatedBy))
                .build();
    }

    public ARInvoiceItemResponseDTO toItemResponse(ARInvoiceItem item) {
        Product product = item.getProduct();
        DeliveryItem deliveryItem = item.getDeliveryItem();
        SalesOrderItem salesOrderItem = item.getSalesOrderItem();

        // Tính discountPercent từ SalesOrderItem
        BigDecimal discountPercent = BigDecimal.ZERO;
        if (salesOrderItem != null && salesOrderItem.getDiscountAmount() != null
                && salesOrderItem.getQuantity() != null && salesOrderItem.getUnitPrice() != null) {
            BigDecimal soSubtotal = salesOrderItem.getQuantity().multiply(salesOrderItem.getUnitPrice());
            if (soSubtotal.compareTo(BigDecimal.ZERO) > 0) {
                discountPercent = salesOrderItem.getDiscountAmount()
                        .divide(soSubtotal, 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }
        }

        return ARInvoiceItemResponseDTO.builder()
                .ariId(item.getAriId())
                .deliveryItemId(deliveryItem != null ? deliveryItem.getDiId() : null)
                .salesOrderItemId(salesOrderItem != null ? salesOrderItem.getSoiId() : null)
                .productId(product != null ? product.getProductId() : null)
                .productSku(product != null ? product.getSku() : null)
                .productName(product != null ? product.getName() : null)
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountPercent(discountPercent)
                .taxRate(item.getTaxRate())
                .taxAmount(item.getTaxAmount())
                .lineTotal(item.getLineTotal())
                .build();
    }

    public ARPaymentResponseDTO toPaymentResponse(ARPayment payment) {
        ARInvoice invoice = payment.getInvoice();

        return ARPaymentResponseDTO.builder()
                .arPaymentId(payment.getArPaymentId())
                .arInvoiceId(invoice != null ? invoice.getArInvoiceId() : null)
                .invoiceNo(invoice != null ? invoice.getInvoiceNo() : null)
                .amount(payment.getAmount())
                .paymentDate(payment.getPaymentDate())
                .method(payment.getMethod())
                .referenceNo(payment.getReferenceNo())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    private String getCustomerName(Customer customer) {
        if (customer == null)
            return null;
        String firstName = customer.getFirstName();
        String lastName = customer.getLastName();
        if (StringUtils.hasText(firstName) || StringUtils.hasText(lastName)) {
            return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "").trim();
        }
        return customer.getCustomerCode();
    }

    private String buildUserDisplay(User user) {
        if (user == null)
            return null;
        if (user.getProfile() != null) {
            String firstName = user.getProfile().getFirstName();
            String lastName = user.getProfile().getLastName();
            if (StringUtils.hasText(firstName) || StringUtils.hasText(lastName)) {
                String name = (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
                if (StringUtils.hasText(name.trim())) {
                    return name.trim();
                }
            }
        }
        if (StringUtils.hasText(user.getEmployeeCode())) {
            return user.getEmployeeCode();
        }
        return user.getEmail();
    }
}

package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.SalesOrderItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.SalesOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderResponseDTO;
import com.g174.mmssystem.entity.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class SalesOrderMapper {

    public SalesOrder toEntity(SalesOrderRequestDTO dto, Customer customer, SalesQuotation quotation, User currentUser) {
        SalesOrder order = new SalesOrder();
        order.setCustomer(customer);
        order.setSalesQuotation(quotation);
        order.setOrderDate(dto.getOrderDate() != null ? dto.getOrderDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC) : Instant.now());
        order.setShippingAddress(dto.getShippingAddress());
        order.setPaymentTerms(dto.getPaymentTerms());
        order.setNotes(dto.getNotes());
        order.setCreatedBy(currentUser);
        order.setUpdatedBy(currentUser);
        return order;
    }

    public void updateEntity(SalesOrder order, SalesOrderRequestDTO dto, Customer customer, SalesQuotation quotation, User currentUser) {
        order.setCustomer(customer);
        order.setSalesQuotation(quotation);
        if (dto.getOrderDate() != null) {
            order.setOrderDate(dto.getOrderDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
        }
        order.setShippingAddress(dto.getShippingAddress());
        order.setPaymentTerms(dto.getPaymentTerms());
        order.setNotes(dto.getNotes());
        order.setUpdatedBy(currentUser);
    }

    public SalesOrderItem toItemEntity(SalesOrder order, SalesOrderItemRequestDTO dto, Product product, Warehouse warehouse) {
        SalesOrderItem item = new SalesOrderItem();
        item.setSalesOrder(order);
        item.setProduct(product);
        item.setWarehouse(warehouse);
        if (product != null) {
            item.setUom(product.getUom());
        } else {
            item.setUom(dto.getUom());
        }
        item.setQuantity(dto.getQuantity());
        item.setUnitPrice(dto.getUnitPrice());
        item.setTaxRate(dto.getTaxRate());
        item.setNote(dto.getNote());
        return item;
    }

    public SalesOrderResponseDTO toResponse(SalesOrder order, List<SalesOrderItem> items) {
        return SalesOrderResponseDTO.builder()
                .orderId(order.getSoId())
                .orderNo(order.getSoNo())
                .status(order.getStatus())
                .approvalStatus(order.getApprovalStatus())
                .customerId(order.getCustomer() != null ? order.getCustomer().getCustomerId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName() : null)
                .customerCode(order.getCustomer() != null ? order.getCustomer().getCustomerCode() : null)
                .quotationId(order.getSalesQuotation() != null ? order.getSalesQuotation().getSqId() : null)
                .orderDate(order.getOrderDate())
                .shippingAddress(order.getShippingAddress())
                .paymentTerms(order.getPaymentTerms())
                .subtotal(order.getSubtotal())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .createdBy(order.getCreatedBy() != null ? order.getCreatedBy().getEmail() : null)
                .updatedAt(order.getUpdatedAt())
                .updatedBy(order.getUpdatedBy() != null ? order.getUpdatedBy().getEmail() : null)
                .items(items.stream().map(this::toItemResponse).collect(Collectors.toList()))
                .build();
    }

    public SalesOrderListResponseDTO toListResponse(SalesOrder order) {
        return SalesOrderListResponseDTO.builder()
                .orderId(order.getSoId())
                .orderNo(order.getSoNo())
                .status(order.getStatus())
                .approvalStatus(order.getApprovalStatus())
                .customerId(order.getCustomer() != null ? order.getCustomer().getCustomerId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName() : null)
                .orderDate(order.getOrderDate())
                .totalAmount(order.getTotalAmount())
                .build();
    }

    private SalesOrderItemResponseDTO toItemResponse(SalesOrderItem item) {
        Product product = item.getProduct();
        Warehouse warehouse = item.getWarehouse();
        return SalesOrderItemResponseDTO.builder()
                .soiId(item.getSoiId())
                .productId(product != null ? product.getProductId() : null)
                .productSku(product != null ? product.getSku() : null)
                .productName(product != null ? product.getName() : null)
                .warehouseId(warehouse != null ? warehouse.getWarehouseId() : null)
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .uom(item.getUom())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountAmount(item.getDiscountAmount())
                .taxRate(item.getTaxRate())
                .taxAmount(item.getTaxAmount())
                .lineTotal(item.getLineTotal())
                .note(item.getNote())
                .build();
    }

    public SalesOrderItemResponseDTO toItemResponseDTO(SalesOrderItem item) {
        return toItemResponse(item);
    }

    public List<SalesOrderItemResponseDTO> toItemResponseList(List<SalesOrderItem> items) {
        return items.stream().map(this::toItemResponse).collect(Collectors.toList());
    }
}


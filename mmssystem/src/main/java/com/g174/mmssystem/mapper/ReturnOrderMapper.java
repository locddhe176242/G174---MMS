package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.ReturnOrderItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.ReturnOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ReturnOrderItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ReturnOrderListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ReturnOrderResponseDTO;
import com.g174.mmssystem.entity.*;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class ReturnOrderMapper {

    public ReturnOrder toEntity(ReturnOrderRequestDTO dto, Delivery delivery, ARInvoice invoice, Warehouse warehouse, User currentUser) {
        ReturnOrder returnOrder = new ReturnOrder();
        returnOrder.setDelivery(delivery);
        returnOrder.setInvoice(invoice);
        returnOrder.setWarehouse(warehouse);
        returnOrder.setReturnDate(dto.getReturnDate() != null ?
                dto.getReturnDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC) : Instant.now());
        returnOrder.setReason(dto.getReason());
        returnOrder.setNotes(dto.getNotes());
        returnOrder.setCreatedBy(currentUser);
        returnOrder.setUpdatedBy(currentUser);
        return returnOrder;
    }

    public void updateEntity(ReturnOrder returnOrder, ReturnOrderRequestDTO dto, Warehouse warehouse, User currentUser) {
        returnOrder.setWarehouse(warehouse);
        if (dto.getReturnDate() != null) {
            returnOrder.setReturnDate(dto.getReturnDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
        }
        returnOrder.setReason(dto.getReason());
        returnOrder.setNotes(dto.getNotes());
        returnOrder.setUpdatedBy(currentUser);
    }

    public ReturnOrderItem toItemEntity(ReturnOrder returnOrder, ReturnOrderItemRequestDTO dto,
                                        DeliveryItem deliveryItem, Product product, Warehouse warehouse) {
        ReturnOrderItem item = new ReturnOrderItem();
        item.setReturnOrder(returnOrder);
        item.setDeliveryItem(deliveryItem);
        item.setProduct(product);
        item.setWarehouse(warehouse);
        item.setReturnedQty(dto.getReturnedQty());
        if (product != null) {
            item.setUom(product.getUom());
        } else if (deliveryItem != null) {
            item.setUom(deliveryItem.getUom());
        }
        item.setReason(dto.getReason());
        item.setNote(dto.getNote());
        return item;
    }

    public ReturnOrderResponseDTO toResponse(ReturnOrder returnOrder, List<ReturnOrderItem> items) {
        Delivery delivery = returnOrder.getDelivery();
        SalesOrder salesOrder = delivery != null ? delivery.getSalesOrder() : null;
        Customer customer = salesOrder != null ? salesOrder.getCustomer() : null;
        ARInvoice invoice = returnOrder.getInvoice();
        Warehouse warehouse = returnOrder.getWarehouse();

        return ReturnOrderResponseDTO.builder()
                .roId(returnOrder.getRoId())
                .returnNo(returnOrder.getReturnNo())
                .status(returnOrder.getStatus())
                .deliveryId(delivery != null ? delivery.getDeliveryId() : null)
                .deliveryNo(delivery != null ? delivery.getDeliveryNo() : null)
                .salesOrderId(salesOrder != null ? salesOrder.getSoId() : null)
                .salesOrderNo(salesOrder != null ? salesOrder.getSoNo() : null)
                .invoiceId(invoice != null ? invoice.getArInvoiceId() : null)
                .invoiceNo(invoice != null ? invoice.getInvoiceNo() : null)
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(getCustomerName(customer))
                .warehouseId(warehouse != null ? warehouse.getWarehouseId() : null)
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .returnDate(returnOrder.getReturnDate())
                .reason(returnOrder.getReason())
                .notes(returnOrder.getNotes())
                .createdAt(returnOrder.getCreatedAt())
                .createdBy(returnOrder.getCreatedBy() != null ? returnOrder.getCreatedBy().getEmail() : null)
                .updatedAt(returnOrder.getUpdatedAt())
                .updatedBy(returnOrder.getUpdatedBy() != null ? returnOrder.getUpdatedBy().getEmail() : null)
                .items(items.stream().map(this::toItemResponse).collect(Collectors.toList()))
                .build();
    }

    public ReturnOrderListResponseDTO toListResponse(ReturnOrder returnOrder, List<ReturnOrderItem> items) {
        Delivery delivery = returnOrder.getDelivery();
        SalesOrder salesOrder = delivery != null ? delivery.getSalesOrder() : null;
        Customer customer = salesOrder != null ? salesOrder.getCustomer() : null;
        ARInvoice invoice = returnOrder.getInvoice();
        Warehouse warehouse = returnOrder.getWarehouse();
        User createdBy = returnOrder.getCreatedBy();
        User updatedBy = returnOrder.getUpdatedBy();

        // Tính tổng tiền từ items
        java.math.BigDecimal totalAmount = java.math.BigDecimal.ZERO;
        if (items != null && !items.isEmpty()) {
            for (ReturnOrderItem item : items) {
                DeliveryItem deliveryItem = item.getDeliveryItem();
                SalesOrderItem salesOrderItem = deliveryItem != null ? deliveryItem.getSalesOrderItem() : null;
                
                if (salesOrderItem != null) {
                    java.math.BigDecimal unitPrice = salesOrderItem.getUnitPrice() != null 
                            ? salesOrderItem.getUnitPrice() : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal discountAmount = salesOrderItem.getDiscountAmount() != null 
                            ? salesOrderItem.getDiscountAmount() : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal taxRate = salesOrderItem.getTaxRate() != null 
                            ? salesOrderItem.getTaxRate() : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal returnedQty = item.getReturnedQty() != null 
                            ? item.getReturnedQty() : java.math.BigDecimal.ZERO;
                    
                    // Tính theo công thức: (returnedQty * unitPrice - discountAmount) * (1 + taxRate / 100)
                    // Tương tự như cách tính trong SalesOrderServiceImpl
                    java.math.BigDecimal lineSubtotal = returnedQty.multiply(unitPrice);
                    java.math.BigDecimal lineTaxable = lineSubtotal.subtract(discountAmount);
                    // Đảm bảo lineTaxable không âm
                    if (lineTaxable.compareTo(java.math.BigDecimal.ZERO) < 0) {
                        lineTaxable = java.math.BigDecimal.ZERO;
                    }
                    
                    // Tính thuế: lineTaxable * taxRate / 100
                    java.math.BigDecimal taxAmount = lineTaxable.multiply(taxRate)
                            .divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                    
                    // Tổng tiền dòng = lineTaxable + taxAmount
                    java.math.BigDecimal lineTotal = lineTaxable.add(taxAmount);
                    
                    totalAmount = totalAmount.add(lineTotal);
                }
            }
        }

        return ReturnOrderListResponseDTO.builder()
                .roId(returnOrder.getRoId())
                .returnNo(returnOrder.getReturnNo())
                .status(returnOrder.getStatus())
                .goodsReceiptStatus(returnOrder.getGoodsReceiptStatus())
                .deliveryId(delivery != null ? delivery.getDeliveryId() : null)
                .deliveryNo(delivery != null ? delivery.getDeliveryNo() : null)
                .salesOrderId(salesOrder != null ? salesOrder.getSoId() : null)
                .salesOrderNo(salesOrder != null ? salesOrder.getSoNo() : null)
                .invoiceId(invoice != null ? invoice.getArInvoiceId() : null)
                .invoiceNo(invoice != null ? invoice.getInvoiceNo() : null)
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(getCustomerName(customer))
                .warehouseId(warehouse != null ? warehouse.getWarehouseId() : null)
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .returnDate(returnOrder.getReturnDate())
                .createdAt(returnOrder.getCreatedAt())
                .updatedAt(returnOrder.getUpdatedAt())
                .createdByDisplay(buildUserDisplay(createdBy))
                .updatedByDisplay(buildUserDisplay(updatedBy))
                .totalAmount(totalAmount)
                .build();
    }
    
    // Overload method để backward compatibility (nếu không có items)
    public ReturnOrderListResponseDTO toListResponse(ReturnOrder returnOrder) {
        return toListResponse(returnOrder, null);
    }

    private String getCustomerName(Customer customer) {
        if (customer == null) {
            return null;
        }
        return customer.getFirstName() + " " + customer.getLastName();
    }

    private ReturnOrderItemResponseDTO toItemResponse(ReturnOrderItem item) {
        DeliveryItem deliveryItem = item.getDeliveryItem();
        SalesOrderItem salesOrderItem = deliveryItem != null ? deliveryItem.getSalesOrderItem() : null;
        Product product = item.getProduct();
        Warehouse warehouse = item.getWarehouse();

        // Lấy giá từ Sales Order Item
        java.math.BigDecimal unitPrice = salesOrderItem != null ? salesOrderItem.getUnitPrice() : null;
        java.math.BigDecimal discountAmount = salesOrderItem != null && salesOrderItem.getDiscountAmount() != null 
                ? salesOrderItem.getDiscountAmount() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal taxRate = salesOrderItem != null && salesOrderItem.getTaxRate() != null 
                ? salesOrderItem.getTaxRate() : java.math.BigDecimal.ZERO;

        return ReturnOrderItemResponseDTO.builder()
                .roiId(item.getRoiId())
                .deliveryItemId(deliveryItem != null ? deliveryItem.getDiId() : null)
                .productId(product != null ? product.getProductId() : null)
                .productSku(product != null ? product.getSku() : null)
                .productCode(product != null ? product.getSku() : null)
                .productName(product != null ? product.getName() : null)
                .warehouseId(warehouse != null ? warehouse.getWarehouseId() : null)
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .returnedQty(item.getReturnedQty())
                .uom(item.getUom())
                .unitPrice(unitPrice)
                .discountAmount(discountAmount)
                .taxRate(taxRate)
                .reason(item.getReason())
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


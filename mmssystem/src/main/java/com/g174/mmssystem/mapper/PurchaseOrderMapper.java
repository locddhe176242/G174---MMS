package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.PurchaseOrderItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseOrderResponseDTO;
import com.g174.mmssystem.entity.PurchaseOrder;
import com.g174.mmssystem.entity.PurchaseOrderItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PurchaseOrderMapper {

    public PurchaseOrderResponseDTO toResponseDTO(PurchaseOrder order) {
        if (order == null) {
            return null;
        }

        PurchaseOrderResponseDTO dto = PurchaseOrderResponseDTO.builder()
                .orderId(order.getOrderId())
                .poNo(order.getPoNo())
                .vendorId(order.getVendor() != null ? order.getVendor().getVendorId() : null)
                .vendorName(order.getVendor() != null ? order.getVendor().getName() : null)
                .vendorCode(order.getVendor() != null ? order.getVendor().getVendorCode() : null)
                .pqId(order.getPurchaseQuotation() != null ? order.getPurchaseQuotation().getPqId() : null)
                .pqNo(order.getPurchaseQuotation() != null ? order.getPurchaseQuotation().getPqNo() : null)
                .orderDate(order.getOrderDate())
                .status(order.getStatus())
                .approvalStatus(order.getApprovalStatus())
                .approverId(order.getApprover() != null ? order.getApprover().getId() : null)
                .approverName(order.getApprover() != null && order.getApprover().getProfile() != null
                        ? (order.getApprover().getProfile().getFirstName() + " " +
                           order.getApprover().getProfile().getLastName()).trim()
                        : null)
                .approvedAt(order.getApprovedAt())
                .paymentTerms(order.getPaymentTerms())
                .deliveryDate(order.getDeliveryDate())
                .shippingAddress(order.getShippingAddress())
                .headerDiscount(order.getHeaderDiscount())
                .totalBeforeTax(order.getTotalBeforeTax())
                .taxAmount(order.getTaxAmount())
                .totalAfterTax(order.getTotalAfterTax())
                .createdById(order.getCreatedBy() != null ? order.getCreatedBy().getId() : null)
                .createdByName(order.getCreatedBy() != null && order.getCreatedBy().getProfile() != null
                        ? (order.getCreatedBy().getProfile().getFirstName() + " " +
                           order.getCreatedBy().getProfile().getLastName()).trim()
                        : null)
                .updatedById(order.getUpdatedBy() != null ? order.getUpdatedBy().getId() : null)
                .updatedByName(order.getUpdatedBy() != null && order.getUpdatedBy().getProfile() != null
                        ? (order.getUpdatedBy().getProfile().getFirstName() + " " +
                           order.getUpdatedBy().getProfile().getLastName()).trim()
                        : null)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();

        // Map items if they exist
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            dto.setItems(toItemResponseDTOList(order.getItems()));
        }

        return dto;
    }

    public PurchaseOrderItemResponseDTO toItemResponseDTO(PurchaseOrderItem item) {
        if (item == null) {
            return null;
        }

        return PurchaseOrderItemResponseDTO.builder()
                .poiId(item.getPoiId())
                .orderId(item.getPurchaseOrder() != null ? item.getPurchaseOrder().getOrderId() : null)
                .pqItemId(item.getPurchaseQuotationItem() != null ? item.getPurchaseQuotationItem().getPqItemId() : null)
                .productId(item.getProduct() != null ? item.getProduct().getProductId() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .productCode(item.getProduct() != null ? item.getProduct().getSku() : null)
                .uom(item.getUom())
                .quantity(item.getQuantity())
                .receivedQty(item.getReceivedQty())
                .unitPrice(item.getUnitPrice())
                .discountPercent(item.getDiscountPercent())
                .taxRate(item.getTaxRate())
                .taxAmount(item.getTaxAmount())
                .lineTotal(item.getLineTotal())
                .deliveryDate(item.getDeliveryDate())
                .note(item.getNote())
                .build();
    }

    public List<PurchaseOrderItemResponseDTO> toItemResponseDTOList(List<PurchaseOrderItem> items) {
        if (items == null) {
            return null;
        }

        return items.stream()
                .map(this::toItemResponseDTO)
                .collect(Collectors.toList());
    }

    public List<PurchaseOrderResponseDTO> toResponseDTOList(List<PurchaseOrder> orders) {
        if (orders == null) {
            return null;
        }

        return orders.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}


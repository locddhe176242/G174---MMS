package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.InboundDeliveryItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.InboundDeliveryListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.InboundDeliveryResponseDTO;
import com.g174.mmssystem.entity.InboundDelivery;
import com.g174.mmssystem.entity.InboundDeliveryItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class InboundDeliveryMapper {

    public InboundDeliveryResponseDTO toResponseDTO(InboundDelivery inboundDelivery) {
        if (inboundDelivery == null) {
            return null;
        }

        InboundDeliveryResponseDTO dto = InboundDeliveryResponseDTO.builder()
                .inboundDeliveryId(inboundDelivery.getInboundDeliveryId())
                .inboundDeliveryNo(inboundDelivery.getInboundDeliveryNo())
                .orderId(inboundDelivery.getPurchaseOrder() != null ? inboundDelivery.getPurchaseOrder().getOrderId() : null)
                .poNo(inboundDelivery.getPurchaseOrder() != null ? inboundDelivery.getPurchaseOrder().getPoNo() : null)
                .warehouseId(inboundDelivery.getWarehouse() != null ? inboundDelivery.getWarehouse().getWarehouseId() : null)
                .warehouseName(inboundDelivery.getWarehouse() != null ? inboundDelivery.getWarehouse().getName() : null)
                .warehouseCode(inboundDelivery.getWarehouse() != null ? inboundDelivery.getWarehouse().getCode() : null)
                .plannedDate(inboundDelivery.getPlannedDate())
                .vendorId(inboundDelivery.getVendor() != null ? inboundDelivery.getVendor().getVendorId() : null)
                .vendorName(inboundDelivery.getVendor() != null ? inboundDelivery.getVendor().getName() : null)
                .vendorCode(inboundDelivery.getVendor() != null ? inboundDelivery.getVendor().getVendorCode() : null)
                .shippingAddress(inboundDelivery.getShippingAddress())
                .status(inboundDelivery.getStatus())
                .notes(inboundDelivery.getNotes())
                .createdById(inboundDelivery.getCreatedBy() != null ? inboundDelivery.getCreatedBy().getId() : null)
                .createdByName(inboundDelivery.getCreatedBy() != null && inboundDelivery.getCreatedBy().getProfile() != null
                        ? (inboundDelivery.getCreatedBy().getProfile().getFirstName() + " " +
                           inboundDelivery.getCreatedBy().getProfile().getLastName()).trim()
                        : null)
                .updatedById(inboundDelivery.getUpdatedBy() != null ? inboundDelivery.getUpdatedBy().getId() : null)
                .updatedByName(inboundDelivery.getUpdatedBy() != null && inboundDelivery.getUpdatedBy().getProfile() != null
                        ? (inboundDelivery.getUpdatedBy().getProfile().getFirstName() + " " +
                           inboundDelivery.getUpdatedBy().getProfile().getLastName()).trim()
                        : null)
                .createdAt(inboundDelivery.getCreatedAt())
                .updatedAt(inboundDelivery.getUpdatedAt())
                .build();

        // Map items if they exist
        if (inboundDelivery.getItems() != null && !inboundDelivery.getItems().isEmpty()) {
            dto.setItems(toItemResponseDTOList(inboundDelivery.getItems()));
        }

        // Check if has goods receipt
        dto.setHasGoodsReceipt(inboundDelivery.getGoodsReceipts() != null && !inboundDelivery.getGoodsReceipts().isEmpty());

        return dto;
    }

    public InboundDeliveryListResponseDTO toListResponseDTO(InboundDelivery inboundDelivery) {
        if (inboundDelivery == null) {
            return null;
        }

        return InboundDeliveryListResponseDTO.builder()
                .inboundDeliveryId(inboundDelivery.getInboundDeliveryId())
                .inboundDeliveryNo(inboundDelivery.getInboundDeliveryNo())
                .poNo(inboundDelivery.getPurchaseOrder() != null ? inboundDelivery.getPurchaseOrder().getPoNo() : null)
                .warehouseName(inboundDelivery.getWarehouse() != null ? inboundDelivery.getWarehouse().getName() : null)
                .vendorName(inboundDelivery.getVendor() != null ? inboundDelivery.getVendor().getName() : null)
                .plannedDate(inboundDelivery.getPlannedDate())
                .status(inboundDelivery.getStatus())
                .createdAt(inboundDelivery.getCreatedAt())
                .createdByName(inboundDelivery.getCreatedBy() != null && inboundDelivery.getCreatedBy().getProfile() != null
                        ? (inboundDelivery.getCreatedBy().getProfile().getFirstName() + " " +
                           inboundDelivery.getCreatedBy().getProfile().getLastName()).trim()
                        : null)
                .totalItems(0)  // Will be set by service layer
                .receivedItems(0)  // Will be set by service layer
                .build();
    }

    public InboundDeliveryItemResponseDTO toItemResponseDTO(InboundDeliveryItem item) {
        if (item == null) {
            return null;
        }

        // Calculate received quantity by summing all GoodsReceiptItems that reference this InboundDeliveryItem
        java.math.BigDecimal receivedQty = java.math.BigDecimal.ZERO;
        // Note: We don't fetch GoodsReceiptItems here to avoid N+1 queries
        // If needed, the service layer should fetch with JOIN FETCH

        return InboundDeliveryItemResponseDTO.builder()
                .idiId(item.getIdiId())
                .inboundDeliveryId(item.getInboundDelivery() != null ? item.getInboundDelivery().getInboundDeliveryId() : null)
                .poiId(item.getPurchaseOrderItem() != null ? item.getPurchaseOrderItem().getPoiId() : null)
                .productId(item.getProduct() != null ? item.getProduct().getProductId() : null)
                .productSku(item.getProduct() != null ? item.getProduct().getSku() : null)
                .productCode(item.getProduct() != null ? item.getProduct().getSku() : null) // Same as productSku
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .orderedQty(item.getPurchaseOrderItem() != null ? item.getPurchaseOrderItem().getQuantity() : null)
                .expectedQty(item.getExpectedQty())
                .receivedQty(receivedQty) // Will be calculated in service layer
                .uom(item.getUom())
                .notes(item.getNotes())
                .build();
    }

    public List<InboundDeliveryResponseDTO> toResponseDTOList(List<InboundDelivery> deliveries) {
        if (deliveries == null || deliveries.isEmpty()) {
            return List.of();
        }
        return deliveries.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<InboundDeliveryListResponseDTO> toListResponseDTOList(List<InboundDelivery> deliveries) {
        if (deliveries == null || deliveries.isEmpty()) {
            return List.of();
        }
        return deliveries.stream()
                .map(this::toListResponseDTO)
                .collect(Collectors.toList());
    }

    public List<InboundDeliveryItemResponseDTO> toItemResponseDTOList(List<InboundDeliveryItem> items) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        return items.stream()
                .map(this::toItemResponseDTO)
                .collect(Collectors.toList());
    }
}

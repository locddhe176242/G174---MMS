package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.GoodsReceiptItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.GoodsReceiptResponseDTO;
import com.g174.mmssystem.entity.GoodsReceipt;
import com.g174.mmssystem.entity.GoodsReceiptItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class GoodsReceiptMapper {

    public GoodsReceiptResponseDTO toResponseDTO(GoodsReceipt receipt) {
        if (receipt == null) {
            return null;
        }

        GoodsReceiptResponseDTO dto = GoodsReceiptResponseDTO.builder()
                .receiptId(receipt.getReceiptId())
                .receiptNo(receipt.getReceiptNo())
                .orderId(receipt.getPurchaseOrder() != null ? receipt.getPurchaseOrder().getOrderId() : null)
                .poNo(receipt.getPurchaseOrder() != null ? receipt.getPurchaseOrder().getPoNo() : null)
                .warehouseId(receipt.getWarehouse() != null ? receipt.getWarehouse().getWarehouseId() : null)
                .warehouseName(receipt.getWarehouse() != null ? receipt.getWarehouse().getName() : null)
                .warehouseCode(receipt.getWarehouse() != null ? receipt.getWarehouse().getCode() : null)
                .receivedDate(receipt.getReceivedDate())
                .status(receipt.getStatus())
                .createdById(receipt.getCreatedBy() != null ? receipt.getCreatedBy().getId() : null)
                .createdByName(receipt.getCreatedBy() != null && receipt.getCreatedBy().getProfile() != null
                        ? (receipt.getCreatedBy().getProfile().getFirstName() + " " +
                           receipt.getCreatedBy().getProfile().getLastName()).trim()
                        : null)
                .approvedById(receipt.getApprovedBy() != null ? receipt.getApprovedBy().getId() : null)
                .approvedByName(receipt.getApprovedBy() != null && receipt.getApprovedBy().getProfile() != null
                        ? (receipt.getApprovedBy().getProfile().getFirstName() + " " +
                           receipt.getApprovedBy().getProfile().getLastName()).trim()
                        : null)
                .approvedAt(receipt.getApprovedAt())
                .createdAt(receipt.getCreatedAt())
                .updatedAt(receipt.getUpdatedAt())
                .build();

        // Map items if they exist
        if (receipt.getItems() != null && !receipt.getItems().isEmpty()) {
            dto.setItems(toItemResponseDTOList(receipt.getItems()));
        }

        // Calculate progress info from PurchaseOrder
        if (receipt.getPurchaseOrder() != null) {
            dto.setPoStatus(receipt.getPurchaseOrder().getStatus() != null 
                ? receipt.getPurchaseOrder().getStatus().toString() 
                : null);
            
            if (receipt.getPurchaseOrder().getItems() != null) {
                double totalOrdered = receipt.getPurchaseOrder().getItems().stream()
                    .mapToDouble(item -> item.getQuantity() != null ? item.getQuantity().doubleValue() : 0.0)
                    .sum();
                
                double totalReceived = receipt.getPurchaseOrder().getItems().stream()
                    .mapToDouble(item -> item.getReceivedQty() != null ? item.getReceivedQty().doubleValue() : 0.0)
                    .sum();
                
                dto.setTotalOrderedQty(totalOrdered);
                dto.setTotalReceivedQty(totalReceived);
            }
        }

        return dto;
    }

    public GoodsReceiptItemResponseDTO toItemResponseDTO(GoodsReceiptItem item) {
        if (item == null) {
            return null;
        }

        GoodsReceiptItemResponseDTO.GoodsReceiptItemResponseDTOBuilder builder = GoodsReceiptItemResponseDTO.builder()
                .griId(item.getGriId())
                .receiptId(item.getGoodsReceipt() != null ? item.getGoodsReceipt().getReceiptId() : null)
                .poiId(item.getPurchaseOrderItem() != null ? item.getPurchaseOrderItem().getPoiId() : null)
                .productId(item.getProduct() != null ? item.getProduct().getProductId() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .productCode(item.getProduct() != null ? item.getProduct().getSku() : null)
                .receivedQty(item.getReceivedQty())
                .acceptedQty(item.getAcceptedQty())
                .remark(item.getRemark());

        // Get additional info from PurchaseOrderItem if available
        if (item.getPurchaseOrderItem() != null) {
            builder.uom(item.getPurchaseOrderItem().getUom())
                   .unitPrice(item.getPurchaseOrderItem().getUnitPrice())
                   .discountPercent(item.getPurchaseOrderItem().getDiscountPercent())
                   .taxRate(item.getPurchaseOrderItem().getTaxRate());
        }

        return builder.build();
    }

    public List<GoodsReceiptItemResponseDTO> toItemResponseDTOList(List<GoodsReceiptItem> items) {
        if (items == null) {
            return null;
        }

        return items.stream()
                .map(this::toItemResponseDTO)
                .collect(Collectors.toList());
    }

    public List<GoodsReceiptResponseDTO> toResponseDTOList(List<GoodsReceipt> receipts) {
        if (receipts == null) {
            return null;
        }

        return receipts.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}


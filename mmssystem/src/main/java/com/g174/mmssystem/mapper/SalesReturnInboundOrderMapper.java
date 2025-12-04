package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.SalesReturnInboundOrderItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesReturnInboundOrderResponseDTO;
import com.g174.mmssystem.entity.ReturnOrderItem;
import com.g174.mmssystem.entity.SalesReturnInboundOrder;
import com.g174.mmssystem.entity.SalesReturnInboundOrderItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class SalesReturnInboundOrderMapper {

    public SalesReturnInboundOrderResponseDTO toResponseDTO(SalesReturnInboundOrder entity) {
        if (entity == null) {
            return null;
        }

        SalesReturnInboundOrderResponseDTO.SalesReturnInboundOrderResponseDTOBuilder builder =
                SalesReturnInboundOrderResponseDTO.builder()
                        .sriId(entity.getSriId())
                        .sriNo(entity.getSriNo())
                        .status(entity.getStatus())
                        .roId(entity.getReturnOrder() != null ? entity.getReturnOrder().getRoId() : null)
                        .returnNo(entity.getReturnOrder() != null ? entity.getReturnOrder().getReturnNo() : null)
                        .warehouseId(entity.getWarehouse() != null ? entity.getWarehouse().getWarehouseId() : null)
                        .warehouseName(entity.getWarehouse() != null ? entity.getWarehouse().getName() : null)
                        .warehouseCode(entity.getWarehouse() != null ? entity.getWarehouse().getCode() : null)
                        .expectedReceiptDate(entity.getExpectedReceiptDate())
                        .notes(entity.getNotes())
                        .approvedAt(entity.getApprovedAt())
                        .createdAt(entity.getCreatedAt())
                        .updatedAt(entity.getUpdatedAt());

        if (entity.getCreatedBy() != null && entity.getCreatedBy().getProfile() != null) {
            String fullName = (entity.getCreatedBy().getProfile().getFirstName() + " " +
                    entity.getCreatedBy().getProfile().getLastName()).trim();
            builder.createdById(entity.getCreatedBy().getId())
                    .createdByName(fullName);
        }

        if (entity.getApprovedBy() != null && entity.getApprovedBy().getProfile() != null) {
            String fullName = (entity.getApprovedBy().getProfile().getFirstName() + " " +
                    entity.getApprovedBy().getProfile().getLastName()).trim();
            builder.approvedById(entity.getApprovedBy().getId())
                    .approvedByName(fullName);
        }

        // Map items
        if (entity.getItems() != null && !entity.getItems().isEmpty()) {
            builder.items(toItemResponseDTOList(entity.getItems()));
        }

        return builder.build();
    }

    public List<SalesReturnInboundOrderItemResponseDTO> toItemResponseDTOList(List<SalesReturnInboundOrderItem> items) {
        return items.stream()
                .map(this::toItemResponseDTO)
                .collect(Collectors.toList());
    }

    public SalesReturnInboundOrderItemResponseDTO toItemResponseDTO(SalesReturnInboundOrderItem item) {
        if (item == null) {
            return null;
        }

        ReturnOrderItem roi = item.getReturnOrderItem();

        SalesReturnInboundOrderItemResponseDTO.SalesReturnInboundOrderItemResponseDTOBuilder builder =
                SalesReturnInboundOrderItemResponseDTO.builder()
                        .sriiId(item.getSriiId())
                        .sriId(item.getInboundOrder() != null ? item.getInboundOrder().getSriId() : null)
                        .roiId(roi != null ? roi.getRoiId() : null)
                        .productId(item.getProduct() != null ? item.getProduct().getProductId() : null)
                        .productCode(item.getProduct() != null ? item.getProduct().getSku() : null)
                        .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                        .warehouseId(item.getWarehouse() != null ? item.getWarehouse().getWarehouseId() : null)
                        .warehouseName(item.getWarehouse() != null ? item.getWarehouse().getName() : null)
                        .plannedQty(item.getPlannedQty())
                        .uom(item.getUom())
                        .note(item.getNote());

        return builder.build();
    }
}



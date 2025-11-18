package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.entity.PurchaseRequisition;
import com.g174.mmssystem.entity.PurchaseRequisitionItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PurchaseRequisitionMapper {

    public PurchaseRequisitionResponseDTO toResponseDTO(PurchaseRequisition requisition) {
        if (requisition == null) {
            return null;
        }

        PurchaseRequisitionResponseDTO dto = PurchaseRequisitionResponseDTO.builder()
                .requisitionId(requisition.getRequisitionId())
                .requisitionNo(requisition.getRequisitionNo())
                .requisitionDate(requisition.getRequisitionDate())
                .requesterId(requisition.getRequester() != null ? requisition.getRequester().getId() : null)
                .requesterName(requisition.getRequester() != null && requisition.getRequester().getProfile() != null
                        ? (requisition.getRequester().getProfile().getFirstName() + " " +
                           requisition.getRequester().getProfile().getLastName()).trim()
                        : null)
                .purpose(requisition.getPurpose())
                .status(requisition.getStatus())
                .approverId(requisition.getApprover() != null ? requisition.getApprover().getId() : null)
                .approverName(requisition.getApprover() != null && requisition.getApprover().getProfile() != null
                        ? (requisition.getApprover().getProfile().getFirstName() + " " +
                           requisition.getApprover().getProfile().getLastName()).trim()
                        : null)
                .approvedAt(requisition.getApprovedAt())
                .createdById(requisition.getCreatedBy() != null ? requisition.getCreatedBy().getId() : null)
                .createdByName(requisition.getCreatedBy() != null && requisition.getCreatedBy().getProfile() != null
                        ? (requisition.getCreatedBy().getProfile().getFirstName() + " " +
                           requisition.getCreatedBy().getProfile().getLastName()).trim()
                        : null)
                .updatedById(requisition.getUpdatedBy() != null ? requisition.getUpdatedBy().getId() : null)
                .updatedByName(requisition.getUpdatedBy() != null && requisition.getUpdatedBy().getProfile() != null
                        ? (requisition.getUpdatedBy().getProfile().getFirstName() + " " +
                           requisition.getUpdatedBy().getProfile().getLastName()).trim()
                        : null)
                .createdAt(requisition.getCreatedAt())
                .updatedAt(requisition.getUpdatedAt())
                .build();

        // Map items if they exist
        if (requisition.getItems() != null && !requisition.getItems().isEmpty()) {
            dto.setItems(toItemResponseDTOList(requisition.getItems()));
        }

        return dto;
    }

    public PurchaseRequisitionItemResponseDTO toItemResponseDTO(PurchaseRequisitionItem item) {
        if (item == null) {
            return null;
        }

        return PurchaseRequisitionItemResponseDTO.builder()
                .priId(item.getPriId())
                .productId(item.getProduct() != null ? item.getProduct().getProductId() : null)
                .productName(item.getProductName())
                .productCode(item.getProduct() != null ? item.getProduct().getSku() : null)
                .requestedQty(item.getRequestedQty())
                .unit(item.getUnit())
                .deliveryDate(item.getDeliveryDate())
                .note(item.getNote())
                .build();
    }

    public List<PurchaseRequisitionItemResponseDTO> toItemResponseDTOList(List<PurchaseRequisitionItem> items) {
        if (items == null) {
            return null;
        }

        return items.stream()
                .map(this::toItemResponseDTO)
                .collect(Collectors.toList());
    }

    public List<PurchaseRequisitionResponseDTO> toResponseDTOList(List<PurchaseRequisition> requisitions) {
        if (requisitions == null) {
            return null;
        }

        return requisitions.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}

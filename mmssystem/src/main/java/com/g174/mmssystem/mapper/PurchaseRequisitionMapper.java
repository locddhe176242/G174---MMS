package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.entity.PurchaseRequisition;
import com.g174.mmssystem.entity.PurchaseRequisitionItem;
import com.g174.mmssystem.entity.User;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
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
                .requesterName(requisition.getRequester() != null && requisition.getRequester().getProfile() != null
                        ? (requisition.getRequester().getProfile().getFirstName() + " " + 
                           requisition.getRequester().getProfile().getLastName()).trim()
                        : null)
                .department(requisition.getDepartment())
                .neededBy(requisition.getNeededBy())
                .purpose(requisition.getPurpose())
                .approvalStatus(requisition.getApprovalStatus())
                .approverId(requisition.getApprover() != null ? requisition.getApprover().getId() : null)
                .approverName(requisition.getApprover() != null && requisition.getApprover().getProfile() != null
                        ? (requisition.getApprover().getProfile().getFirstName() + " " + 
                           requisition.getApprover().getProfile().getLastName()).trim()
                        : null)
                .approvedAt(requisition.getApprovedAt())
                .totalEstimated(requisition.getTotalEstimated())
                .status(requisition.getStatus())
                .createdAt(requisition.getCreatedAt())
                .updatedAt(requisition.getUpdatedAt())
                .build();

        // Map items if they exist
        if (requisition.getItems() != null && !requisition.getItems().isEmpty()) {
            dto.setItems(toItemResponseDTOList(requisition.getItems()));
        }

        return dto;
    }

    // Note: This method is not used directly - service handles entity creation
    // Keeping for reference but service creates entities directly

    public void updateEntityFromDTO(PurchaseRequisitionRequestDTO dto, PurchaseRequisition requisition,
                                    User requester) {
        if (dto == null || requisition == null) {
            return;
        }

        if (requester != null) {
            requisition.setRequester(requester);
        }
        if (dto.getDepartment() != null) {
            requisition.setDepartment(dto.getDepartment());
        }
        if (dto.getNeededBy() != null) {
            requisition.setNeededBy(dto.getNeededBy());
        }
        if (dto.getPurpose() != null) {
            requisition.setPurpose(dto.getPurpose());
        }
        if (dto.getApprovalStatus() != null) {
            requisition.setApprovalStatus(dto.getApprovalStatus());
        }
        if (dto.getTotalEstimated() != null) {
            requisition.setTotalEstimated(dto.getTotalEstimated());
        }
        if (dto.getStatus() != null) {
            requisition.setStatus(dto.getStatus());
        }

        // Recalculate total estimated from items
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            BigDecimal total = dto.getItems().stream()
                    .filter(item -> item.getRequestedQty() != null && item.getTargetUnitPrice() != null)
                    .map(item -> item.getRequestedQty().multiply(item.getTargetUnitPrice()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            requisition.setTotalEstimated(total);
        }
    }

    public PurchaseRequisitionItemResponseDTO toItemResponseDTO(PurchaseRequisitionItem item) {
        if (item == null) {
            return null;
        }

        return PurchaseRequisitionItemResponseDTO.builder()
                .priId(item.getPriId())
                .productId(item.getProductId())
                .productCode(item.getProductCode())
                .productName(item.getProductName())
                .uom(item.getUom())
                .requestedQty(item.getRequestedQty())
                .targetUnitPrice(item.getTargetUnitPrice())
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

    public PurchaseRequisitionItem toItemEntity(PurchaseRequisitionItemRequestDTO dto, 
                                                  PurchaseRequisition requisition) {
        if (dto == null) {
            return null;
        }

        return PurchaseRequisitionItem.builder()
                .purchaseRequisition(requisition)
                .productId(dto.getProductId())
                .productCode(dto.getProductCode())
                .productName(dto.getProductName())
                .uom(dto.getUom())
                .requestedQty(dto.getRequestedQty())
                .targetUnitPrice(dto.getTargetUnitPrice())
                .note(dto.getNote())
                .build();
    }

    public List<PurchaseRequisitionItem> toItemEntityList(List<PurchaseRequisitionItemRequestDTO> dtos,
                                                           PurchaseRequisition requisition) {
        if (dtos == null) {
            return null;
        }

        return dtos.stream()
                .map(dto -> toItemEntity(dto, requisition))
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


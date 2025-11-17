package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.entity.PurchaseRequisition;
import com.g174.mmssystem.entity.PurchaseRequisitionItem;
import com.g174.mmssystem.entity.User;
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
                .requesterId(requisition.getRequester() != null ? requisition.getRequester().getId().longValue() : null)
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
                .createdByName(requisition.getCreatedBy() != null && requisition.getCreatedBy().getProfile() != null
                        ? (requisition.getCreatedBy().getProfile().getFirstName() + " " + 
                           requisition.getCreatedBy().getProfile().getLastName()).trim()
                        : null)
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
        if (dto.getPurpose() != null) {
            requisition.setPurpose(dto.getPurpose());
        }
        if (dto.getStatus() != null) {
            requisition.setStatus(dto.getStatus());
        }
    }

    public PurchaseRequisitionItemResponseDTO toItemResponseDTO(PurchaseRequisitionItem item) {
        if (item == null) {
            return null;
        }

        return PurchaseRequisitionItemResponseDTO.builder()
                .priId(item.getPriId())
                .productId(item.getProduct() != null ? item.getProduct().getProductId().longValue() : null)
                .productName(item.getProductName() != null ? item.getProductName() : 
                            (item.getProduct() != null ? item.getProduct().getName() : null))
                .requestedQty(item.getRequestedQty())
                .unit(item.getUnit() != null ? item.getUnit() : 
                     (item.getProduct() != null ? item.getProduct().getUom() : null))
                .deliveryDate(item.getDeliveryDate())
                .note(item.getNote())
                .createdByName(item.getCreatedBy() != null && item.getCreatedBy().getProfile() != null
                        ? (item.getCreatedBy().getProfile().getFirstName() + " " + 
                           item.getCreatedBy().getProfile().getLastName()).trim()
                        : null)
                .updatedByName(item.getUpdatedBy() != null && item.getUpdatedBy().getProfile() != null
                        ? (item.getUpdatedBy().getProfile().getFirstName() + " " + 
                           item.getUpdatedBy().getProfile().getLastName()).trim()
                        : null)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
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
                                                  PurchaseRequisition requisition,
                                                  com.g174.mmssystem.entity.Product product,
                                                  User createdBy) {
        if (dto == null) {
            return null;
        }

        return PurchaseRequisitionItem.builder()
                .purchaseRequisition(requisition)
                .product(product)
                .productName(dto.getProductName() != null ? dto.getProductName() : 
                            (product != null ? product.getName() : null))
                .requestedQty(dto.getRequestedQty())
                .unit(dto.getUnit() != null ? dto.getUnit() : 
                     (product != null ? product.getUom() : null))
                .deliveryDate(dto.getDeliveryDate())
                .note(dto.getNote())
                .createdBy(createdBy)
                .build();
    }

    // Note: This method is deprecated - use service to create items with Product entity
    // Keeping for backward compatibility but service should handle Product loading
    @Deprecated
    public List<PurchaseRequisitionItem> toItemEntityList(List<PurchaseRequisitionItemRequestDTO> dtos,
                                                           PurchaseRequisition requisition) {
        // This method cannot be used anymore as it requires Product entity
        // Service should handle item creation with Product loading
        throw new UnsupportedOperationException("Use service method to create items with Product entity");
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


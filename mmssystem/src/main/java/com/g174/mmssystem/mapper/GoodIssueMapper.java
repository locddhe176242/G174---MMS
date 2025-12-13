package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.GoodIssueItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.GoodIssueResponseDTO;
import com.g174.mmssystem.entity.GoodIssue;
import com.g174.mmssystem.entity.GoodIssueItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class GoodIssueMapper {

    public GoodIssueResponseDTO toResponseDTO(GoodIssue issue) {
        if (issue == null) {
            return null;
        }

        GoodIssueResponseDTO.GoodIssueResponseDTOBuilder builder = GoodIssueResponseDTO.builder()
                .issueId(issue.getIssueId())
                .issueNo(issue.getIssueNo())
                .warehouseId(issue.getWarehouse() != null ? issue.getWarehouse().getWarehouseId() : null)
                .warehouseName(issue.getWarehouse() != null ? issue.getWarehouse().getName() : null)
                .warehouseCode(issue.getWarehouse() != null ? issue.getWarehouse().getCode() : null)
                .issueDate(issue.getIssueDate())
                .status(issue.getStatus())
                .createdById(issue.getCreatedBy() != null ? issue.getCreatedBy().getId() : null)
                .createdByName(issue.getCreatedBy() != null && issue.getCreatedBy().getProfile() != null
                        ? (issue.getCreatedBy().getProfile().getFirstName() + " " +
                           issue.getCreatedBy().getProfile().getLastName()).trim()
                        : null)
                .approvedById(issue.getApprovedBy() != null ? issue.getApprovedBy().getId() : null)
                .approvedByName(issue.getApprovedBy() != null && issue.getApprovedBy().getProfile() != null
                        ? (issue.getApprovedBy().getProfile().getFirstName() + " " +
                           issue.getApprovedBy().getProfile().getLastName()).trim()
                        : null)
                .approvedAt(issue.getApprovedAt())
                .createdAt(issue.getCreatedAt())
                .updatedAt(issue.getUpdatedAt())
                .notes(issue.getNotes());

        // Set Delivery info
        if (issue.getDelivery() != null) {
            builder.deliveryId(issue.getDelivery().getDeliveryId())
                   .deliveryNo(issue.getDelivery().getDeliveryNo());

            // Set Sales Order info from Delivery
            if (issue.getDelivery().getSalesOrder() != null) {
                builder.salesOrderId(issue.getDelivery().getSalesOrder().getSoId())
                       .salesOrderNo(issue.getDelivery().getSalesOrder().getSoNo());

                // Set Customer info from Sales Order
                if (issue.getDelivery().getSalesOrder().getCustomer() != null) {
                    builder.customerId(issue.getDelivery().getSalesOrder().getCustomer().getCustomerId())
                           .customerName(issue.getDelivery().getSalesOrder().getCustomer().getName());
                }
            }
        }

        GoodIssueResponseDTO dto = builder.build();

        // Map items if they exist
        if (issue.getItems() != null && !issue.getItems().isEmpty()) {
            dto.setItems(toItemResponseDTOList(issue.getItems()));
        }

        return dto;
    }

    public GoodIssueItemResponseDTO toItemResponseDTO(GoodIssueItem item) {
        if (item == null) {
            return null;
        }

        GoodIssueItemResponseDTO.GoodIssueItemResponseDTOBuilder builder = GoodIssueItemResponseDTO.builder()
                .giiId(item.getGiiId())
                .issueId(item.getGoodIssue() != null ? item.getGoodIssue().getIssueId() : null)
                .diId(item.getDeliveryItem() != null ? item.getDeliveryItem().getDiId() : null)
                .productId(item.getProduct() != null ? item.getProduct().getProductId() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .productCode(item.getProduct() != null ? item.getProduct().getSku() : null)
                .issuedQty(item.getIssuedQty())
                .remark(item.getRemark());

        // Get additional info from DeliveryItem
        if (item.getDeliveryItem() != null) {
            builder.deliveryId(item.getDeliveryItem().getDelivery() != null 
                    ? item.getDeliveryItem().getDelivery().getDeliveryId() : null)
                   .plannedQty(item.getDeliveryItem().getPlannedQty())
                   .deliveredQty(item.getDeliveryItem().getDeliveredQty())
                   .uom(item.getDeliveryItem().getUom());
        }

        return builder.build();
    }

    public List<GoodIssueItemResponseDTO> toItemResponseDTOList(List<GoodIssueItem> items) {
        if (items == null) {
            return null;
        }

        return items.stream()
                .map(this::toItemResponseDTO)
                .collect(Collectors.toList());
    }

    public List<GoodIssueResponseDTO> toResponseDTOList(List<GoodIssue> issues) {
        if (issues == null) {
            return null;
        }

        return issues.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}


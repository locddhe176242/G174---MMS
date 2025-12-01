package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.PurchaseQuotationItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseQuotationResponseDTO;
import com.g174.mmssystem.entity.PurchaseQuotation;
import com.g174.mmssystem.entity.PurchaseQuotationItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PurchaseQuotationMapper {

    public PurchaseQuotationResponseDTO toResponseDTO(PurchaseQuotation quotation) {
        if (quotation == null) {
            return null;
        }

        PurchaseQuotationResponseDTO dto = PurchaseQuotationResponseDTO.builder()
                .pqId(quotation.getPqId())
                .pqNo(quotation.getPqNo())
                .rfqId(quotation.getRfq() != null ? quotation.getRfq().getRfqId() : null)
                .rfqNo(quotation.getRfq() != null ? quotation.getRfq().getRfqNo() : null)
                .vendorId(quotation.getVendor() != null ? quotation.getVendor().getVendorId() : null)
                .vendorName(quotation.getVendor() != null ? quotation.getVendor().getName() : null)
                .vendorCode(quotation.getVendor() != null ? quotation.getVendor().getVendorCode() : null)
                .pqDate(quotation.getPqDate())
                .validUntil(quotation.getValidUntil())
                .isTaxIncluded(quotation.getIsTaxIncluded())
                .deliveryTerms(quotation.getDeliveryTerms())
                .paymentTerms(quotation.getPaymentTerms())
                .leadTimeDays(quotation.getLeadTimeDays())
                .warrantyMonths(quotation.getWarrantyMonths())
                .headerDiscount(quotation.getHeaderDiscount())
                .shippingCost(quotation.getShippingCost())
                .totalAmount(quotation.getTotalAmount())
                .status(quotation.getStatus())
                .createdById(quotation.getCreatedBy() != null ? quotation.getCreatedBy().getId() : null)
                .createdByName(quotation.getCreatedBy() != null && quotation.getCreatedBy().getProfile() != null
                        ? (quotation.getCreatedBy().getProfile().getFirstName() + " " +
                           quotation.getCreatedBy().getProfile().getLastName()).trim()
                        : null)
                .notes(quotation.getNotes())
                .createdAt(quotation.getCreatedAt())
                .updatedAt(quotation.getUpdatedAt())
                .build();

        // Map items if they exist
        if (quotation.getItems() != null && !quotation.getItems().isEmpty()) {
            dto.setItems(toItemResponseDTOList(quotation.getItems()));
        }

        return dto;
    }

    public PurchaseQuotationItemResponseDTO toItemResponseDTO(PurchaseQuotationItem item) {
        if (item == null) {
            return null;
        }

        return PurchaseQuotationItemResponseDTO.builder()
                .pqItemId(item.getPqItemId())
                .pqId(item.getPurchaseQuotation() != null ? item.getPurchaseQuotation().getPqId() : null)
                .rfqItemId(item.getRfqItem() != null ? item.getRfqItem().getRfqItemId() : null)
                .productId(item.getProduct() != null ? item.getProduct().getProductId() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .productCode(item.getProduct() != null ? item.getProduct().getSku() : null)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountPercent(item.getDiscountPercent())
                .taxRate(item.getTaxRate())
                .taxAmount(item.getTaxAmount())
                .lineTotal(item.getLineTotal())
                .remark(item.getRemark())
                .build();
    }

    public List<PurchaseQuotationItemResponseDTO> toItemResponseDTOList(List<PurchaseQuotationItem> items) {
        if (items == null) {
            return null;
        }

        return items.stream()
                .map(this::toItemResponseDTO)
                .collect(Collectors.toList());
    }

    public List<PurchaseQuotationResponseDTO> toResponseDTOList(List<PurchaseQuotation> quotations) {
        if (quotations == null) {
            return null;
        }

        return quotations.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}


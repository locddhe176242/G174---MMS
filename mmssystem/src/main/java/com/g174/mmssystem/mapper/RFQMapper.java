package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.RFQItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.RFQResponseDTO;
import com.g174.mmssystem.dto.responseDTO.RFQVendorResponseDTO;
import com.g174.mmssystem.entity.RFQ;
import com.g174.mmssystem.entity.RFQItem;
import com.g174.mmssystem.repository.RFQVendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RFQMapper {

    private final RFQVendorRepository rfqVendorRepository;
    private final RFQVendorMapper rfqVendorMapper;

    public RFQResponseDTO toResponseDTO(RFQ rfq) {
        if (rfq == null) {
            return null;
        }

        RFQResponseDTO dto = RFQResponseDTO.builder()
                .rfqId(rfq.getRfqId())
                .rfqNo(rfq.getRfqNo())
                .requisitionId(rfq.getRequisition() != null ? rfq.getRequisition().getRequisitionId() : null)
                .requisitionNo(rfq.getRequisition() != null ? rfq.getRequisition().getRequisitionNo() : null)
                .issueDate(rfq.getIssueDate())
                .dueDate(rfq.getDueDate())
                .status(rfq.getStatus())
                .selectedVendorId(rfq.getSelectedVendor() != null ? rfq.getSelectedVendor().getVendorId() : null)
                .selectedVendorName(rfq.getSelectedVendor() != null ? rfq.getSelectedVendor().getName() : null)
                .selectedVendorCode(rfq.getSelectedVendor() != null ? rfq.getSelectedVendor().getVendorCode() : null)
                .createdById(rfq.getCreatedBy() != null ? rfq.getCreatedBy().getId() : null)
                .createdByName(rfq.getCreatedBy() != null && rfq.getCreatedBy().getProfile() != null
                        ? (rfq.getCreatedBy().getProfile().getFirstName() + " " +
                           rfq.getCreatedBy().getProfile().getLastName()).trim()
                        : null)
                .notes(rfq.getNotes())
                .createdAt(rfq.getCreatedAt())
                .updatedAt(rfq.getUpdatedAt())
                .build();

        // Map items if they exist
        if (rfq.getItems() != null && !rfq.getItems().isEmpty()) {
            dto.setItems(toItemResponseDTOList(rfq.getItems()));
        }

        // Map selected vendors
        if (rfq.getRfqId() != null) {
            List<RFQVendorResponseDTO> vendors = rfqVendorRepository.findByRfqIdWithVendor(rfq.getRfqId())
                    .stream()
                    .map(rfqVendorMapper::toResponseDTO)
                    .collect(Collectors.toList());
            dto.setSelectedVendors(vendors);
        }

        return dto;
    }

    public RFQItemResponseDTO toItemResponseDTO(RFQItem item) {
        if (item == null) {
            return null;
        }

        return RFQItemResponseDTO.builder()
                .rfqItemId(item.getRfqItemId())
                .rfqId(item.getRfq() != null ? item.getRfq().getRfqId() : null)
                .priId(item.getPurchaseRequisitionItem() != null ? item.getPurchaseRequisitionItem().getPriId().longValue() : null)
                .productId(item.getProduct() != null ? item.getProduct().getProductId() : null)
                .productCode(item.getProductCode() != null ? item.getProductCode() : 
                            (item.getProduct() != null ? item.getProduct().getSku() : null))
                .productName(item.getProductName() != null ? item.getProductName() : 
                            (item.getProduct() != null ? item.getProduct().getName() : null))
                .spec(item.getSpec())
                .uom(item.getUom())
                .quantity(item.getQuantity())
                .deliveryDate(item.getDeliveryDate())
                .targetPrice(item.getTargetPrice())
                .priceUnit(item.getPriceUnit())
                .note(item.getNote())
                .build();
    }

    public List<RFQItemResponseDTO> toItemResponseDTOList(List<RFQItem> items) {
        if (items == null) {
            return null;
        }

        return items.stream()
                .map(this::toItemResponseDTO)
                .collect(Collectors.toList());
    }

    public List<RFQResponseDTO> toResponseDTOList(List<RFQ> rfqs) {
        if (rfqs == null) {
            return null;
        }

        return rfqs.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}


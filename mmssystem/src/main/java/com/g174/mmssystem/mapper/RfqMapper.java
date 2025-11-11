package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.RfqItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.RfqRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RfqItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.RfqResponseDTO;
import com.g174.mmssystem.entity.Rfq;
import com.g174.mmssystem.entity.RfqItem;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.Vendor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class RfqMapper {

    // Tạo entity RFQ từ request DTO + thông tin người tạo + danh sách vendor đã load
    public Rfq toEntity(RfqRequestDTO request, User creator, Set<Vendor> vendors) {
        Rfq rfq = new Rfq();
        rfq.setRfqNo(request.getRfqNo());
        rfq.setRequisitionId(request.getRequisitionId());
        rfq.setIssueDate(request.getIssueDate());
        rfq.setDueDate(request.getDueDate());
        rfq.setStatus(parseStatusOrDefault(request.getStatus(), Rfq.Status.DRAFT));
        rfq.setSelectedVendors(vendors);
        rfq.setNotes(request.getNotes());
        rfq.setCreatedBy(creator);
        rfq.setCreatedAt(LocalDateTime.now());

        List<RfqItem> items = new ArrayList<>();
        if (request.getItems() != null) {
            for (RfqItemRequestDTO it : request.getItems()) {
                RfqItem item = new RfqItem();
                item.setRfq(rfq);
                item.setProductId(it.getProductId());
                item.setProductCode(it.getProductCode());
                item.setProductName(it.getProductName());
                item.setSpec(it.getSpec());
                item.setUom(it.getUom());
                item.setQuantity(it.getQuantity());
                item.setDeliveryDate(it.getDeliveryDate());
                item.setTargetPrice(it.getTargetPrice());
                item.setPriceUnit(it.getPriceUnit());
                item.setNote(it.getNote());
                items.add(item);
            }
        }
        rfq.setItems(items);
        return rfq;
    }

    // Cập nhật entity RFQ từ DTO (ghi đè items theo danh sách mới gửi lên)
    public void updateEntityFromDTO(Rfq rfq, RfqRequestDTO request, Set<Vendor> vendors) {
        if (request.getRfqNo() != null) rfq.setRfqNo(request.getRfqNo());
        if (request.getRequisitionId() != null) rfq.setRequisitionId(request.getRequisitionId());
        if (request.getIssueDate() != null) rfq.setIssueDate(request.getIssueDate());
        if (request.getDueDate() != null) rfq.setDueDate(request.getDueDate());
        if (request.getStatus() != null) rfq.setStatus(parseStatusOrDefault(request.getStatus(), rfq.getStatus()));
        if (request.getNotes() != null) rfq.setNotes(request.getNotes());
        if (vendors != null) rfq.setSelectedVendors(vendors);

        if (request.getItems() != null) {
            rfq.getItems().clear();
            for (RfqItemRequestDTO it : request.getItems()) {
                RfqItem item = new RfqItem();
                item.setRfq(rfq);
                item.setProductId(it.getProductId());
                item.setProductCode(it.getProductCode());
                item.setProductName(it.getProductName());
                item.setSpec(it.getSpec());
                item.setUom(it.getUom());
                item.setQuantity(it.getQuantity());
                item.setDeliveryDate(it.getDeliveryDate());
                item.setTargetPrice(it.getTargetPrice());
                item.setPriceUnit(it.getPriceUnit());
                item.setNote(it.getNote());
                rfq.getItems().add(item);
            }
        }
        rfq.setUpdatedAt(LocalDateTime.now());
    }

    // Chuyển RFQ entity thành DTO trả về cho FE
    public RfqResponseDTO toResponseDTO(Rfq rfq) {
        return RfqResponseDTO.builder()
                .rfqId(rfq.getRfqId())
                .rfqNo(rfq.getRfqNo())
                .requisitionId(rfq.getRequisitionId())
                .issueDate(rfq.getIssueDate())
                .dueDate(rfq.getDueDate())
                .status(rfq.getStatus() != null ? rfq.getStatus().name() : null)
                .selectedVendorId(rfq.getSelectedVendorId())
                .selectedVendorIds(rfq.getSelectedVendors() != null
                        ? rfq.getSelectedVendors().stream().map(Vendor::getVendorId).collect(Collectors.toList())
                        : null)
                .notes(rfq.getNotes())
                .createdAt(rfq.getCreatedAt())
                .items(rfq.getItems() != null
                        ? rfq.getItems().stream().map(this::toItemResponseDTO).collect(Collectors.toList())
                        : List.of())
                .build();
    }

    // Chuyển list RFQ entity thành list DTO
    public List<RfqResponseDTO> toResponseDTOList(List<Rfq> rfqs) {
        return rfqs.stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    private RfqItemResponseDTO toItemResponseDTO(RfqItem item) {
        return RfqItemResponseDTO.builder()
                .rfqItemId(item.getRfqItemId())
                .productId(item.getProductId())
                .productCode(item.getProductCode())
                .productName(item.getProductName())
                .spec(item.getSpec())
                .uom(item.getUom())
                .quantity(item.getQuantity())
                .deliveryDate(item.getDeliveryDate())
                .targetPrice(item.getTargetPrice())
                .priceUnit(item.getPriceUnit())
                .note(item.getNote())
                .build();
    }

    // Chuyển status string từ FE thành enum (an toàn, giá trị lạ sẽ fallback)
    private Rfq.Status parseStatusOrDefault(String status, Rfq.Status defaultStatus) {
        if (status == null || status.isBlank()) return defaultStatus;
        try {
            return Rfq.Status.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return defaultStatus;
        }
    }
}



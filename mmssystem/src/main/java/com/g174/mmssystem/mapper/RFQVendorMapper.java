package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.RFQVendorResponseDTO;
import com.g174.mmssystem.entity.RFQVendor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class RFQVendorMapper {

    public RFQVendorResponseDTO toResponseDTO(RFQVendor rfqVendor) {
        if (rfqVendor == null) {
            return null;
        }

        return RFQVendorResponseDTO.builder()
                .rfqId(rfqVendor.getRfqId())
                .vendorId(rfqVendor.getVendorId())
                .vendorName(rfqVendor.getVendor() != null ? rfqVendor.getVendor().getName() : null)
                .vendorCode(rfqVendor.getVendor() != null ? rfqVendor.getVendor().getVendorCode() : null)
                .status(rfqVendor.getStatus())
                .build();
    }

    public List<RFQVendorResponseDTO> toResponseDTOList(List<RFQVendor> rfqVendors) {
        if (rfqVendors == null) {
            return null;
        }

        return rfqVendors.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}


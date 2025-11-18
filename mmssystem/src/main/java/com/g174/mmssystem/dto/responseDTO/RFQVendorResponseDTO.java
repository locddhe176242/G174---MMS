package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.enums.RFQVendorStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RFQVendorResponseDTO {
    private Integer rfqId;
    private Integer vendorId;
    private String vendorName;
    private String vendorCode;
    private RFQVendorStatus status;
}


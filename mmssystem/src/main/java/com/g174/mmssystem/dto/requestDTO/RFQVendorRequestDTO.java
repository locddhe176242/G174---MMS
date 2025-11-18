package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.enums.RFQVendorStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RFQVendorRequestDTO {
    @NotNull(message = "RFQ ID là bắt buộc")
    private Integer rfqId;

    @NotNull(message = "Vendor ID là bắt buộc")
    private Integer vendorId;

    private RFQVendorStatus status;
}


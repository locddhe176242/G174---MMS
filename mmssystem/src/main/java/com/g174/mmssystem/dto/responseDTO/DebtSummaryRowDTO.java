package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Dòng tổng hợp công nợ theo KH/NCC cho kỳ hiện tại
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtSummaryRowDTO {
    private String customerVendorCode;
    private String customerVendorType; // Customer / Vendor
    private String customerVendorName;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private BigDecimal balance;
}


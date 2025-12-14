package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodIssueItemResponseDTO {
    private Integer giiId;
    private Integer issueId;

    private Integer diId;
    private Integer deliveryId;

    private Integer productId;
    private String productName;
    private String productCode;

    private BigDecimal issuedQty;
    private String remark;

    // Additional fields from DeliveryItem
    private BigDecimal plannedQty;
    private BigDecimal deliveredQty;
    private String uom;
}

package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodIssueItemRequestDTO {
    
    @NotNull(message = "Delivery Item ID là bắt buộc")
    private Integer diId;

    @NotNull(message = "Product ID là bắt buộc")
    private Integer productId;

    @NotNull(message = "Warehouse ID là bắt buộc")
    private Integer warehouseId;

    @NotNull(message = "Số lượng xuất là bắt buộc")
    // Cho phép = 0 để thể hiện không xuất sản phẩm ở phiếu hiện tại, chỉ chặn khi < 0
    @DecimalMin(value = "0", message = "Số lượng xuất không được nhỏ hơn 0")
    @DecimalMax(value = "999999999999999.99", message = "Số lượng xuất quá lớn")
    private BigDecimal issuedQty;

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String remark;
}

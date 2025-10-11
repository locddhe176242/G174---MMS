package com.g174.mmssystem.dto.requestDTO;


import com.g174.mmssystem.enums.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequestDTO {
    @NotBlank(message = "SKU không được để trống")
    private String sku;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String barcode;

    private String description;

    @NotBlank(message = "Đơn vị tính (UOM) không được để trống ")
    private String uom;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá bán phải lớn hơn 0")
    private BigDecimal sellingPrice;

    @NotNull(message = "Giá nhập không được để trống (MSG-20)")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá nhập phải lớn hơn 0")
    private BigDecimal purchasePrice;

    @NotNull(message = "Danh mục sản phẩm không được để trống")
    private Integer categoryId;

    private String imageUrl;

    private ProductStatus status;
}

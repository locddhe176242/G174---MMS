package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequestDTO {

    @NotBlank(message = "SKU không được để trống")
    @Size(max = 50, message = "SKU không được quá 50 ký tự")
    private String sku;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm không được quá 255 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không được quá 500 ký tự")
    private String description;

    @NotBlank(message = "Đơn vị tính (UOM) không được để trống")
    @Size(max = 50, message = "Đơn vị tính không được quá 50 ký tự")
    private String uom;

    @NotNull(message = "Kích cỡ không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Kích cỡ phải lớn hơn 0")
    private Float size;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá bán phải lớn hơn 0")
    private BigDecimal sellingPrice;

    @NotNull(message = "Giá nhập không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá nhập phải lớn hơn 0")
    private BigDecimal purchasePrice;

    @NotNull(message = "Danh mục sản phẩm không được để trống")
    private Integer categoryId;

    @Size(max = 255, message = "URL hình ảnh không được quá 255 ký tự")
    private String imageUrl;

    private String status;
}
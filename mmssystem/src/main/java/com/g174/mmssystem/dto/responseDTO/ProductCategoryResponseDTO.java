package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategoryResponseDTO {
    private Integer categoryId;
    private String name;
    private LocalDateTime deletedAt;
}

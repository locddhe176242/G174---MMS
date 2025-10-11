package com.g174.mmssystem.dto.responseDTO;

import java.time.LocalDateTime;
import com.g174.mmssystem.entity.Warehouse;

public record WarehouseResponseDTO(
        Integer warehouseId,
        String code,
        String name,
        String location,
        Warehouse.Status status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime deletedAt,
        String createdBy,
        String updatedBy
) {}

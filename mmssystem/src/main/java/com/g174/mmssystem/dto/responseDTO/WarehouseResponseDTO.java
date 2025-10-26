package com.g174.mmssystem.dto.responseDTO;

import lombok.Data;
import java.time.Instant;

@Data
public class WarehouseResponseDTO {

    private Integer warehouseId;
    private String code;
    private String name;
    private String location;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;

    private UserInfo createdBy;
    private UserInfo updatedBy;

    @Data
    public static class UserInfo {
        private Integer userId;
        private String email;
    }
}
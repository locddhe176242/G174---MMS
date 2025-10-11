package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPermissionResponseDTO {
    private String permissionKey;
    private String permissionName;
    private LocalDateTime expiresAt;
    private String status;
}
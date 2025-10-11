package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class GrantUserPermissionRequestDTO {

    @NotNull(message = "User ID không được để trống")
    private Integer userId;

    @NotBlank(message = "Permission key không được để trống")
    private String permissionKey;

    private LocalDateTime expiresAt;  // null = vĩnh viễn

    @Size(max = 500, message = "Lý do tối đa 500 ký tự")
    private String reason;
}
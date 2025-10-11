package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class RevokeUserPermissionRequestDTO {

    @NotNull(message = "User ID không được để trống")
    private Integer userId;

    @NotBlank(message = "Permission key không được để trống")
    private String permissionKey;
}
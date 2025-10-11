package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class CreatePermissionRequestDTO {

    @NotBlank(message = "Permission key không được để trống")
    @Size(max = 100, message = "Permission key tối đa 100 ký tự")
    private String permissionKey;

    @NotBlank(message = "Permission name không được để trống")
    @Size(max = 100, message = "Permission name tối đa 100 ký tự")
    private String permissionName;

    @NotBlank(message = "Resource không được để trống")
    @Size(max = 50, message = "Resource tối đa 50 ký tự")
    private String resource;

    @NotBlank(message = "Action không được để trống")
    @Size(max = 50, message = "Action tối đa 50 ký tự")
    private String action;
}
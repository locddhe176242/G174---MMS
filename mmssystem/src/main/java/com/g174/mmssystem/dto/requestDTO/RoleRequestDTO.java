package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class RoleRequestDTO {
    private Integer roleId;
    
    @NotBlank(message = "Tên vai trò không được để trống")
    @Size(max = 255, message = "Tên vai trò tối đa 255 ký tự")
    private String roleName;
}

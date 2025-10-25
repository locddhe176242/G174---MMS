package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class AssignPermissionsToRoleRequestDTO {

    @NotNull(message = "Role ID không được để trống")
    private Integer roleId;

    @NotEmpty(message = "Danh sách permission keys không được rỗng")
    private List<String> permissionKeys;
}
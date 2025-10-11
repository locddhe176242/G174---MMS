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
public class AssignMenusToRoleRequestDTO {

    @NotNull(message = "Role ID không được để trống")
    private Integer roleId;

    @NotEmpty(message = "Danh sách menu không được rỗng")
    private List<Integer> menuIds;
}
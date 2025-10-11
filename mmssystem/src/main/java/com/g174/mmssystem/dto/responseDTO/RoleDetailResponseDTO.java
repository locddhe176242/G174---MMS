package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleDetailResponseDTO {
    private Integer roleId;
    private String roleName;
    private Integer totalMenus;
    private Integer totalPermissions;
    private List<MenuItemResponseDTO> menus;
    private List<PermissionResponseDTO> permissions;
}
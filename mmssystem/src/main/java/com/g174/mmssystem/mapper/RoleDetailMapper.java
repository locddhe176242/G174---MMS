package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.MenuItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.PermissionResponseDTO;
import com.g174.mmssystem.dto.responseDTO.RoleDetailResponseDTO;
import com.g174.mmssystem.entity.MenuItem;
import com.g174.mmssystem.entity.Permission;
import com.g174.mmssystem.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RoleDetailMapper {
    
    private final MenuItemMapper menuItemMapper;
    private final PermissionMapper permissionMapper;
    
    public RoleDetailResponseDTO toResponseDTO(
            Role role, 
            List<MenuItem> menus, 
            List<Permission> permissions
    ) {
        if (role == null) {
            return null;
        }
        
        List<MenuItemResponseDTO> menuDTOs = menuItemMapper.toResponseDTOList(menus);
        List<PermissionResponseDTO> permissionDTOs = permissionMapper.toResponseDTOList(permissions);
        
        return RoleDetailResponseDTO.builder()
                .roleId(role.getId())
                .roleName(role.getRoleName())
                .totalMenus(menuDTOs != null ? menuDTOs.size() : 0)
                .totalPermissions(permissionDTOs != null ? permissionDTOs.size() : 0)
                .menus(menuDTOs)
                .permissions(permissionDTOs)
                .build();
    }
}


package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.UserPermissionResponseDTO;
import com.g174.mmssystem.entity.Permission;
import com.g174.mmssystem.entity.UserPermission;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class UserPermissionMapper {
    
    public UserPermissionResponseDTO toResponseDTO(UserPermission userPerm, Permission permission) {
        if (userPerm == null || permission == null) {
            return null;
        }
        
        String status = determineStatus(userPerm.getExpiresAt());
        
        return UserPermissionResponseDTO.builder()
                .permissionKey(permission.getPermissionKey())
                .permissionName(permission.getPermissionName())
                .expiresAt(userPerm.getExpiresAt())
                .status(status)
                .build();
    }
    
    public List<UserPermissionResponseDTO> toResponseDTOList(
            List<UserPermission> userPerms, 
            Map<Integer, Permission> permissionMap
    ) {
        if (userPerms == null || permissionMap == null) {
            return List.of();
        }
        
        return userPerms.stream()
                .map(up -> {
                    Permission perm = permissionMap.get(up.getPermissionId());
                    return toResponseDTO(up, perm);
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }
    
    private String determineStatus(LocalDateTime expiresAt) {
        if (expiresAt == null) {
            return "active";
        }
        
        if (expiresAt.isAfter(LocalDateTime.now())) {
            return "active";
        }
        
        return "expired";
    }
}


package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.CreatePermissionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PermissionResponseDTO;
import com.g174.mmssystem.entity.Permission;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PermissionMapper {
    
    public PermissionResponseDTO toResponseDTO(Permission entity) {
        if (entity == null) {
            return null;
        }
        
        return PermissionResponseDTO.builder()
                .permissionId(entity.getPermissionId())
                .permissionKey(entity.getPermissionKey())
                .permissionName(entity.getPermissionName())
                .resource(entity.getResource())
                .action(entity.getAction())
                .build();
    }
    
    public List<PermissionResponseDTO> toResponseDTOList(List<Permission> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    
    public Permission toEntity(CreatePermissionRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        
        return Permission.builder()
                .permissionKey(dto.getPermissionKey())
                .permissionName(dto.getPermissionName())
                .resource(dto.getResource())
                .action(dto.getAction())
                .build();
    }
}


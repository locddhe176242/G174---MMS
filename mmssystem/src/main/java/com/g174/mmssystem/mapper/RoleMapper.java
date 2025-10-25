package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.RoleResponseDTO;
import com.g174.mmssystem.entity.Role;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class RoleMapper {

    public RoleResponseDTO toResponseDTO(Role role) {
        if (role == null) {
            return null;
        }

        RoleResponseDTO dto = new RoleResponseDTO();
        dto.setRoleId(role.getId());
        dto.setRoleName(role.getRoleName());

        return dto;
    }

    public List<RoleResponseDTO> toResponseDTOList(List<Role> roles) {
        if (roles == null) {
            return null;
        }

        return roles.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}


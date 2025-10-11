package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.responseDTO.RoleResponseDTO;

import java.util.List;

public interface IRoleService {
    List<RoleResponseDTO> getAllRoles();
    RoleResponseDTO getRoleById(Integer roleId);
}


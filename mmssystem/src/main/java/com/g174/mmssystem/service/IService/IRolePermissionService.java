package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.AssignPermissionsToRoleRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PermissionResponseDTO;
import com.g174.mmssystem.dto.responseDTO.RoleDetailResponseDTO;

import java.util.List;

public interface IRolePermissionService {
    
    List<PermissionResponseDTO> getPermissionsByRoleId(Integer roleId);
    
    RoleDetailResponseDTO getRoleDetail(Integer roleId);
    
    void assignPermissionsToRole(AssignPermissionsToRoleRequestDTO request);
    
    void removePermissionFromRole(Integer roleId, Integer permissionId);
    
    void removeAllPermissionsFromRole(Integer roleId);
}


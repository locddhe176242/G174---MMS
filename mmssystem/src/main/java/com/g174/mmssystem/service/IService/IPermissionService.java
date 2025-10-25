package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.CreatePermissionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PermissionResponseDTO;

import java.util.List;

public interface IPermissionService {
    
    List<PermissionResponseDTO> getAllPermissions();
    
    List<PermissionResponseDTO> getPermissionsByResource(String resource);
    
    PermissionResponseDTO getPermissionById(Integer permissionId);
    
    PermissionResponseDTO createPermission(CreatePermissionRequestDTO request);
    
    void deletePermission(Integer permissionId);
    
    boolean hasPermission(String userEmail, String permissionKey);
}


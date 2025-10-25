package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.GrantUserPermissionRequestDTO;
import com.g174.mmssystem.dto.requestDTO.RevokeUserPermissionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserPermissionResponseDTO;

import java.util.List;

public interface IUserPermissionService {
    
    List<UserPermissionResponseDTO> getUserPermissions(Integer userId);
    
    List<UserPermissionResponseDTO> getUserOverridePermissions(Integer userId);
    
    void grantPermissionToUser(GrantUserPermissionRequestDTO request);
    
    void revokePermissionFromUser(RevokeUserPermissionRequestDTO request);
    
    void cleanupExpiredPermissions();
}


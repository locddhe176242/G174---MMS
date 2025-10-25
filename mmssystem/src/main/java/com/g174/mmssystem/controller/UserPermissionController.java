package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.GrantUserPermissionRequestDTO;
import com.g174.mmssystem.dto.requestDTO.RevokeUserPermissionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserPermissionResponseDTO;
import com.g174.mmssystem.service.IService.IUserPermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserPermissionController {
    
    private final IUserPermissionService userPermissionService;
    
    @GetMapping("/{userId}/permissions")
    public ResponseEntity<List<UserPermissionResponseDTO>> getUserPermissions(
            @PathVariable Integer userId) {
        log.info("API: Lấy tất cả permissions của user ID: {}", userId);
        
        List<UserPermissionResponseDTO> permissions = userPermissionService.getUserPermissions(userId);
        return ResponseEntity.ok(permissions);
    }
    
    @GetMapping("/{userId}/permissions/override")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<UserPermissionResponseDTO>> getUserOverridePermissions(
            @PathVariable Integer userId) {
        log.info("API: Lấy override permissions của user ID: {}", userId);
        
        List<UserPermissionResponseDTO> permissions = userPermissionService.getUserOverridePermissions(userId);
        return ResponseEntity.ok(permissions);
    }
    
    @PostMapping("/permissions/grant")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> grantPermissionToUser(
            @Valid @RequestBody GrantUserPermissionRequestDTO request) {
        log.info("API: Cấp quyền {} cho user ID: {}", request.getPermissionKey(), request.getUserId());
        
        userPermissionService.grantPermissionToUser(request);
        
        String expiryInfo = request.getExpiresAt() == null 
                ? "vĩnh viễn" 
                : "hết hạn " + request.getExpiresAt();
        
        return ResponseEntity.ok(Map.of(
                "message", "Cấp quyền thành công",
                "permissionKey", request.getPermissionKey(),
                "expiryInfo", expiryInfo
        ));
    }
    
    @DeleteMapping("/permissions/revoke")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> revokePermissionFromUser(
            @Valid @RequestBody RevokeUserPermissionRequestDTO request) {
        log.info("API: Thu hồi quyền {} của user ID: {}", request.getPermissionKey(), request.getUserId());
        
        userPermissionService.revokePermissionFromUser(request);
        
        return ResponseEntity.ok(Map.of(
                "message", "Thu hồi quyền thành công",
                "permissionKey", request.getPermissionKey()
        ));
    }
    
    @DeleteMapping("/permissions/cleanup")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> cleanupExpiredPermissions() {
        log.info("API: Cleanup expired permissions");
        
        userPermissionService.cleanupExpiredPermissions();
        
        return ResponseEntity.ok(Map.of(
                "message", "Cleanup expired permissions thành công"
        ));
    }
}


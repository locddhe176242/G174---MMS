package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.AssignPermissionsToRoleRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PermissionResponseDTO;
import com.g174.mmssystem.dto.responseDTO.RoleDetailResponseDTO;
import com.g174.mmssystem.service.IService.IRolePermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Slf4j
public class RolePermissionController {
    
    private final IRolePermissionService rolePermissionService;
    
    @GetMapping("/{roleId}/permissions")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<PermissionResponseDTO>> getPermissionsByRoleId(
            @PathVariable Integer roleId) {
        log.info("API: Lấy permissions của role ID: {}", roleId);
        
        List<PermissionResponseDTO> permissions = rolePermissionService.getPermissionsByRoleId(roleId);
        return ResponseEntity.ok(permissions);
    }
    
    @GetMapping("/{roleId}/detail")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<RoleDetailResponseDTO> getRoleDetail(@PathVariable Integer roleId) {
        log.info("API: Lấy chi tiết role ID: {}", roleId);
        
        RoleDetailResponseDTO roleDetail = rolePermissionService.getRoleDetail(roleId);
        return ResponseEntity.ok(roleDetail);
    }
    
    @PostMapping("/permissions/assign")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> assignPermissionsToRole(
            @Valid @RequestBody AssignPermissionsToRoleRequestDTO request) {
        log.info("API: Assign {} permissions cho role ID: {}", 
                request.getPermissionKeys().size(), request.getRoleId());
        
        rolePermissionService.assignPermissionsToRole(request);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{roleId}/permissions/{permissionId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> removePermissionFromRole(
            @PathVariable Integer roleId,
            @PathVariable Integer permissionId) {
        log.info("API: Xóa permission {} khỏi role {}", permissionId, roleId);
        
        rolePermissionService.removePermissionFromRole(roleId, permissionId);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{roleId}/permissions")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> removeAllPermissionsFromRole(@PathVariable Integer roleId) {
        log.info("API: Xóa tất cả permissions của role {}", roleId);
        
        rolePermissionService.removeAllPermissionsFromRole(roleId);
        return ResponseEntity.noContent().build();
    }
}


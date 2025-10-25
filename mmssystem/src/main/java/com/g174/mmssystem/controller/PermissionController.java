package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.CreatePermissionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PermissionResponseDTO;
import com.g174.mmssystem.service.IService.IPermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@Slf4j
public class PermissionController {
    
    private final IPermissionService permissionService;
    
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<PermissionResponseDTO>> getAllPermissions() {
        log.info("API: Lấy tất cả permissions");
        
        List<PermissionResponseDTO> permissions = permissionService.getAllPermissions();
        return ResponseEntity.ok(permissions);
    }
    
    @GetMapping("/resource/{resource}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<PermissionResponseDTO>> getPermissionsByResource(
            @PathVariable String resource) {
        log.info("API: Lấy permissions của resource: {}", resource);
        
        List<PermissionResponseDTO> permissions = permissionService.getPermissionsByResource(resource);
        return ResponseEntity.ok(permissions);
    }
    
    @GetMapping("/{permissionId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PermissionResponseDTO> getPermissionById(
            @PathVariable Integer permissionId) {
        log.info("API: Lấy permission ID: {}", permissionId);
        
        PermissionResponseDTO permission = permissionService.getPermissionById(permissionId);
        return ResponseEntity.ok(permission);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PermissionResponseDTO> createPermission(
            @Valid @RequestBody CreatePermissionRequestDTO request) {
        log.info("API: Tạo permission mới: {}", request.getPermissionKey());
        
        PermissionResponseDTO createdPermission = permissionService.createPermission(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPermission);
    }
    
    @DeleteMapping("/{permissionId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deletePermission(@PathVariable Integer permissionId) {
        log.info("API: Xóa permission ID: {}", permissionId);
        
        permissionService.deletePermission(permissionId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkPermission(
            @RequestParam String email,
            @RequestParam String permission) {
        log.info("API: Check permission '{}' cho user: {}", permission, email);
        
        boolean hasPermission = permissionService.hasPermission(email, permission);
        return ResponseEntity.ok(Map.of("hasPermission", hasPermission));
    }
}


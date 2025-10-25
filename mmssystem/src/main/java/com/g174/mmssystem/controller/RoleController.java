package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.responseDTO.RoleResponseDTO;
import com.g174.mmssystem.service.IService.IRoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Slf4j
public class RoleController {

    private final IRoleService roleService;

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getAllRoles() {
        log.info("API: Lấy tất cả roles");
        
        List<RoleResponseDTO> roles = roleService.getAllRoles();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lấy danh sách vai trò thành công");
        response.put("data", roles);
        response.put("total", roles.size());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{roleId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getRoleById(@PathVariable Integer roleId) {
        log.info("API: Lấy role ID: {}", roleId);
        
        RoleResponseDTO role = roleService.getRoleById(roleId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lấy thông tin vai trò thành công");
        response.put("data", role);
        
        return ResponseEntity.ok(response);
    }
}


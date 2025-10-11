package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.AssignMenusToRoleRequestDTO;
import com.g174.mmssystem.dto.responseDTO.MenuItemResponseDTO;
import com.g174.mmssystem.service.IService.IRoleMenuService;
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
public class RoleMenuController {
    
    private final IRoleMenuService roleMenuService;
    
    @GetMapping("/{roleId}/menus")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<MenuItemResponseDTO>> getMenusByRoleId(
            @PathVariable Integer roleId) {
        log.info("API: Lấy menus của role ID: {}", roleId);
        
        List<MenuItemResponseDTO> menus = roleMenuService.getMenusByRoleId(roleId);
        return ResponseEntity.ok(menus);
    }
    
    @PostMapping("/menus/assign")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> assignMenusToRole(
            @Valid @RequestBody AssignMenusToRoleRequestDTO request) {
        log.info("API: Assign {} menus cho role ID: {}", request.getMenuIds().size(), request.getRoleId());
        
        roleMenuService.assignMenusToRole(request);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{roleId}/menus/{menuId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> removeMenuFromRole(
            @PathVariable Integer roleId,
            @PathVariable Integer menuId) {
        log.info("API: Xóa menu {} khỏi role {}", menuId, roleId);
        
        roleMenuService.removeMenuFromRole(roleId, menuId);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{roleId}/menus")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> removeAllMenusFromRole(@PathVariable Integer roleId) {
        log.info("API: Xóa tất cả menus của role {}", roleId);
        
        roleMenuService.removeAllMenusFromRole(roleId);
        return ResponseEntity.noContent().build();
    }
}


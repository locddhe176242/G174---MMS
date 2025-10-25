package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.CreateMenuItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.UpdateMenuItemRequestDTO;
import com.g174.mmssystem.dto.responseDTO.MenuConfigResponseDTO;
import com.g174.mmssystem.dto.responseDTO.MenuItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.PageResponseDTO;
import com.g174.mmssystem.service.IService.IMenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
@Slf4j
public class MenuItemController {
    
    private final IMenuItemService menuItemService;
    
    @GetMapping("/current-user")
    public ResponseEntity<MenuConfigResponseDTO> getMenuConfigForCurrentUser() {
        log.info("API: Lấy menu config cho user hiện tại");
        MenuConfigResponseDTO menuConfig = menuItemService.getMenuConfigForCurrentUser();
        return ResponseEntity.ok(menuConfig);
    }
    
    @GetMapping("/role/{roleName}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<MenuConfigResponseDTO> getMenuConfigByRole(@PathVariable String roleName) {
        log.info("API: Lấy menu config cho role: {}", roleName);
        MenuConfigResponseDTO menuConfig = menuItemService.getMenuConfigByRoleName(roleName);
        return ResponseEntity.ok(menuConfig);
    }
    
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<MenuItemResponseDTO>> getAllMenuItems() {
        log.info("API: Lấy tất cả menu items");
        List<MenuItemResponseDTO> menuItems = menuItemService.getAllMenuItems();
        return ResponseEntity.ok(menuItems);
    }
    
    @GetMapping("/paginated")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PageResponseDTO<MenuItemResponseDTO>> getAllMenuItemsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("API: Lấy menu items phân trang - page: {}, size: {}", page, size);
        PageResponseDTO<MenuItemResponseDTO> menuPage = menuItemService.getAllMenuItemsPaginated(page, size);
        return ResponseEntity.ok(menuPage);
    }
    
    @GetMapping("/{menuId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<MenuItemResponseDTO> getMenuItemById(@PathVariable Integer menuId) {
        log.info("API: Lấy menu item ID: {}", menuId);
        MenuItemResponseDTO menuItem = menuItemService.getMenuItemById(menuId);
        return ResponseEntity.ok(menuItem);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<MenuItemResponseDTO> createMenuItem(@Valid @RequestBody CreateMenuItemRequestDTO request) {
        log.info("API: Tạo menu item mới: {}", request.getMenuKey());
        MenuItemResponseDTO createdMenuItem = menuItemService.createMenuItem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMenuItem);
    }
    
    @PutMapping("/{menuId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<MenuItemResponseDTO> updateMenuItem(
            @PathVariable Integer menuId,
            @Valid @RequestBody UpdateMenuItemRequestDTO request) {
        log.info("API: Cập nhật menu item ID: {}", menuId);
        MenuItemResponseDTO updatedMenuItem = menuItemService.updateMenuItem(menuId, request);
        return ResponseEntity.ok(updatedMenuItem);
    }
    
    @DeleteMapping("/{menuId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Integer menuId) {
        log.info("API: Xóa menu item ID: {}", menuId);
        menuItemService.deleteMenuItem(menuId);
        return ResponseEntity.noContent().build();
    }
}


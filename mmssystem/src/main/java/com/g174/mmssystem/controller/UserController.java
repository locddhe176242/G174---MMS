package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.responseDTO.UserListResponseDTO;
import com.g174.mmssystem.service.IService.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final IUserService userService;

    @GetMapping("/search")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> searchUsers(
            @RequestParam(required = false, defaultValue = "") String keyword
    ) {
        log.info("API: Search users với keyword: {}", keyword);
        
        List<UserListResponseDTO> users = userService.searchUsers(keyword);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Tìm kiếm users thành công");
        response.put("data", users);
        response.put("total", users.size());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Integer userId) {
        log.info("API: Lấy user ID: {}", userId);
        
        UserListResponseDTO user = userService.getUserById(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lấy thông tin user thành công");
        response.put("data", user);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        log.info("API: Lấy tất cả users");
        
        List<UserListResponseDTO> users = userService.getAllUsers();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lấy danh sách users thành công");
        response.put("data", users);
        response.put("total", users.size());
        
        return ResponseEntity.ok(response);
    }
}


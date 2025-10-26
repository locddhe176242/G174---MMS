package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.UpdateUserRequestDTO;
import com.g174.mmssystem.dto.requestDTO.ResetPasswordRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserListResponseDTO;
import com.g174.mmssystem.service.IService.IUserService;
import jakarta.validation.Valid;
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

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
        action = "UPDATE_USER",
        activityType = "PROFILE_UPDATE",
        description = "Cập nhật thông tin user: #{#request.fullName} - Email: #{#request.email}",
        entityId = "#{#userId}"
    )
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable Integer userId,
            @Valid @RequestBody UpdateUserRequestDTO request
    ) {
        log.info("API: Cập nhật user ID: {}", userId);
        
        UserListResponseDTO updatedUser = userService.updateUser(userId, request);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Cập nhật thông tin user thành công");
        response.put("data", updatedUser);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{userId}/reset-password")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
        action = "RESET_PASSWORD",
        activityType = "PASSWORD_CHANGE",
        description = "Admin đặt lại mật khẩu cho user ID: #{#userId}",
        entityId = "#{#userId}"
    )
    public ResponseEntity<Map<String, Object>> resetPassword(
            @PathVariable Integer userId,
            @Valid @RequestBody ResetPasswordRequestDTO request
    ) {
        log.info("API: Đặt lại mật khẩu user ID: {}", userId);
        
        userService.resetPassword(userId, request.getNewPassword());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Đặt lại mật khẩu thành công");
        
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{userId}/toggle-status")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
        action = "TOGGLE_USER_STATUS",
        activityType = "ACCOUNT_MANAGEMENT",
        description = "Thay đổi trạng thái user ID: #{#userId}",
        entityId = "#{#userId}"
    )
    public ResponseEntity<Map<String, Object>> toggleStatus(@PathVariable Integer userId) {
        log.info("API: Thay đổi trạng thái user ID: {}", userId);
        
        UserListResponseDTO updatedUser = userService.toggleUserStatus(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Thay đổi trạng thái user thành công");
        response.put("data", updatedUser);
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
        action = "DELETE_USER",
        activityType = "ACCOUNT_MANAGEMENT",
        description = "Xóa tài khoản user ID: #{#userId}",
        entityId = "#{#userId}"
    )
    public ResponseEntity<Map<String, Object>> softDeleteUser(@PathVariable Integer userId) {
        log.info("API: Soft delete user ID: {}", userId);
        
        UserListResponseDTO deletedUser = userService.softDeleteUser(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Xóa tài khoản thành công");
        response.put("data", deletedUser);
        
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{userId}/restore")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
        action = "RESTORE_USER",
        activityType = "ACCOUNT_MANAGEMENT",
        description = "Khôi phục tài khoản user ID: #{#userId}",
        entityId = "#{#userId}"
    )
    public ResponseEntity<Map<String, Object>> restoreUser(@PathVariable Integer userId) {
        log.info("API: Restore user ID: {}", userId);
        
        UserListResponseDTO restoredUser = userService.restoreUser(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Khôi phục tài khoản thành công");
        response.put("data", restoredUser);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/deleted")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getAllDeletedUsers() {
        log.info("API: Lấy tất cả users đã bị xóa");
        
        List<UserListResponseDTO> deletedUsers = userService.getAllDeletedUsers();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lấy danh sách users đã bị xóa thành công");
        response.put("data", deletedUsers);
        response.put("total", deletedUsers.size());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/deleted/search")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> searchDeletedUsers(
            @RequestParam(required = false, defaultValue = "") String keyword
    ) {
        log.info("API: Tìm kiếm users đã bị xóa với keyword: {}", keyword);
        
        List<UserListResponseDTO> deletedUsers = userService.searchDeletedUsers(keyword);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Tìm kiếm users đã bị xóa thành công");
        response.put("data", deletedUsers);
        response.put("total", deletedUsers.size());
        
        return ResponseEntity.ok(response);
    }
}


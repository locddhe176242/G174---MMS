package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.ChangePasswordRequestDTO;
import com.g174.mmssystem.dto.requestDTO.UpdateProfileRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserProfileResponseDTO;
import com.g174.mmssystem.service.IService.IUserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final IUserProfileService userProfileService;

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('MANAGER', 'SALE', 'PURCHASE', 'ACCOUNTING', 'WAREHOUSE')")
    public ResponseEntity<UserProfileResponseDTO> getCurrentUserProfile(Authentication authentication) {
        String email = authentication.getName();
        UserProfileResponseDTO profile = userProfileService.getCurrentUserProfile(email);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    @PreAuthorize("hasAnyRole('MANAGER', 'SALE', 'PURCHASE', 'ACCOUNTING', 'WAREHOUSE')")
    @LogActivity(
            action = "UPDATE_PROFILE",
            activityType = "PROFILE_UPDATE",
            description = "Cập nhật thông tin profile: #{#requestDTO.firstName} #{#requestDTO.lastName}"
    )
    public ResponseEntity<Map<String, Object>> updateCurrentUserProfile(
            @Valid @RequestBody UpdateProfileRequestDTO requestDTO,
            Authentication authentication) {

        String email = authentication.getName();
        UserProfileResponseDTO updatedProfile = userProfileService.updateCurrentUserProfile(email, requestDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("profile", updatedProfile);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    @PreAuthorize("hasAnyRole('MANAGER', 'SALE', 'PURCHASE', 'ACCOUNTING', 'WAREHOUSE')")
    @LogActivity(
            action = "CHANGE_PASSWORD",
            activityType = "PASSWORD_CHANGE",
            description = "User thay đổi mật khẩu"
    )
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequestDTO requestDTO,
            Authentication authentication) {

        String email = authentication.getName();
        userProfileService.changePassword(email, requestDTO);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password changed successfully");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile/avatar")
    @PreAuthorize("hasAnyRole('MANAGER', 'SALE', 'PURCHASE', 'ACCOUNTING', 'WAREHOUSE')")
    @LogActivity(
            action = "UPLOAD_AVATAR",
            activityType = "PROFILE_UPDATE",
            description = "User_upload_avatar"
    )
    public ResponseEntity<Map<String, Object>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        String email = authentication.getName();
        String avatarUrl = userProfileService.uploadAvatar(email, file);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Avatar uploaded successfully");
        response.put("avatarUrl", avatarUrl);

        return ResponseEntity.ok(response);
    }

}

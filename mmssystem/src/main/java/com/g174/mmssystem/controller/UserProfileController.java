package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.ChangePasswordRequestDTO;
import com.g174.mmssystem.dto.requestDTO.UpdateProfileRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserProfileResponseDTO;
import com.g174.mmssystem.service.IService.IUserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {
    
    private final IUserProfileService userProfileService;
    
    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponseDTO> getCurrentUserProfile(Authentication authentication) {
        String email = authentication.getName();
        UserProfileResponseDTO profile = userProfileService.getCurrentUserProfile(email);
        return ResponseEntity.ok(profile);
    }
    
    @PutMapping("/profile")
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
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequestDTO requestDTO,
            Authentication authentication) {
        
        String email = authentication.getName();
        userProfileService.changePassword(email, requestDTO);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password changed successfully");
        
        return ResponseEntity.ok(response);
    }
}


package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.ChangePasswordRequestDTO;
import com.g174.mmssystem.dto.requestDTO.UpdateProfileRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserProfileResponseDTO;
import org.springframework.web.multipart.MultipartFile;
public interface IUserProfileService {
    
    UserProfileResponseDTO getCurrentUserProfile(String email);
    
    UserProfileResponseDTO updateCurrentUserProfile(String email, UpdateProfileRequestDTO requestDTO);
    
    void changePassword(String email, ChangePasswordRequestDTO requestDTO);
    
    String uploadAvatar(String email, MultipartFile file);
}


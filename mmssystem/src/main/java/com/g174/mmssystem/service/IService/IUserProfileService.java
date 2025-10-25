package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.ChangePasswordRequestDTO;
import com.g174.mmssystem.dto.requestDTO.UpdateProfileRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserProfileResponseDTO;

public interface IUserProfileService {
    
    UserProfileResponseDTO getCurrentUserProfile(String email);
    
    UserProfileResponseDTO updateCurrentUserProfile(String email, UpdateProfileRequestDTO requestDTO);
    
    void changePassword(String email, ChangePasswordRequestDTO requestDTO);
}


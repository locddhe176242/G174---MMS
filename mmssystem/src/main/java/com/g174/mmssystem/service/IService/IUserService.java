package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.responseDTO.UserListResponseDTO;

import java.util.List;

public interface IUserService {
    List<UserListResponseDTO> searchUsers(String keyword);
    UserListResponseDTO getUserById(Integer userId);
    List<UserListResponseDTO> getAllUsers();
}


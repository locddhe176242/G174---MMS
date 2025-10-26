package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.UpdateUserRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserListResponseDTO;

import java.util.List;

public interface IUserService {
    List<UserListResponseDTO> searchUsers(String keyword);
    UserListResponseDTO getUserById(Integer userId);
    List<UserListResponseDTO> getAllUsers();
    UserListResponseDTO updateUser(Integer userId, UpdateUserRequestDTO request);
    void resetPassword(Integer userId, String newPassword);
    UserListResponseDTO toggleUserStatus(Integer userId);

    UserListResponseDTO softDeleteUser(Integer userId);
    UserListResponseDTO restoreUser(Integer userId);
    List<UserListResponseDTO> getAllDeletedUsers();
    List<UserListResponseDTO> searchDeletedUsers(String keyword);
}

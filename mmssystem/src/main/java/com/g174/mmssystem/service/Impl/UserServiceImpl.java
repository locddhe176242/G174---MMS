package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.responseDTO.UserListResponseDTO;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.UserMapper;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserServiceImpl implements IUserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    public List<UserListResponseDTO> searchUsers(String keyword) {
        log.info("Tìm kiếm users với keyword: {}", keyword);
        
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllUsers();
        }
        
        List<User> users = userRepository.searchUsers(keyword.trim());
        return userMapper.toListResponseDTOList(users);
    }

    @Override
    public UserListResponseDTO getUserById(Integer userId) {
        log.info("Lấy thông tin user ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user với ID: " + userId));
        
        return userMapper.toListResponseDTO(user);
    }

    @Override
    public List<UserListResponseDTO> getAllUsers() {
        log.info("Lấy danh sách tất cả users");
        List<User> users = userRepository.findAll();
        return userMapper.toListResponseDTOList(users);
    }
}


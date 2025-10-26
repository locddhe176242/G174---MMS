package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.UpdateUserRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserListResponseDTO;
import com.g174.mmssystem.entity.Department;
import com.g174.mmssystem.entity.Role;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.UserProfile;
import com.g174.mmssystem.entity.UserRole;
import com.g174.mmssystem.entity.UserRoleId;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.UserMapper;
import com.g174.mmssystem.repository.DepartmentRepository;
import com.g174.mmssystem.repository.RoleRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.repository.UserRoleRepository;
import com.g174.mmssystem.service.IService.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserServiceImpl implements IUserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

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

    @Override
    @Transactional
    public UserListResponseDTO updateUser(Integer userId, UpdateUserRequestDTO request) {
        log.info("Cập nhật user ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user với ID: " + userId));
        
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban với ID: " + request.getDepartmentId()));
        
        List<Role> roles = roleRepository.findAllById(request.getRoleIds());
        if (roles.size() != request.getRoleIds().size()) {
            throw new ResourceNotFoundException("Một hoặc nhiều vai trò không tồn tại");
        }
        
        user.setEmail(request.getEmail());
        user.setEmployeeCode(request.getEmployeeCode());
        user.setDepartment(department);
        
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            user.setProfile(profile);
        }
        
        String fullName = request.getFullName();
        if (fullName != null && !fullName.trim().isEmpty()) {
            String[] nameParts = fullName.trim().split("\\s+", 2);
            profile.setFirstName(nameParts[0]);
            profile.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        }
        
        profile.setPhoneNumber(request.getPhoneNumber());
        
        userRoleRepository.deleteAllByUserId(userId);
        
        List<UserRole> userRoles = roles.stream()
                .map(role -> {
                    UserRole userRole = new UserRole();
                    UserRoleId userRoleId = new UserRoleId();
                    userRoleId.setUserId(userId);
                    userRoleId.setRoleId(role.getId());
                    userRole.setId(userRoleId);
                    userRole.setUser(user);
                    userRole.setRole(role);
                    return userRole;
                })
                .collect(Collectors.toList());
        
        userRoleRepository.saveAll(userRoles);
        
        User savedUser = userRepository.save(user);
        return userMapper.toListResponseDTO(savedUser);
    }

    @Override
    @Transactional
    public void resetPassword(Integer userId, String newPassword) {
        log.info("Đặt lại mật khẩu user ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user với ID: " + userId));
        
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        
        userRepository.save(user);
    }

    @Override
    @Transactional
    public UserListResponseDTO toggleUserStatus(Integer userId) {
        log.info("Thay đổi trạng thái user ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user với ID: " + userId));
        
        User.UserStatus currentStatus = user.getStatus();
        User.UserStatus newStatus = currentStatus == User.UserStatus.Active ? User.UserStatus.Inactive : User.UserStatus.Active;
        user.setStatus(newStatus);
        
        User savedUser = userRepository.save(user);
        return userMapper.toListResponseDTO(savedUser);
    }

    @Override
    @Transactional
    public UserListResponseDTO softDeleteUser(Integer userId) {
        log.info("Soft delete user ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user với ID: " + userId));
        
        if (user.getDeletedAt() != null) {
            throw new IllegalStateException("User đã bị xóa trước đó");
        }
        
        user.setDeletedAt(Instant.now());
        user.setStatus(User.UserStatus.Inactive);
        
        User savedUser = userRepository.save(user);
        return userMapper.toListResponseDTO(savedUser);
    }

    @Override
    @Transactional
    public UserListResponseDTO restoreUser(Integer userId) {
        log.info("Restore user ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user với ID: " + userId));
        
        if (user.getDeletedAt() == null) {
            throw new IllegalStateException("User chưa bị xóa");
        }
        
        user.setDeletedAt(null);
        user.setStatus(User.UserStatus.Active);
        
        User savedUser = userRepository.save(user);
        return userMapper.toListResponseDTO(savedUser);
    }

    @Override
    public List<UserListResponseDTO> getAllDeletedUsers() {
        log.info("Lấy tất cả users đã bị xóa");
        List<User> deletedUsers = userRepository.findAllDeleted();
        return userMapper.toListResponseDTOList(deletedUsers);
    }

    @Override
    public List<UserListResponseDTO> searchDeletedUsers(String keyword) {
        log.info("Tìm kiếm users đã bị xóa với keyword: {}", keyword);
        List<User> deletedUsers = userRepository.searchDeletedUsers(keyword);
        return userMapper.toListResponseDTOList(deletedUsers);
    }
}


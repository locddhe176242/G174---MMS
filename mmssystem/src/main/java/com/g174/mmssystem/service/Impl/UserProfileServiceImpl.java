package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.ChangePasswordRequestDTO;
import com.g174.mmssystem.dto.requestDTO.UpdateProfileRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserProfileResponseDTO;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.UserProfile;
import com.g174.mmssystem.exception.InvalidCredentialsException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.repository.UserProfileRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IUserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements IUserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponseDTO getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));

        return mapToResponseDTO(user);
    }

    @Override
    @Transactional
    public UserProfileResponseDTO updateCurrentUserProfile(String email, UpdateProfileRequestDTO requestDTO) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            user.setProfile(profile);
        }

        profile.setFirstName(requestDTO.getFirstName());
        profile.setLastName(requestDTO.getLastName());
        profile.setGender(requestDTO.getGender() != null ? UserProfile.Gender.valueOf(requestDTO.getGender()) : null);
        profile.setDob(requestDTO.getDob());
        profile.setPhoneNumber(requestDTO.getPhoneNumber());
        profile.setAddress(requestDTO.getAddress());

        userProfileRepository.save(profile);

        return mapToResponseDTO(user);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequestDTO requestDTO) {
        if (!requestDTO.getNewPassword().equals(requestDTO.getConfirmPassword())) {
            throw new InvalidCredentialsException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));

        if (!passwordEncoder.matches(requestDTO.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Mật khẩu hiện tại không chính xác");
        }

        if (passwordEncoder.matches(requestDTO.getNewPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Mật khẩu mới phải khác với mật khẩu hiện tại");
        }

        user.setPassword(passwordEncoder.encode(requestDTO.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public String uploadAvatar(String email, MultipartFile file) {
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File trống");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File phải là hình ảnh");
        }

        // Validate file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Kích thước file phải nhỏ hơn 5MB");
        }

        try {
            // Create uploads directory if not exists
            Path uploadsDir = Paths.get("uploads/avatars");
            Files.createDirectories(uploadsDir);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadsDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            // Update user profile
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));

            UserProfile profile = user.getProfile();
            if (profile == null) {
                profile = new UserProfile();
                profile.setUser(user);
                user.setProfile(profile);
            }

            // Save relative path for database
            String avatarUrl = "/uploads/avatars/" + filename;
            profile.setAvatarUrl(avatarUrl);
            userProfileRepository.save(profile);

            return avatarUrl;

        } catch (IOException e) {
            throw new RuntimeException("Tải lên ảnh đại diện thất bại: " + e.getMessage(), e);
        }
    }

    private UserProfileResponseDTO mapToResponseDTO(User user) {
        UserProfile profile = user.getProfile();

        String fullName = "";
        if (profile != null) {
            fullName = (profile.getFirstName() != null ? profile.getFirstName() : "") + " " +
                    (profile.getLastName() != null ? profile.getLastName() : "");
            fullName = fullName.trim();
        }

        return UserProfileResponseDTO.builder()
                .userId(Long.valueOf(user.getId()))
                .email(user.getEmail())
                .employeeCode(user.getEmployeeCode())
                .status(user.getStatus().name())
                .lastLogin(user.getLastLogin() != null ? user.getLastLogin().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null)
                .firstName(profile != null ? profile.getFirstName() : null)
                .lastName(profile != null ? profile.getLastName() : null)
                .fullName(fullName.isEmpty() ? user.getEmail() : fullName)
                .gender(profile != null && profile.getGender() != null ? profile.getGender().name() : null)
                .dob(profile != null ? profile.getDob() : null)
                .phoneNumber(profile != null ? profile.getPhoneNumber() : null)
                .address(profile != null ? profile.getAddress() : null)
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .departmentId(Long.valueOf(user.getDepartment().getId()))
                .departmentName(user.getDepartment().getDepartmentName())
                .departmentCode(user.getDepartment().getDepartmentCode())
                .roles(user.getUserRoles().stream()
                        .map(userRole -> userRole.getRole().getRoleName())
                        .collect(Collectors.toList()))
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null)
                .updatedAt(user.getUpdatedAt() != null ? user.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null)
                .build();
    }

}

package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.auth.*;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.InvalidCredentialsException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.exception.TokenExpiredException;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IAuthenticationService;
import com.g174.mmssystem.until.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements IAuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserRoleRepository userRoleRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public LoginResponseDTO login(LoginRequestDTO loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            User user = userRepository.findByEmail(loginRequest.getEmail())
                    .filter(u -> u.getDeletedAt() == null)
                    .orElseThrow(() -> new InvalidCredentialsException("Email hoặc mật khẩu không chính xác"));

            if (user.getStatus() == User.UserStatus.Inactive) {
                throw new InvalidCredentialsException("Tài khoản đã bị vô hiệu hóa");
            }

            user.setLastLogin(Instant.now());
            userRepository.save(user);

            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            AuthUserDTO authUser = buildAuthUserDTO(user);

            log.info("Người dùng {} đăng nhập thành công", user.getEmail());

            return LoginResponseDTO.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .user(authUser)
                    .build();

        } catch (BadCredentialsException e) {
            log.warn("Đăng nhập thất bại cho email: {}", loginRequest.getEmail());
            throw new InvalidCredentialsException("Email hoặc mật khẩu không chính xác");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public RefreshTokenResponseDTO refreshToken(RefreshTokenRequestDTO request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtService.validateToken(refreshToken)) {
            throw new TokenExpiredException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        String tokenType = jwtService.extractTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new TokenExpiredException("Loại token không hợp lệ. Yêu cầu refresh token");
        }

        String email = jwtService.extractEmail(refreshToken);

        User user = userRepository.findByEmail(email)
                .filter(u -> u.getDeletedAt() == null)
                .filter(u -> u.getStatus() == User.UserStatus.Active)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng hoặc tài khoản không hoạt động"));

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        log.info("Token đã được làm mới cho người dùng: {}", email);

        return RefreshTokenResponseDTO.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .build();
    }

    @Override
    @Transactional
    public RegisterResponseDTO register(RegisterRequestDTO registerRequest) {
        log.info("Bắt đầu đăng ký người dùng mới: {}", registerRequest.getEmail());

        if (userRepository.existsByEmailAndDeletedAtIsNull(registerRequest.getEmail())) {
            throw new DuplicateResourceException("Email đã tồn tại");
        }

        if (userRepository.existsByEmployeeCodeAndDeletedAtIsNull(registerRequest.getEmployeeCode())) {
            throw new DuplicateResourceException("Mã nhân viên đã tồn tại");
        }

        Department department = departmentRepository.findById(registerRequest.getDepartmentId())
                .filter(d -> d.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban"));

        Set<Role> roles = new HashSet<>();
        for (Integer roleId : registerRequest.getRoleIds()) {
            Role role = roleRepository.findById(roleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò ID: " + roleId));
            roles.add(role);
        }

        User user = new User();
        user.setUsername(registerRequest.getEmail());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setEmployeeCode(registerRequest.getEmployeeCode());
        user.setDepartment(department);
        user.setStatus(User.UserStatus.Active);

        User savedUser = userRepository.save(user);

        UserProfile userProfile = new UserProfile();
        userProfile.setUser(savedUser);
        
        String fullName = registerRequest.getFullName();
        if (fullName != null && !fullName.trim().isEmpty()) {
            String[] nameParts = fullName.trim().split("\\s+", 2);
            userProfile.setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
                userProfile.setLastName(nameParts[1]);
            }
        }
        
        userProfile.setPhoneNumber(registerRequest.getPhoneNumber());
        userProfileRepository.save(userProfile);

        for (Role role : roles) {
            UserRole userRole = new UserRole();
            UserRoleId userRoleId = new UserRoleId(savedUser.getId(), role.getId());
            userRole.setId(userRoleId);
            userRole.setUser(savedUser);
            userRole.setRole(role);
            userRoleRepository.save(userRole);
        }

        log.info("Đăng ký người dùng thành công: {} (ID: {})", savedUser.getEmail(), savedUser.getId());

        return RegisterResponseDTO.builder()
                .message("Đăng ký người dùng thành công")
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .employeeCode(savedUser.getEmployeeCode())
                .createdAt(savedUser.getCreatedAt())
                .build();
    }

    private AuthUserDTO buildAuthUserDTO(User user) {
        var roles = user.getUserRoles().stream()
                .map(ur -> ur.getRole().getRoleName())
                .collect(Collectors.toSet());

        String departmentName = user.getDepartment() != null
                ? user.getDepartment().getDepartmentName()
                : null;

        Integer departmentId = user.getDepartment() != null
                ? user.getDepartment().getId()
                : null;

        return AuthUserDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .employeeCode(user.getEmployeeCode())
                .status(user.getStatus())
                .departmentId(departmentId)
                .departmentName(departmentName)
                .roles(roles)
                .build();
    }
}
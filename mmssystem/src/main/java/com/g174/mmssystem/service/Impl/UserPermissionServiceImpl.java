package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.GrantUserPermissionRequestDTO;
import com.g174.mmssystem.dto.requestDTO.RevokeUserPermissionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.UserPermissionResponseDTO;
import com.g174.mmssystem.entity.Permission;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.UserPermission;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.UserPermissionMapper;
import com.g174.mmssystem.repository.PermissionRepository;
import com.g174.mmssystem.repository.UserPermissionRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IUserPermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserPermissionServiceImpl implements IUserPermissionService {
    
    private final UserPermissionRepository userPermissionRepository;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final UserPermissionMapper userPermissionMapper;
    
    @Override
    @Transactional(readOnly = true)
    public List<UserPermissionResponseDTO> getUserPermissions(Integer userId) {
        log.info("Lấy tất cả permissions của user ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        
        String roleName = user.getUserRoles().stream()
                .findFirst()
                .map(ur -> ur.getRole().getRoleName())
                .orElse(null);
        
        List<Permission> rolePermissions = roleName != null 
                ? permissionRepository.findPermissionsByRoleName(roleName)
                : List.of();
        
        List<UserPermission> userPerms = userPermissionRepository.findByUserIdAndNotExpired(userId, LocalDateTime.now());
        List<Integer> userPermIds = userPerms.stream()
                .map(UserPermission::getPermissionId)
                .toList();
        
        List<Permission> userOverridePermissions = userPermIds.isEmpty() 
                ? List.of()
                : permissionRepository.findAllById(userPermIds);
        
        Map<Integer, Permission> allPermissionsMap = rolePermissions.stream()
                .collect(Collectors.toMap(Permission::getPermissionId, p -> p));
        
        userOverridePermissions.forEach(p -> allPermissionsMap.putIfAbsent(p.getPermissionId(), p));
        
        return userPermissionMapper.toResponseDTOList(userPerms, allPermissionsMap);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserPermissionResponseDTO> getUserOverridePermissions(Integer userId) {
        log.info("Lấy override permissions của user ID: {}", userId);
        
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy user");
        }
        
        List<UserPermission> userPerms = userPermissionRepository.findByUserIdAndNotExpired(userId, LocalDateTime.now());
        
        List<Integer> permIds = userPerms.stream()
                .map(UserPermission::getPermissionId)
                .toList();
        
        List<Permission> permissions = permIds.isEmpty() 
                ? List.of()
                : permissionRepository.findAllById(permIds);
        
        Map<Integer, Permission> permissionMap = permissions.stream()
                .collect(Collectors.toMap(Permission::getPermissionId, p -> p));
        
        return userPermissionMapper.toResponseDTOList(userPerms, permissionMap);
    }
    
    @Override
    @Transactional
    public void grantPermissionToUser(GrantUserPermissionRequestDTO request) {
        log.info("Cấp quyền {} cho user ID: {}", request.getPermissionKey(), request.getUserId());
        
        if (!userRepository.existsById(request.getUserId())) {
            throw new ResourceNotFoundException("Không tìm thấy user");
        }
        
        Permission permission = permissionRepository.findByPermissionKey(request.getPermissionKey())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy permission: " + request.getPermissionKey()));
        
        if (userPermissionRepository.existsByUserIdAndPermissionId(request.getUserId(), permission.getPermissionId())) {
            log.warn("User đã có permission này, bỏ qua");
            return;
        }
        
        UserPermission userPermission = new UserPermission();
        userPermission.setUserId(request.getUserId());
        userPermission.setPermissionId(permission.getPermissionId());
        userPermission.setExpiresAt(request.getExpiresAt());
        
        userPermissionRepository.save(userPermission);
        
        String expiryInfo = request.getExpiresAt() == null ? "vĩnh viễn" : "hết hạn " + request.getExpiresAt();
        log.info("Cấp quyền thành công: {} ({})", request.getPermissionKey(), expiryInfo);
    }
    
    @Override
    @Transactional
    public void revokePermissionFromUser(RevokeUserPermissionRequestDTO request) {
        log.info("Thu hồi quyền {} của user ID: {}", request.getPermissionKey(), request.getUserId());
        
        Permission permission = permissionRepository.findByPermissionKey(request.getPermissionKey())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy permission: " + request.getPermissionKey()));
        
        userPermissionRepository.deleteById(
            new UserPermission.UserPermissionId(request.getUserId(), permission.getPermissionId())
        );
        
        log.info("Thu hồi quyền thành công");
    }
    
    @Override
    @Transactional
    public void cleanupExpiredPermissions() {
        log.info("Cleanup expired permissions");
        
        userPermissionRepository.deleteExpiredPermissions(LocalDateTime.now());
        
        log.info("Cleanup expired permissions thành công");
    }
}


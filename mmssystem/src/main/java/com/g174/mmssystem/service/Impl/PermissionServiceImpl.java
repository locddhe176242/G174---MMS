package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.CreatePermissionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PermissionResponseDTO;
import com.g174.mmssystem.entity.Permission;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.UserPermission;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.PermissionMapper;
import com.g174.mmssystem.repository.PermissionRepository;
import com.g174.mmssystem.repository.UserPermissionRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IPermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionServiceImpl implements IPermissionService {
    
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final PermissionMapper permissionMapper;
    
    @Override
    @Transactional(readOnly = true)
    public List<PermissionResponseDTO> getAllPermissions() {
        log.info("Lấy tất cả permissions");
        List<Permission> permissions = permissionRepository.findAll();
        return permissionMapper.toResponseDTOList(permissions);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PermissionResponseDTO> getPermissionsByResource(String resource) {
        log.info("Lấy permissions của resource: {}", resource);
        List<Permission> permissions = permissionRepository.findByResource(resource);
        return permissionMapper.toResponseDTOList(permissions);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PermissionResponseDTO getPermissionById(Integer permissionId) {
        log.info("Lấy permission ID: {}", permissionId);
        
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy permission"));
        
        return permissionMapper.toResponseDTO(permission);
    }
    
    @Override
    @Transactional
    public PermissionResponseDTO createPermission(CreatePermissionRequestDTO request) {
        log.info("Tạo permission mới: {}", request.getPermissionKey());
        
        if (permissionRepository.findByPermissionKey(request.getPermissionKey()).isPresent()) {
            throw new DuplicateResourceException("Permission key đã tồn tại: " + request.getPermissionKey());
        }
        
        Permission permission = permissionMapper.toEntity(request);
        Permission savedPermission = permissionRepository.save(permission);
        
        log.info("Tạo permission thành công: {} (ID: {})", savedPermission.getPermissionKey(), savedPermission.getPermissionId());
        return permissionMapper.toResponseDTO(savedPermission);
    }
    
    @Override
    @Transactional
    public void deletePermission(Integer permissionId) {
        log.info("Xóa permission ID: {}", permissionId);
        
        if (!permissionRepository.existsById(permissionId)) {
            throw new ResourceNotFoundException("Không tìm thấy permission");
        }
        
        permissionRepository.deleteById(permissionId);
        log.info("Xóa permission thành công");
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean hasPermission(String userEmail, String permissionKey) {
        log.debug("Kiểm tra permission '{}' cho user: {}", permissionKey, userEmail);
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        
        Permission permission = permissionRepository.findByPermissionKey(permissionKey)
                .orElse(null);
        
        if (permission == null) {
            log.warn("Permission '{}' không tồn tại", permissionKey);
            return false;
        }
        
        UserPermission userPerm = userPermissionRepository.findByUserIdAndPermissionIdAndNotExpired(
                user.getId(), 
                permission.getPermissionId(),
                LocalDateTime.now()
        );
        
        if (userPerm != null) {
            log.debug("User có override permission: {}", permissionKey);
            return true;
        }
        
        String roleName = user.getUserRoles().stream()
                .findFirst()
                .map(ur -> ur.getRole().getRoleName())
                .orElse(null);
        
        if (roleName == null) {
            return false;
        }
        
        List<Permission> rolePermissions = permissionRepository.findPermissionsByRoleName(roleName);
        boolean hasRolePermission = rolePermissions.stream()
                .anyMatch(p -> p.getPermissionKey().equals(permissionKey));
        
        log.debug("User {} permission '{}' từ role: {}", hasRolePermission ? "có" : "không có", permissionKey, roleName);
        return hasRolePermission;
    }
}


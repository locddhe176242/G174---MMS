package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.AssignPermissionsToRoleRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PermissionResponseDTO;
import com.g174.mmssystem.dto.responseDTO.RoleDetailResponseDTO;
import com.g174.mmssystem.entity.MenuItem;
import com.g174.mmssystem.entity.Permission;
import com.g174.mmssystem.entity.Role;
import com.g174.mmssystem.entity.RolePermission;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.PermissionMapper;
import com.g174.mmssystem.mapper.RoleDetailMapper;
import com.g174.mmssystem.repository.MenuItemRepository;
import com.g174.mmssystem.repository.PermissionRepository;
import com.g174.mmssystem.repository.RolePermissionRepository;
import com.g174.mmssystem.repository.RoleRepository;
import com.g174.mmssystem.service.IService.IRolePermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RolePermissionServiceImpl implements IRolePermissionService {
    
    private final RolePermissionRepository rolePermissionRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final MenuItemRepository menuItemRepository;
    private final PermissionMapper permissionMapper;
    private final RoleDetailMapper roleDetailMapper;
    
    @Override
    @Transactional(readOnly = true)
    public List<PermissionResponseDTO> getPermissionsByRoleId(Integer roleId) {
        log.info("Lấy permissions của role ID: {}", roleId);
        
        if (!roleRepository.existsById(roleId)) {
            throw new ResourceNotFoundException("Không tìm thấy role");
        }
        
        List<Permission> permissions = permissionRepository.findPermissionsByRoleId(roleId);
        return permissionMapper.toResponseDTOList(permissions);
    }
    
    @Override
    @Transactional(readOnly = true)
    public RoleDetailResponseDTO getRoleDetail(Integer roleId) {
        log.info("Lấy chi tiết role ID: {}", roleId);
        
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role"));
        
        List<MenuItem> menus = menuItemRepository.findMenusByRoleId(roleId);
        List<Permission> permissions = permissionRepository.findPermissionsByRoleId(roleId);
        
        return roleDetailMapper.toResponseDTO(role, menus, permissions);
    }
    
    @Override
    @Transactional
    public void assignPermissionsToRole(AssignPermissionsToRoleRequestDTO request) {
        log.info("Assign {} permissions cho role ID: {}", request.getPermissionKeys().size(), request.getRoleId());
        
        if (!roleRepository.existsById(request.getRoleId())) {
            throw new ResourceNotFoundException("Không tìm thấy role");
        }
        
        List<Permission> permissions = permissionRepository.findByPermissionKeyIn(request.getPermissionKeys());
        if (permissions.size() != request.getPermissionKeys().size()) {
            throw new ResourceNotFoundException("Một số permission keys không tồn tại");
        }
        
        rolePermissionRepository.deleteByRoleId(request.getRoleId());
        
        for (Permission permission : permissions) {
            RolePermission rolePermission = new RolePermission();
            rolePermission.setRoleId(request.getRoleId());
            rolePermission.setPermissionId(permission.getPermissionId());
            rolePermissionRepository.save(rolePermission);
        }
        
        log.info("Assign permissions thành công cho role ID: {}", request.getRoleId());
    }
    
    @Override
    @Transactional
    public void removePermissionFromRole(Integer roleId, Integer permissionId) {
        log.info("Xóa permission {} khỏi role {}", permissionId, roleId);
        
        rolePermissionRepository.deleteByRoleIdAndPermissionId(roleId, permissionId);
        log.info("Xóa permission khỏi role thành công");
    }
    
    @Override
    @Transactional
    public void removeAllPermissionsFromRole(Integer roleId) {
        log.info("Xóa tất cả permissions của role {}", roleId);
        
        rolePermissionRepository.deleteByRoleId(roleId);
        log.info("Xóa tất cả permissions thành công");
    }
}


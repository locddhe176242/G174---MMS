package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.responseDTO.RoleResponseDTO;
import com.g174.mmssystem.entity.Role;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.RoleMapper;
import com.g174.mmssystem.repository.RoleRepository;
import com.g174.mmssystem.service.IService.IRoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleServiceImpl implements IRoleService {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponseDTO> getAllRoles() {
        log.info("Lấy tất cả vai trò");
        
        List<Role> roles = roleRepository.findAll();
        
        return roleMapper.toResponseDTOList(roles);
    }

    @Override
    @Transactional(readOnly = true)
    public RoleResponseDTO getRoleById(Integer roleId) {
        log.info("Lấy vai trò ID: {}", roleId);
        
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò ID: " + roleId));
        
        return roleMapper.toResponseDTO(role);
    }
}


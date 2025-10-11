package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.AssignMenusToRoleRequestDTO;
import com.g174.mmssystem.dto.responseDTO.MenuItemResponseDTO;
import com.g174.mmssystem.entity.MenuItem;
import com.g174.mmssystem.entity.RoleMenu;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.MenuItemMapper;
import com.g174.mmssystem.repository.MenuItemRepository;
import com.g174.mmssystem.repository.RoleMenuRepository;
import com.g174.mmssystem.repository.RoleRepository;
import com.g174.mmssystem.service.IService.IRoleMenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleMenuServiceImpl implements IRoleMenuService {
    
    private final RoleMenuRepository roleMenuRepository;
    private final RoleRepository roleRepository;
    private final MenuItemRepository menuItemRepository;
    private final MenuItemMapper menuItemMapper;
    
    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponseDTO> getMenusByRoleId(Integer roleId) {
        log.info("Lấy menus của role ID: {}", roleId);
        
        if (!roleRepository.existsById(roleId)) {
            throw new ResourceNotFoundException("Không tìm thấy role");
        }
        
        List<MenuItem> menuItems = menuItemRepository.findMenusByRoleId(roleId);
        return menuItemMapper.toResponseDTOList(menuItems);
    }
    
    @Override
    @Transactional
    public void assignMenusToRole(AssignMenusToRoleRequestDTO request) {
        log.info("Assign {} menus cho role ID: {}", request.getMenuIds().size(), request.getRoleId());
        
        if (!roleRepository.existsById(request.getRoleId())) {
            throw new ResourceNotFoundException("Không tìm thấy role");
        }
        
        for (Integer menuId : request.getMenuIds()) {
            if (!menuItemRepository.existsById(menuId)) {
                throw new ResourceNotFoundException("Không tìm thấy menu ID: " + menuId);
            }
        }
        
        roleMenuRepository.deleteByRoleId(request.getRoleId());
        
        for (Integer menuId : request.getMenuIds()) {
            RoleMenu roleMenu = new RoleMenu();
            roleMenu.setRoleId(request.getRoleId());
            roleMenu.setMenuId(menuId);
            roleMenuRepository.save(roleMenu);
        }
        
        log.info("Assign menus thành công cho role ID: {}", request.getRoleId());
    }
    
    @Override
    @Transactional
    public void removeMenuFromRole(Integer roleId, Integer menuId) {
        log.info("Xóa menu {} khỏi role {}", menuId, roleId);
        
        roleMenuRepository.deleteByRoleIdAndMenuId(roleId, menuId);
        log.info("Xóa menu khỏi role thành công");
    }
    
    @Override
    @Transactional
    public void removeAllMenusFromRole(Integer roleId) {
        log.info("Xóa tất cả menus của role {}", roleId);
        
        roleMenuRepository.deleteByRoleId(roleId);
        log.info("Xóa tất cả menus thành công");
    }
}


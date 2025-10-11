package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.AssignMenusToRoleRequestDTO;
import com.g174.mmssystem.dto.responseDTO.MenuItemResponseDTO;

import java.util.List;

public interface IRoleMenuService {
    
    List<MenuItemResponseDTO> getMenusByRoleId(Integer roleId);
    
    void assignMenusToRole(AssignMenusToRoleRequestDTO request);
    
    void removeMenuFromRole(Integer roleId, Integer menuId);
    
    void removeAllMenusFromRole(Integer roleId);
}


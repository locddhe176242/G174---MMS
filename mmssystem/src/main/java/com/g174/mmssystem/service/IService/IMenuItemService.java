package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.CreateMenuItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.UpdateMenuItemRequestDTO;
import com.g174.mmssystem.dto.responseDTO.MenuConfigResponseDTO;
import com.g174.mmssystem.dto.responseDTO.MenuItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.PageResponseDTO;

import java.util.List;

public interface IMenuItemService {
    List<MenuItemResponseDTO> getAllMenuItems();
    PageResponseDTO<MenuItemResponseDTO> getAllMenuItemsPaginated(int page, int size);
    MenuConfigResponseDTO getMenuConfigForCurrentUser();
    MenuConfigResponseDTO getMenuConfigByRoleName(String roleName);
    MenuItemResponseDTO getMenuItemById(Integer menuId);
    MenuItemResponseDTO createMenuItem(CreateMenuItemRequestDTO request);
    MenuItemResponseDTO updateMenuItem(Integer menuId, UpdateMenuItemRequestDTO request);
    void deleteMenuItem(Integer menuId);
}


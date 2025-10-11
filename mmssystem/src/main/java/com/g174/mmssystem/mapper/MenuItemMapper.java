package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.CreateMenuItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.UpdateMenuItemRequestDTO;
import com.g174.mmssystem.dto.responseDTO.MenuItemResponseDTO;
import com.g174.mmssystem.entity.MenuItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class MenuItemMapper {
    
    public MenuItemResponseDTO toResponseDTO(MenuItem entity) {
        if (entity == null) {
            return null;
        }
        
        return MenuItemResponseDTO.builder()
                .menuId(entity.getMenuId())
                .menuKey(entity.getMenuKey())
                .menuLabel(entity.getMenuLabel())
                .menuPath(entity.getMenuPath())
                .menuIcon(entity.getMenuIcon())
                .displayOrder(entity.getDisplayOrder())
                .build();
    }
    
    public List<MenuItemResponseDTO> toResponseDTOList(List<MenuItem> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    
    public MenuItem toEntity(CreateMenuItemRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        
        return MenuItem.builder()
                .menuKey(dto.getMenuKey())
                .menuLabel(dto.getMenuLabel())
                .menuPath(dto.getMenuPath())
                .menuIcon(dto.getMenuIcon())
                .displayOrder(dto.getDisplayOrder())
                .build();
    }
    
    public void updateEntityFromDTO(MenuItem entity, UpdateMenuItemRequestDTO dto) {
        if (entity == null || dto == null) {
            return;
        }
        
        if (dto.getMenuLabel() != null) {
            entity.setMenuLabel(dto.getMenuLabel());
        }
        if (dto.getMenuPath() != null) {
            entity.setMenuPath(dto.getMenuPath());
        }
        if (dto.getMenuIcon() != null) {
            entity.setMenuIcon(dto.getMenuIcon());
        }
        if (dto.getDisplayOrder() != null) {
            entity.setDisplayOrder(dto.getDisplayOrder());
        }
    }
}


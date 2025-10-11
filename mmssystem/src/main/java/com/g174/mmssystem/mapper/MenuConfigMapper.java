package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.MenuConfigResponseDTO;
import com.g174.mmssystem.dto.responseDTO.MenuItemResponseDTO;
import com.g174.mmssystem.entity.MenuItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MenuConfigMapper {
    
    private final MenuItemMapper menuItemMapper;
    
    public MenuConfigResponseDTO toMenuConfigResponseDTO(List<MenuItem> allMenus) {
        if (allMenus == null) {
            return MenuConfigResponseDTO.builder()
                    .mainMenu(List.of())
                    .operationMenu(List.of())
                    .managementMenu(List.of())
                    .build();
        }
        
        List<MenuItemResponseDTO> mainMenu = allMenus.stream()
                .filter(this::isMainMenu)
                .map(menuItemMapper::toResponseDTO)
                .collect(Collectors.toList());
        
        List<MenuItemResponseDTO> operationMenu = allMenus.stream()
                .filter(this::isOperationMenu)
                .map(menuItemMapper::toResponseDTO)
                .collect(Collectors.toList());
        
        List<MenuItemResponseDTO> managementMenu = allMenus.stream()
                .filter(this::isManagementMenu)
                .map(menuItemMapper::toResponseDTO)
                .collect(Collectors.toList());
        
        return MenuConfigResponseDTO.builder()
                .mainMenu(mainMenu)
                .operationMenu(operationMenu)
                .managementMenu(managementMenu)
                .build();
    }
    
    private boolean isMainMenu(MenuItem menu) {
        int order = menu.getDisplayOrder() != null ? menu.getDisplayOrder() : 0;
        return order >= 1 && order < 10;
    }
    
    private boolean isOperationMenu(MenuItem menu) {
        int order = menu.getDisplayOrder() != null ? menu.getDisplayOrder() : 0;
        return order >= 10 && order < 100;
    }
    
    private boolean isManagementMenu(MenuItem menu) {
        int order = menu.getDisplayOrder() != null ? menu.getDisplayOrder() : 0;
        return order >= 100;
    }
}


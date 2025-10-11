package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.CreateMenuItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.UpdateMenuItemRequestDTO;
import com.g174.mmssystem.dto.responseDTO.MenuConfigResponseDTO;
import com.g174.mmssystem.dto.responseDTO.MenuItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.PageResponseDTO;
import com.g174.mmssystem.entity.MenuItem;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.MenuConfigMapper;
import com.g174.mmssystem.mapper.MenuItemMapper;
import com.g174.mmssystem.repository.MenuItemRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IMenuItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MenuItemServiceImpl implements IMenuItemService {
    
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final MenuItemMapper menuItemMapper;
    private final MenuConfigMapper menuConfigMapper;
    
    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponseDTO> getAllMenuItems() {
        log.info("Lấy tất cả menu items");
        List<MenuItem> menuItems = menuItemRepository.findAllByOrderByDisplayOrderAsc();
        return menuItemMapper.toResponseDTOList(menuItems);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<MenuItemResponseDTO> getAllMenuItemsPaginated(int page, int size) {
        log.info("Lấy menu items phân trang - page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<MenuItem> menuPage = menuItemRepository.findAllByOrderByDisplayOrderAsc(pageable);
        Page<MenuItemResponseDTO> dtoPage = menuPage.map(menuItemMapper::toResponseDTO);
        return new PageResponseDTO<>(dtoPage);
    }
    
    @Override
    @Transactional(readOnly = true)
    public MenuConfigResponseDTO getMenuConfigForCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        log.info("Lấy menu config cho user: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        String roleName = user.getUserRoles().stream()
                .findFirst()
                .map(ur -> ur.getRole().getRoleName())
                .orElse("EMPLOYEE");
        return getMenuConfigByRoleName(roleName);
    }
    
    @Override
    @Transactional(readOnly = true)
    public MenuConfigResponseDTO getMenuConfigByRoleName(String roleName) {
        log.info("Lấy menu config cho role: {}", roleName);
        List<MenuItem> menuItems = menuItemRepository.findMenusByRoleName(roleName);
        return menuConfigMapper.toMenuConfigResponseDTO(menuItems);
    }
    
    @Override
    @Transactional(readOnly = true)
    public MenuItemResponseDTO getMenuItemById(Integer menuId) {
        log.info("Lấy menu item ID: {}", menuId);
        MenuItem menuItem = menuItemRepository.findById(menuId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy menu item"));
        return menuItemMapper.toResponseDTO(menuItem);
    }
    
    @Override
    @Transactional
    public MenuItemResponseDTO createMenuItem(CreateMenuItemRequestDTO request) {
        log.info("Tạo menu item mới: {}", request.getMenuKey());
        if (menuItemRepository.findByMenuKey(request.getMenuKey()).isPresent()) {
            throw new DuplicateResourceException("Menu key đã tồn tại: " + request.getMenuKey());
        }
        MenuItem menuItem = menuItemMapper.toEntity(request);
        MenuItem savedMenuItem = menuItemRepository.save(menuItem);
        log.info("Tạo menu item thành công: {} (ID: {})", savedMenuItem.getMenuKey(), savedMenuItem.getMenuId());
        return menuItemMapper.toResponseDTO(savedMenuItem);
    }
    
    @Override
    @Transactional
    public MenuItemResponseDTO updateMenuItem(Integer menuId, UpdateMenuItemRequestDTO request) {
        log.info("Cập nhật menu item ID: {}", menuId);
        MenuItem existingMenuItem = menuItemRepository.findById(menuId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy menu item"));
        menuItemMapper.updateEntityFromDTO(existingMenuItem, request);
        MenuItem updatedMenuItem = menuItemRepository.save(existingMenuItem);
        log.info("Cập nhật menu item thành công: {}", updatedMenuItem.getMenuKey());
        return menuItemMapper.toResponseDTO(updatedMenuItem);
    }
    
    @Override
    @Transactional
    public void deleteMenuItem(Integer menuId) {
        log.info("Xóa menu item ID: {}", menuId);
        if (!menuItemRepository.existsById(menuId)) {
            throw new ResourceNotFoundException("Không tìm thấy menu item");
        }
        menuItemRepository.deleteById(menuId);
        log.info("Xóa menu item thành công");
    }
}


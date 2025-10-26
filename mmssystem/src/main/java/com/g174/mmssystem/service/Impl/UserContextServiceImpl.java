package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.service.IService.IUserContextService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserContextServiceImpl implements IUserContextService {
    
    private final UserRepository userRepository;
    
    @Override
    public Integer getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                User user = userRepository.findByEmail(email).orElse(null);
                return user != null ? user.getId() : null;
            }
        } catch (Exception e) {
            log.warn("Error getting current user ID: {}", e.getMessage());
        }
        return null;
    }
    
    @Override
    public String getCurrentUserEmail() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                return authentication.getName();
            }
        } catch (Exception e) {
            log.warn("Error getting current user email: {}", e.getMessage());
        }
        return null;
    }
}

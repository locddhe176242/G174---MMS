package com.g174.mmssystem.service.IService;

/**
 * Service để lấy thông tin context của user hiện tại
 */
public interface IUserContextService {
    
    /**
     * Lấy ID của user hiện tại
     * @return User ID hoặc null nếu không tìm thấy
     */
    Integer getCurrentUserId();
    
    /**
     * Lấy email của user hiện tại
     * @return Email hoặc null nếu không tìm thấy
     */
    String getCurrentUserEmail();
}

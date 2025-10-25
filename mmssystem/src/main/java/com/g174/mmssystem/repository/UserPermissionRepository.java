package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UserPermission.UserPermissionId> {

    List<UserPermission> findByUserId(Integer userId);

    @Query("""
        SELECT up FROM UserPermission up
        WHERE up.userId = :userId
        AND (up.expiresAt IS NULL OR up.expiresAt > :now)
    """)
    List<UserPermission> findByUserIdAndNotExpired(@Param("userId") Integer userId, @Param("now") LocalDateTime now);

    @Query("""
        SELECT up FROM UserPermission up
        WHERE up.userId = :userId
        AND up.permissionId = :permissionId
        AND (up.expiresAt IS NULL OR up.expiresAt > :now)
    """)
    UserPermission findByUserIdAndPermissionIdAndNotExpired(
            @Param("userId") Integer userId,
            @Param("permissionId") Integer permissionId,
            @Param("now") LocalDateTime now
    );

    @Modifying
    @Query("DELETE FROM UserPermission up WHERE up.expiresAt IS NOT NULL AND up.expiresAt < :now")
    void deleteExpiredPermissions(@Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM UserPermission up WHERE up.userId = :userId")
    void deleteByUserId(@Param("userId") Integer userId);

    boolean existsByUserIdAndPermissionId(Integer userId, Integer permissionId);
}
package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_permissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(UserPermission.UserPermissionId.class)
public class UserPermission {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @Id
    @Column(name = "permission_id")
    private Integer permissionId;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserPermissionId implements Serializable {
        private Integer userId;
        private Integer permissionId;
    }
}
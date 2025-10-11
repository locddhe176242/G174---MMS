package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "role_permissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(RolePermission.RolePermissionId.class)
public class RolePermission {

    @Id
    @Column(name = "role_id")
    private Integer roleId;

    @Id
    @Column(name = "permission_id")
    private Integer permissionId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePermissionId implements Serializable {
        private Integer roleId;
        private Integer permissionId;
    }
}
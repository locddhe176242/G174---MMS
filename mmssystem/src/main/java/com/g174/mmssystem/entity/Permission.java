package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "permissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "permission_id")
    private Integer permissionId;

    @Column(name = "permission_key", unique = true, nullable = false)
    private String permissionKey;

    @Column(name = "permission_name", nullable = false)
    private String permissionName;

    @Column(name = "resource", nullable = false)
    private String resource;

    @Column(name = "action", nullable = false)
    private String action;
}
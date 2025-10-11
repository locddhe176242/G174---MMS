package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "role_menus")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(RoleMenu.RoleMenuId.class)
public class RoleMenu {

    @Id
    @Column(name = "role_id")
    private Integer roleId;

    @Id
    @Column(name = "menu_id")
    private Integer menuId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleMenuId implements Serializable {
        private Integer roleId;
        private Integer menuId;
    }
}
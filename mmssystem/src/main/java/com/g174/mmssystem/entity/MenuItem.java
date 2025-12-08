package com.g174.mmssystem.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_id")
    private Integer menuId;

    @Column(name = "menu_key", unique = true, nullable = false)
    private String menuKey;

    @Column(name = "menu_label", nullable = false)
    private String menuLabel;

    @Column(name = "menu_path", nullable = false)
    private String menuPath;

    @Column(name = "menu_icon")
    private String menuIcon;

    @Column(name = "parent_id")
    private Integer parentId;

    @Column(name = "display_order")
    private Integer displayOrder;
}
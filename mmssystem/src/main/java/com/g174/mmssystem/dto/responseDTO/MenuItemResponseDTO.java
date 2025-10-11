package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItemResponseDTO {
    private Integer menuId;
    private String menuKey;
    private String menuLabel;
    private String menuPath;
    private String menuIcon;
    private Integer displayOrder;
}
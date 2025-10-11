package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuConfigResponseDTO {
    private List<MenuItemResponseDTO> mainMenu;
    private List<MenuItemResponseDTO> operationMenu;
    private List<MenuItemResponseDTO> managementMenu;
}
package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMenuItemRequestDTO {

    @Size(max = 100, message = "Menu label tối đa 100 ký tự")
    private String menuLabel;

    @Size(max = 255, message = "Menu path tối đa 255 ký tự")
    private String menuPath;

    @Size(max = 50, message = "Menu icon tối đa 50 ký tự")
    private String menuIcon;

    private Integer displayOrder;
}
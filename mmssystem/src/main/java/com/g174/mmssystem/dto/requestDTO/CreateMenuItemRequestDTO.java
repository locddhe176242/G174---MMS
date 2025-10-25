package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class CreateMenuItemRequestDTO {

    @NotBlank(message = "Menu key không được để trống")
    @Size(max = 50, message = "Menu key tối đa 50 ký tự")
    private String menuKey;

    @NotBlank(message = "Menu label không được để trống")
    @Size(max = 100, message = "Menu label tối đa 100 ký tự")
    private String menuLabel;

    @NotBlank(message = "Menu path không được để trống")
    @Size(max = 255, message = "Menu path tối đa 255 ký tự")
    private String menuPath;

    @Size(max = 50, message = "Menu icon tối đa 50 ký tự")
    private String menuIcon;

    @NotNull(message = "Display order không được để trống")
    private Integer displayOrder;
}
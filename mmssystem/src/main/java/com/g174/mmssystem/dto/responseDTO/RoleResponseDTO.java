package com.g174.mmssystem.dto.responseDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponseDTO {
    private Integer roleId;
    private String roleName;
}
package com.g174.mmssystem.dto.responseDTO;

import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionResponseDTO {
    private Integer permissionId;
    private String permissionKey;
    private String permissionName;
    private String resource;
    private String action;
}
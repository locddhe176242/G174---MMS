package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleRequestDTO {
    @NotNull(message = "User ID không được để trống")
    private Integer userId;

    @NotEmpty(message = "Phải chọn ít nhất một vai trò")
    private Set<Integer> roleIds = new HashSet<>();
}
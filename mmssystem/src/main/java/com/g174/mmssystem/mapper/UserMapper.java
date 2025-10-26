package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.responseDTO.UserListResponseDTO;
import com.g174.mmssystem.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserListResponseDTO toListResponseDTO(User user) {
        if (user == null) {
            return null;
        }

        List<String> roles = user.getUserRoles() != null
                ? user.getUserRoles().stream()
                .map(ur -> ur.getRole().getRoleName())
                .collect(Collectors.toList())
                : List.of();

        String departmentName = user.getDepartment() != null
                ? user.getDepartment().getDepartmentName()
                : null;

        Integer departmentId = user.getDepartment() != null
                ? user.getDepartment().getId()
                : null;

        String fullName = null;
        String phoneNumber = null;
        if (user.getProfile() != null) {
            String firstName = user.getProfile().getFirstName();
            String lastName = user.getProfile().getLastName();

            if (firstName != null && lastName != null) {
                fullName = firstName + " " + lastName;
            } else if (firstName != null) {
                fullName = firstName;
            } else if (lastName != null) {
                fullName = lastName;
            }

            phoneNumber = user.getProfile().getPhoneNumber();
        }

        return UserListResponseDTO.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(fullName)
                .phoneNumber(phoneNumber)
                .employeeCode(user.getEmployeeCode())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .departmentId(departmentId)
                .departmentName(departmentName)
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }

    public List<UserListResponseDTO> toListResponseDTOList(List<User> users) {
        if (users == null) {
            return List.of();
        }

        return users.stream()
                .map(this::toListResponseDTO)
                .collect(Collectors.toList());
    }
}

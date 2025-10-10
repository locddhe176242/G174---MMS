package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.DepartmentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.DepartmentResponseDTO;
import com.g174.mmssystem.entity.Department;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DepartmentMapper {

    public DepartmentResponseDTO toResponseDTO(Department department) {
        if (department == null) {
            return null;
        }

        DepartmentResponseDTO dto = new DepartmentResponseDTO();
        dto.setDepartmentId(department.getId());
        dto.setDepartmentName(department.getDepartmentName());
        dto.setDepartmentCode(department.getDepartmentCode());
        dto.setDescription(department.getDescription());
        dto.setCreatedAt(department.getCreatedAt());
        dto.setUpdatedAt(department.getUpdatedAt());

        return dto;
    }

    public Department toEntity(DepartmentRequestDTO dto) {
        if (dto == null) {
            return null;
        }

        Department department = new Department();
        department.setDepartmentName(dto.getDepartmentName());
        department.setDepartmentCode(dto.getDepartmentCode());
        department.setDescription(dto.getDescription());

        return department;
    }

    public void updateEntityFromDTO(DepartmentRequestDTO dto, Department department) {
        if (dto == null || department == null) {
            return;
        }

        department.setDepartmentName(dto.getDepartmentName());
        department.setDepartmentCode(dto.getDepartmentCode());
        department.setDescription(dto.getDescription());
    }

    public List<DepartmentResponseDTO> toResponseDTOList(List<Department> departments) {
        if (departments == null) {
            return null;
        }

        return departments.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
}
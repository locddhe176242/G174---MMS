package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.DepartmentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.DepartmentResponseDTO;

import java.util.List;

public interface IDepartmentService {
    List<DepartmentResponseDTO> getAllDepartments();
    DepartmentResponseDTO getDepartmentById(Integer departmentId);
    DepartmentResponseDTO createDepartment(DepartmentRequestDTO request);
    DepartmentResponseDTO updateDepartment(Integer departmentId, DepartmentRequestDTO request);
    void deleteDepartment(Integer departmentId);
    void restoreDepartment(Integer departmentId);
}


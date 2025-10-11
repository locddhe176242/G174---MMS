package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.responseDTO.DepartmentResponseDTO;
import com.g174.mmssystem.entity.Department;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.DepartmentMapper;
import com.g174.mmssystem.repository.DepartmentRepository;
import com.g174.mmssystem.service.IService.IDepartmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentServiceImpl implements IDepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentMapper departmentMapper;

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponseDTO> getAllDepartments() {
        log.info("Lấy tất cả phòng ban");
        
        List<Department> departments = departmentRepository.findAll().stream()
                .filter(d -> d.getDeletedAt() == null)
                .collect(Collectors.toList());
        
        return departmentMapper.toResponseDTOList(departments);
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponseDTO getDepartmentById(Integer departmentId) {
        log.info("Lấy phòng ban ID: {}", departmentId);
        
        Department department = departmentRepository.findById(departmentId)
                .filter(d -> d.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban ID: " + departmentId));
        
        return departmentMapper.toResponseDTO(department);
    }
}


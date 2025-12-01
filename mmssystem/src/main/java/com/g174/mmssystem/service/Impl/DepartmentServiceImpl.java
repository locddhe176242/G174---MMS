package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.DepartmentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.DepartmentResponseDTO;
import com.g174.mmssystem.entity.Department;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.mapper.DepartmentMapper;
import com.g174.mmssystem.repository.DepartmentRepository;
import com.g174.mmssystem.service.IService.IDepartmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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

    @Override
    @Transactional
    public DepartmentResponseDTO createDepartment(DepartmentRequestDTO request) {
        log.info("Tạo phòng ban mới: {}", request.getDepartmentName());

        if (departmentRepository.existsByDepartmentCode(request.getDepartmentCode())) {
            throw new DuplicateResourceException("Mã phòng ban đã tồn tại: " + request.getDepartmentCode());
        }

        Department department = departmentMapper.toEntity(request);
        department = departmentRepository.save(department);

        log.info("Tạo phòng ban thành công ID: {}", department.getId());
        return departmentMapper.toResponseDTO(department);
    }

    @Override
    @Transactional
    public DepartmentResponseDTO updateDepartment(Integer departmentId, DepartmentRequestDTO request) {
        log.info("Cập nhật phòng ban ID: {}", departmentId);

        Department department = departmentRepository.findById(departmentId)
                .filter(d -> d.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban ID: " + departmentId));

        if (!department.getDepartmentCode().equals(request.getDepartmentCode()) &&
                departmentRepository.existsByDepartmentCode(request.getDepartmentCode())) {
            throw new DuplicateResourceException("Mã phòng ban đã tồn tại: " + request.getDepartmentCode());
        }

        departmentMapper.updateEntityFromDTO(request, department);
        department = departmentRepository.save(department);

        log.info("Cập nhật phòng ban thành công ID: {}", department.getId());
        return departmentMapper.toResponseDTO(department);
    }

    @Override
    @Transactional
    public void deleteDepartment(Integer departmentId) {
        log.info("Xóa phòng ban ID: {}", departmentId);

        Department department = departmentRepository.findById(departmentId)
                .filter(d -> d.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban ID: " + departmentId));

        // Soft delete
        department.setDeletedAt(Instant.now());
        departmentRepository.save(department);

        log.info("Xóa phòng ban thành công ID: {}", departmentId);
    }

    @Override
    @Transactional
    public void restoreDepartment(Integer departmentId) {
        log.info("Khôi phục phòng ban ID: {}", departmentId);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban ID: " + departmentId));

        // Restore by clearing deletedAt
        department.setDeletedAt(null);
        departmentRepository.save(department);

        log.info("Khôi phục phòng ban thành công ID: {}", departmentId);
    }
}

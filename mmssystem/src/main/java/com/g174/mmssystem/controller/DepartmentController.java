package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.DepartmentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.DepartmentResponseDTO;
import com.g174.mmssystem.service.IService.IDepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@Slf4j
public class DepartmentController {

    private final IDepartmentService departmentService;

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getAllDepartments() {
        log.info("API: Lấy tất cả departments");

        List<DepartmentResponseDTO> departments = departmentService.getAllDepartments();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lấy danh sách phòng ban thành công");
        response.put("data", departments);
        response.put("total", departments.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{departmentId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getDepartmentById(@PathVariable Integer departmentId) {
        log.info("API: Lấy department ID: {}", departmentId);

        DepartmentResponseDTO department = departmentService.getDepartmentById(departmentId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lấy thông tin phòng ban thành công");
        response.put("data", department);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(action = "CREATE_DEPARTMENT", activityType = "USER_MANAGEMENT",
            description = "Tạo phòng ban mới: #{#request.departmentName}",
            entityId = "#{#result.body.data.departmentId}")
    public ResponseEntity<Map<String, Object>> createDepartment(@Valid @RequestBody DepartmentRequestDTO request) {
        log.info("API: Tạo department mới: {}", request.getDepartmentName());

        DepartmentResponseDTO department = departmentService.createDepartment(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Tạo phòng ban thành công");
        response.put("data", department);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{departmentId}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(action = "UPDATE_DEPARTMENT", activityType = "USER_MANAGEMENT",
            description = "Cập nhật phòng ban ID: #{#departmentId}",
            entityId = "#{#departmentId}")
    public ResponseEntity<Map<String, Object>> updateDepartment(
            @PathVariable Integer departmentId,
            @Valid @RequestBody DepartmentRequestDTO request) {
        log.info("API: Cập nhật department ID: {}", departmentId);

        DepartmentResponseDTO department = departmentService.updateDepartment(departmentId, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Cập nhật phòng ban thành công");
        response.put("data", department);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{departmentId}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(action = "DELETE_DEPARTMENT", activityType = "USER_MANAGEMENT",
            description = "Dừng hoạt động phòng ban ID: #{#departmentId}",
            entityId = "#{#departmentId}")
    public ResponseEntity<Map<String, Object>> deleteDepartment(@PathVariable Integer departmentId) {
        log.info("API: Dừng hoạt động department ID: {}", departmentId);

        departmentService.deleteDepartment(departmentId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Dừng hoạt động phòng ban thành công");

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{departmentId}/restore")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> restoreDepartment(@PathVariable Integer departmentId) {
        log.info("API: Khôi phục department ID: {}", departmentId);

        departmentService.restoreDepartment(departmentId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Khôi phục phòng ban thành công");

        return ResponseEntity.ok(response);
    }
}

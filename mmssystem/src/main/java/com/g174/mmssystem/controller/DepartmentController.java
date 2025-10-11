package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.responseDTO.DepartmentResponseDTO;
import com.g174.mmssystem.service.IService.IDepartmentService;
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
}


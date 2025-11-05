package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.service.IService.IPurchaseRequisitionService;
import com.g174.mmssystem.service.IService.IUserContextService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-requisitions")
@RequiredArgsConstructor
@Slf4j
public class PurchaseRequisitionController {

    private final IPurchaseRequisitionService requisitionService;
    private final IUserContextService userContextService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createRequisition(
            @Valid @RequestBody PurchaseRequisitionRequestDTO requestDTO,
            Authentication authentication) {
        log.info("API: Tạo purchase requisition mới");

        Integer requesterId = userContextService.getCurrentUserId();
        if (requesterId == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Không thể xác định người dùng hiện tại");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }

        PurchaseRequisitionResponseDTO response = requisitionService.createRequisition(requestDTO, requesterId);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Tạo purchase requisition thành công");
        responseMap.put("data", response);

        return ResponseEntity.status(HttpStatus.CREATED).body(responseMap);
    }

    @GetMapping("/{requisitionId}")
    public ResponseEntity<Map<String, Object>> getRequisitionById(@PathVariable Long requisitionId) {
        log.info("API: Lấy purchase requisition ID: {}", requisitionId);

        PurchaseRequisitionResponseDTO response = requisitionService.getRequisitionById(requisitionId);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Lấy thông tin purchase requisition thành công");
        responseMap.put("data", response);

        return ResponseEntity.ok(responseMap);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllRequisitions() {
        log.info("API: Lấy tất cả purchase requisitions");

        List<PurchaseRequisitionResponseDTO> requisitions = requisitionService.getAllRequisitions();

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Lấy danh sách purchase requisitions thành công");
        responseMap.put("data", requisitions);
        responseMap.put("total", requisitions.size());

        return ResponseEntity.ok(responseMap);
    }

    @GetMapping("/page")
    public ResponseEntity<Map<String, Object>> getAllRequisitionsWithPagination(Pageable pageable) {
        log.info("API: Lấy danh sách purchase requisitions với phân trang - page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<PurchaseRequisitionResponseDTO> requisitions = requisitionService.getAllRequisitions(pageable);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Lấy danh sách purchase requisitions thành công");
        responseMap.put("data", requisitions.getContent());
        responseMap.put("totalElements", requisitions.getTotalElements());
        responseMap.put("totalPages", requisitions.getTotalPages());
        responseMap.put("currentPage", requisitions.getNumber());
        responseMap.put("pageSize", requisitions.getSize());

        return ResponseEntity.ok(responseMap);
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchRequisitions(
            @RequestParam(required = false, defaultValue = "") String keyword) {
        log.info("API: Tìm kiếm purchase requisitions với keyword: '{}'", keyword);

        List<PurchaseRequisitionResponseDTO> requisitions = requisitionService.searchRequisitions(keyword);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Tìm kiếm purchase requisitions thành công");
        responseMap.put("data", requisitions);
        responseMap.put("total", requisitions.size());

        return ResponseEntity.ok(responseMap);
    }

    @GetMapping("/search/page")
    public ResponseEntity<Map<String, Object>> searchRequisitionsWithPagination(
            @RequestParam(required = false, defaultValue = "") String keyword,
            Pageable pageable) {
        log.info("API: Tìm kiếm purchase requisitions với keyword: '{}' và phân trang - page: {}, size: {}",
                keyword, pageable.getPageNumber(), pageable.getPageSize());

        Page<PurchaseRequisitionResponseDTO> requisitions = requisitionService.searchRequisitions(keyword, pageable);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Tìm kiếm purchase requisitions thành công");
        responseMap.put("data", requisitions.getContent());
        responseMap.put("totalElements", requisitions.getTotalElements());
        responseMap.put("totalPages", requisitions.getTotalPages());
        responseMap.put("currentPage", requisitions.getNumber());
        responseMap.put("pageSize", requisitions.getSize());

        return ResponseEntity.ok(responseMap);
    }

    @PutMapping("/{requisitionId}")
    public ResponseEntity<Map<String, Object>> updateRequisition(
            @PathVariable Long requisitionId,
            @Valid @RequestBody PurchaseRequisitionRequestDTO requestDTO,
            Authentication authentication) {
        log.info("API: Cập nhật purchase requisition ID: {}", requisitionId);

        Integer updatedById = userContextService.getCurrentUserId();
        if (updatedById == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Không thể xác định người dùng hiện tại");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }

        PurchaseRequisitionResponseDTO response = requisitionService.updateRequisition(requisitionId, requestDTO, updatedById);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Cập nhật purchase requisition thành công");
        responseMap.put("data", response);

        return ResponseEntity.ok(responseMap);
    }

    @PostMapping("/{requisitionId}/approve")
    public ResponseEntity<Map<String, Object>> approveRequisition(
            @PathVariable Long requisitionId,
            Authentication authentication) {
        log.info("API: Approve purchase requisition ID: {}", requisitionId);

        Integer approverId = userContextService.getCurrentUserId();
        if (approverId == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Không thể xác định người dùng hiện tại");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }

        PurchaseRequisitionResponseDTO response = requisitionService.approveRequisition(requisitionId, approverId);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Approve purchase requisition thành công");
        responseMap.put("data", response);

        return ResponseEntity.ok(responseMap);
    }

    @PostMapping("/{requisitionId}/reject")
    public ResponseEntity<Map<String, Object>> rejectRequisition(
            @PathVariable Long requisitionId,
            @RequestParam(required = false, defaultValue = "") String reason,
            Authentication authentication) {
        log.info("API: Reject purchase requisition ID: {} với lý do: {}", requisitionId, reason);

        Integer approverId = userContextService.getCurrentUserId();
        if (approverId == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Không thể xác định người dùng hiện tại");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }

        PurchaseRequisitionResponseDTO response = requisitionService.rejectRequisition(requisitionId, approverId, reason);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Reject purchase requisition thành công");
        responseMap.put("data", response);

        return ResponseEntity.ok(responseMap);
    }

    @PostMapping("/{requisitionId}/close")
    public ResponseEntity<Map<String, Object>> closeRequisition(@PathVariable Long requisitionId) {
        log.info("API: Đóng purchase requisition ID: {}", requisitionId);

        PurchaseRequisitionResponseDTO response = requisitionService.closeRequisition(requisitionId);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Đóng purchase requisition thành công");
        responseMap.put("data", response);

        return ResponseEntity.ok(responseMap);
    }

    @PostMapping("/{requisitionId}/restore")
    public ResponseEntity<Map<String, Object>> restoreRequisition(@PathVariable Long requisitionId) {
        log.info("API: Khôi phục purchase requisition ID: {}", requisitionId);

        PurchaseRequisitionResponseDTO response = requisitionService.restoreRequisition(requisitionId);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Khôi phục purchase requisition thành công");
        responseMap.put("data", response);

        return ResponseEntity.ok(responseMap);
    }

    @DeleteMapping("/{requisitionId}")
    public ResponseEntity<Map<String, Object>> deleteRequisition(@PathVariable Long requisitionId) {
        log.info("API: Xóa purchase requisition ID: {}", requisitionId);

        PurchaseRequisitionResponseDTO response = requisitionService.deleteRequisition(requisitionId);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Xóa purchase requisition thành công");
        responseMap.put("data", response);

        return ResponseEntity.ok(responseMap);
    }

    @GetMapping("/generate-number")
    public ResponseEntity<Map<String, Object>> generateRequisitionNumber() {
        log.info("API: Tạo requisition number mới");

        String requisitionNo = requisitionService.generateRequisitionNo();

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("message", "Tạo requisition number thành công");
        responseMap.put("requisition_no", requisitionNo);

        return ResponseEntity.ok(responseMap);
    }

    @GetMapping("/exists/{requisitionNo}")
    public ResponseEntity<Map<String, Object>> checkRequisitionNoExists(@PathVariable String requisitionNo) {
        log.info("API: Kiểm tra requisition number tồn tại: {}", requisitionNo);

        boolean exists = requisitionService.existsByRequisitionNo(requisitionNo);

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("success", true);
        responseMap.put("exists", exists);

        return ResponseEntity.ok(responseMap);
    }
}


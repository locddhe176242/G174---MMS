package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.enums.RequisitionStatus;
import com.g174.mmssystem.service.IService.IPurchaseRequisitionService;
import com.g174.mmssystem.service.IService.IUserContextService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-requisitions")
@RequiredArgsConstructor
@Slf4j
public class PurchaseRequisitionController {

    private final IPurchaseRequisitionService requisitionService;
    private final IUserContextService userContextService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(action = "CREATE_PURCHASE_REQUISITION", activityType = "PURCHASE_MANAGEMENT",
            description = "Tạo yêu cầu mua hàng mới",
            entityId = "#{#result.body.requisitionId}")
    public ResponseEntity<PurchaseRequisitionResponseDTO> createRequisition(
            @RequestBody PurchaseRequisitionRequestDTO requestDTO) {
        log.info("API: Tạo purchase requisition");
        Integer requesterId = userContextService.getCurrentUserId();
        if (requesterId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PurchaseRequisitionResponseDTO response = requisitionService.createRequisition(requestDTO, requesterId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{requisitionId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<PurchaseRequisitionResponseDTO> getRequisitionById(@PathVariable Long requisitionId) {
        log.info("API: Lấy purchase requisition ID: {}", requisitionId);
        PurchaseRequisitionResponseDTO response = requisitionService.getRequisitionById(requisitionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Page<PurchaseRequisitionResponseDTO>> getAllRequisitionsPaged(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("API: Lấy danh sách purchase requisitions với pagination, status: {}", status);
        Page<PurchaseRequisitionResponseDTO> response;
        if (status != null && !status.trim().isEmpty()) {
            try {
                RequisitionStatus statusEnum = RequisitionStatus.valueOf(status.trim());
                response = requisitionService.getAllRequisitionsByStatus(statusEnum, pageable);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value: {}, returning all requisitions", status);
                response = requisitionService.getAllRequisitions(pageable);
            }
        } else {
            response = requisitionService.getAllRequisitions(pageable);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Page<PurchaseRequisitionResponseDTO>> searchRequisitionsPaged(
            @RequestParam String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("API: Tìm kiếm purchase requisitions với keyword: {} và pagination", keyword);
        Page<PurchaseRequisitionResponseDTO> response = requisitionService.searchRequisitions(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requisitionId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(action = "UPDATE_PURCHASE_REQUISITION", activityType = "PURCHASE_MANAGEMENT",
            description = "Cập nhật yêu cầu mua hàng",
            entityId = "#{#requisitionId}")
    public ResponseEntity<PurchaseRequisitionResponseDTO> updateRequisition(
            @PathVariable Long requisitionId,
            @RequestBody PurchaseRequisitionRequestDTO requestDTO) {
        // validation được xử lý ở service level dựa trên status
        // Nếu status = Draft: không validate
        // Nếu status != Draft: validate đầy đủ
        log.info("API: Cập nhật purchase requisition ID: {}", requisitionId);
        Integer updatedById = userContextService.getCurrentUserId();
        if (updatedById == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PurchaseRequisitionResponseDTO response = requisitionService.updateRequisition(requisitionId, requestDTO, updatedById);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{requisitionId}/submit")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(action = "SUBMIT_PURCHASE_REQUISITION", activityType = "PURCHASE_MANAGEMENT",
            description = "Gửi yêu cầu mua hàng",
            entityId = "#{#requisitionId}")
    public ResponseEntity<PurchaseRequisitionResponseDTO> submitRequisition(@PathVariable Long requisitionId) {
        log.info("API: Submit purchase requisition ID: {}", requisitionId);
        Integer requesterId = userContextService.getCurrentUserId();
        if (requesterId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PurchaseRequisitionResponseDTO response = requisitionService.submitRequisition(requisitionId, requesterId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requisitionId}/approve")
    @PreAuthorize("hasAnyRole('MANAGER')")
    @LogActivity(action = "APPROVE_PURCHASE_REQUISITION", activityType = "PURCHASE_MANAGEMENT",
            description = "Phê duyệt yêu cầu mua hàng",
            entityId = "#{#requisitionId}")
    public ResponseEntity<PurchaseRequisitionResponseDTO> approveRequisition(@PathVariable Long requisitionId) {
        log.info("API: Approve purchase requisition ID: {}", requisitionId);
        Integer approverId = userContextService.getCurrentUserId();
        if (approverId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PurchaseRequisitionResponseDTO response = requisitionService.approveRequisition(requisitionId, approverId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requisitionId}/reject")
    @PreAuthorize("hasAnyRole('MANAGER')")
    @LogActivity(action = "REJECT_PURCHASE_REQUISITION", activityType = "PURCHASE_MANAGEMENT",
            description = "Từ chối yêu cầu mua hàng",
            entityId = "#{#requisitionId}")
    public ResponseEntity<PurchaseRequisitionResponseDTO> rejectRequisition(
            @PathVariable Long requisitionId,
            @RequestParam(required = false) String reason) {
        log.info("API: Reject purchase requisition ID: {}", requisitionId);
        Integer approverId = userContextService.getCurrentUserId();
        if (approverId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PurchaseRequisitionResponseDTO response = requisitionService.rejectRequisition(requisitionId, approverId, reason);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requisitionId}/close")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(action = "CLOSE_PURCHASE_REQUISITION", activityType = "PURCHASE_MANAGEMENT",
            description = "Đóng yêu cầu mua hàng",
            entityId = "#{#requisitionId}")
    public ResponseEntity<PurchaseRequisitionResponseDTO> closeRequisition(@PathVariable Long requisitionId) {
        log.info("API: Close purchase requisition ID: {}", requisitionId);
        PurchaseRequisitionResponseDTO response = requisitionService.closeRequisition(requisitionId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requisitionId}/convert")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(action = "CONVERT_PURCHASE_REQUISITION", activityType = "PURCHASE_MANAGEMENT",
            description = "Chuyển đổi yêu cầu mua hàng thành RFQ",
            entityId = "#{#requisitionId}")
    public ResponseEntity<PurchaseRequisitionResponseDTO> convertRequisition(@PathVariable Long requisitionId) {
        log.info("API: Convert purchase requisition ID: {} to RFQ", requisitionId);
        PurchaseRequisitionResponseDTO response = requisitionService.convertRequisition(requisitionId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{requisitionId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(action = "DELETE_PURCHASE_REQUISITION", activityType = "PURCHASE_MANAGEMENT",
            description = "Xóa yêu cầu mua hàng",
            entityId = "#{#requisitionId}")
    public ResponseEntity<PurchaseRequisitionResponseDTO> deleteRequisition(@PathVariable Long requisitionId) {
        log.info("API: Xóa purchase requisition ID: {}", requisitionId);
        PurchaseRequisitionResponseDTO response = requisitionService.deleteRequisition(requisitionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/generate-number")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<String> generateRequisitionNo() {
        log.info("API: Generate requisition number");
        String requisitionNo = requisitionService.generateRequisitionNo();
        return ResponseEntity.ok(requisitionNo);
    }
}


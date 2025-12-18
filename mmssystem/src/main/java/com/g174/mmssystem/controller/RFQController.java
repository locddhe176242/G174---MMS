package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.RFQRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RFQResponseDTO;
import com.g174.mmssystem.entity.RFQ;
import com.g174.mmssystem.service.IService.IRFQService;
import com.g174.mmssystem.service.IService.IUserContextService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rfqs")
@RequiredArgsConstructor
@Slf4j
public class RFQController {

    private final IRFQService rfqService;
    private final IUserContextService userContextService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(
            action = "CREATE_RFQ",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Tạo RFQ mới: #{#result.body.data.rfqNo}",
            entityId = "#{#result.body.data.rfqId}"
    )
    public ResponseEntity<Map<String, Object>> createRFQ(
            @Valid @RequestBody RFQRequestDTO requestDTO) {
        log.info("REST: Creating RFQ");

        Integer createdById = userContextService.getCurrentUserId();
        if (createdById == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Không thể xác định người dùng hiện tại"));
        }

        RFQResponseDTO response = rfqService.createRFQ(requestDTO, createdById);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Tạo RFQ thành công");
        result.put("data", response);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/{rfqId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Map<String, Object>> getRFQById(@PathVariable Integer rfqId) {
        log.info("REST: Fetching RFQ ID: {}", rfqId);

        RFQResponseDTO response = rfqService.getRFQById(rfqId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Lấy thông tin RFQ thành công");
        result.put("data", response);
        return ResponseEntity.ok(result);
    }

    // ===================== GET ALL WITH PAGINATION (REQUIRED) =====================
    // Note: getAllRFQs() without pagination has been removed for ERP safety
    // All list operations must use pagination

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Map<String, Object>> getAllRFQsPaged(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("REST: Fetching RFQs with pagination");

        Page<RFQResponseDTO> response = rfqService.getAllRFQs(pageable);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Lấy danh sách RFQs thành công");
        result.put("data", response);
        return ResponseEntity.ok(result);
    }

    // ===================== SEARCH WITH PAGINATION (REQUIRED) =====================
    // Note: searchRFQs() without pagination has been removed for ERP safety
    // All search operations must use pagination

    @GetMapping("/search/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Map<String, Object>> searchRFQsPaged(
            @RequestParam String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("REST: Searching RFQs with keyword: {} and pagination", keyword);

        Page<RFQResponseDTO> response = rfqService.searchRFQs(keyword, pageable);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Tìm kiếm RFQs thành công");
        result.put("data", response);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/requisition/{requisitionId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Map<String, Object>> getRFQsByRequisitionId(@PathVariable Long requisitionId) {
        log.info("REST: Fetching RFQs for Requisition ID: {}", requisitionId);

        List<RFQResponseDTO> response = rfqService.getRFQsByRequisitionId(requisitionId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Lấy danh sách RFQs thành công");
        result.put("data", response);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{rfqId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(
            action = "UPDATE_RFQ",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Cập nhật RFQ",
            entityId = "#{#rfqId}"
    )
    public ResponseEntity<Map<String, Object>> updateRFQ(
            @PathVariable Integer rfqId,
            @Valid @RequestBody RFQRequestDTO requestDTO) {
        log.info("REST: Updating RFQ ID: {}", rfqId);

        Integer updatedById = userContextService.getCurrentUserId();
        if (updatedById == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Không thể xác định người dùng hiện tại"));
        }

        RFQResponseDTO response = rfqService.updateRFQ(rfqId, requestDTO, updatedById);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Cập nhật RFQ thành công");
        result.put("data", response);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{rfqId}/status")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Map<String, Object>> updateRFQStatus(
            @PathVariable Integer rfqId,
            @RequestParam RFQ.RFQStatus status) {
        log.info("REST: Updating RFQ status ID: {} to {}", rfqId, status);

        RFQResponseDTO response = rfqService.updateRFQStatus(rfqId, status);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Cập nhật trạng thái RFQ thành công");
        result.put("data", response);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{rfqId}/close")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(
            action = "CLOSE_RFQ",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Đóng RFQ",
            entityId = "#{#rfqId}"
    )
    public ResponseEntity<Map<String, Object>> closeRFQ(@PathVariable Integer rfqId) {
        log.info("REST: Closing RFQ ID: {}", rfqId);

        RFQResponseDTO response = rfqService.closeRFQ(rfqId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Đóng RFQ thành công");
        result.put("data", response);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{rfqId}/cancel")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(
            action = "CANCEL_RFQ",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Hủy RFQ",
            entityId = "#{#rfqId}"
    )
    public ResponseEntity<Map<String, Object>> cancelRFQ(@PathVariable Integer rfqId) {
        log.info("REST: Cancelling RFQ ID: {}", rfqId);

        RFQResponseDTO response = rfqService.cancelRFQ(rfqId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Hủy RFQ thành công");
        result.put("data", response);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{rfqId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(
            action = "DELETE_RFQ",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Xóa RFQ",
            entityId = "#{#rfqId}"
    )
    public ResponseEntity<Map<String, Object>> deleteRFQ(@PathVariable Integer rfqId) {
        log.info("REST: Deleting RFQ ID: {}", rfqId);

        RFQResponseDTO response = rfqService.deleteRFQ(rfqId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Xóa RFQ thành công");
        result.put("data", response);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/generate-number")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Map<String, Object>> generateRfqNo() {
        log.info("REST: Generating RFQ number");

        String rfqNo = rfqService.generateRfqNo();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Tạo RFQ number thành công");
        result.put("data", rfqNo);
        return ResponseEntity.ok(result);
    }
}


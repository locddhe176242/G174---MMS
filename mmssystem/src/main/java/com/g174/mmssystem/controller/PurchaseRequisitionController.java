package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.service.IService.IPurchaseRequisitionService;
import com.g174.mmssystem.service.IService.IUserContextService;
import jakarta.validation.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-requisitions")
@RequiredArgsConstructor
@Slf4j
public class PurchaseRequisitionController {

    private final IPurchaseRequisitionService requisitionService;
    private final IUserContextService userContextService;


    @Getter
    @Setter
    @AllArgsConstructor
    static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
    }

    // ===================== CREATE =====================
    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponseDTO>> createRequisition(
            @Valid @RequestBody PurchaseRequisitionRequestDTO requestDTO) {

        log.info("API: Tạo purchase requisition mới");

        Integer requesterId = userContextService.getCurrentUserId();
        if (requesterId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Không thể xác định người dùng hiện tại", null));
        }

        PurchaseRequisitionResponseDTO response = requisitionService.createRequisition(requestDTO, requesterId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Tạo purchase requisition thành công", response));
    }

    // ===================== SAVE DRAFT =====================
    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponseDTO>> saveDraft(
            @RequestBody PurchaseRequisitionRequestDTO requestDTO) {

        log.info("API: Lưu bản nháp purchase requisition");

        Integer requesterId = userContextService.getCurrentUserId();
        if (requesterId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Không thể xác định người dùng hiện tại", null));
        }

    
        requestDTO.setStatus(com.g174.mmssystem.enums.RequisitionStatus.Draft);
        
        PurchaseRequisitionResponseDTO response = requisitionService.createRequisition(requestDTO, requesterId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Lưu bản nháp thành công", response));
    }

    // ===================== GET BY ID =====================
    @GetMapping("/{requisitionId}")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponseDTO>> getRequisitionById(
            @PathVariable Integer requisitionId) {

        log.info("API: Lấy purchase requisition ID: {}", requisitionId);
        PurchaseRequisitionResponseDTO response = requisitionService.getRequisitionById(requisitionId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy thông tin purchase requisition thành công", response));
    }

    // ===================== GET ALL =====================
    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseRequisitionResponseDTO>>> getAllRequisitions() {

        log.info("API: Lấy tất cả purchase requisitions");
        List<PurchaseRequisitionResponseDTO> response = requisitionService.getAllRequisitions();
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy danh sách purchase requisitions thành công", response));
    }

    // ===================== GET ALL WITH PAGINATION =====================
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<Page<PurchaseRequisitionResponseDTO>>> getAllRequisitionsWithPagination(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("API: Lấy danh sách purchase requisitions với phân trang - page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<PurchaseRequisitionResponseDTO> response = requisitionService.getAllRequisitions(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy danh sách purchase requisitions thành công", response));
    }

    // ===================== SEARCH =====================
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<PurchaseRequisitionResponseDTO>>> searchRequisitions(
            @RequestParam(required = false, defaultValue = "") String keyword) {

        log.info("API: Tìm kiếm purchase requisitions với keyword: '{}'", keyword);
        List<PurchaseRequisitionResponseDTO> response = requisitionService.searchRequisitions(keyword);
        return ResponseEntity.ok(new ApiResponse<>(true, "Tìm kiếm purchase requisitions thành công", response));
    }

    // ===================== SEARCH WITH PAGINATION =====================
    @GetMapping("/search/page")
    public ResponseEntity<ApiResponse<Page<PurchaseRequisitionResponseDTO>>> searchRequisitionsWithPagination(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("API: Tìm kiếm purchase requisitions với keyword: '{}' và phân trang - page: {}, size: {}",
                keyword, pageable.getPageNumber(), pageable.getPageSize());

        Page<PurchaseRequisitionResponseDTO> response = requisitionService.searchRequisitions(keyword, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Tìm kiếm purchase requisitions thành công", response));
    }

    // ===================== UPDATE =====================
    @PutMapping("/{requisitionId}")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponseDTO>> updateRequisition(
            @PathVariable Integer requisitionId,
            @Valid @RequestBody PurchaseRequisitionRequestDTO requestDTO) {

        log.info("API: Cập nhật purchase requisition ID: {}", requisitionId);

        Integer updatedById = userContextService.getCurrentUserId();
        if (updatedById == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Không thể xác định người dùng hiện tại", null));
        }

        PurchaseRequisitionResponseDTO response = requisitionService.updateRequisition(requisitionId, requestDTO, updatedById);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cập nhật purchase requisition thành công", response));
    }

    // ===================== APPROVE =====================
    @PostMapping("/{requisitionId}/approve")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponseDTO>> approveRequisition(
            @PathVariable Integer requisitionId) {

        log.info("API: Approve purchase requisition ID: {}", requisitionId);

        Integer approverId = userContextService.getCurrentUserId();
        if (approverId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Không thể xác định người dùng hiện tại", null));
        }

        PurchaseRequisitionResponseDTO response = requisitionService.approveRequisition(requisitionId, approverId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Approve purchase requisition thành công", response));
    }

    // ===================== REJECT =====================
    @PostMapping("/{requisitionId}/reject")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponseDTO>> rejectRequisition(
            @PathVariable Integer requisitionId,
            @RequestParam(required = false, defaultValue = "") String reason) {

        log.info("API: Reject purchase requisition ID: {} với lý do: {}", requisitionId, reason);

        Integer approverId = userContextService.getCurrentUserId();
        if (approverId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(false, "Không thể xác định người dùng hiện tại", null));
        }

        PurchaseRequisitionResponseDTO response = requisitionService.rejectRequisition(requisitionId, approverId, reason);
        return ResponseEntity.ok(new ApiResponse<>(true, "Reject purchase requisition thành công", response));
    }

    // ===================== CLOSE =====================
    @PostMapping("/{requisitionId}/close")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponseDTO>> closeRequisition(
            @PathVariable Integer requisitionId) {

        log.info("API: Đóng purchase requisition ID: {}", requisitionId);

        PurchaseRequisitionResponseDTO response = requisitionService.closeRequisition(requisitionId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Đóng purchase requisition thành công", response));
    }

    // ===================== RESTORE =====================
    @PostMapping("/{requisitionId}/restore")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponseDTO>> restoreRequisition(
            @PathVariable Integer requisitionId) {

        log.info("API: Khôi phục purchase requisition ID: {}", requisitionId);

        PurchaseRequisitionResponseDTO response = requisitionService.restoreRequisition(requisitionId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Khôi phục purchase requisition thành công", response));
    }

    // ===================== DELETE =====================
    @DeleteMapping("/{requisitionId}")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponseDTO>> deleteRequisition(
            @PathVariable Integer requisitionId) {

        log.info("API: Xóa purchase requisition ID: {}", requisitionId);

        PurchaseRequisitionResponseDTO response = requisitionService.deleteRequisition(requisitionId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Xóa purchase requisition thành công", response));
    }

    // ===================== GENERATE NUMBER =====================
    @GetMapping("/generate-number")
    public ResponseEntity<ApiResponse<String>> generateRequisitionNumber() {

        log.info("API: Tạo requisition number mới");

        String requisitionNo = requisitionService.generateRequisitionNo();
        return ResponseEntity.ok(new ApiResponse<>(true, "Tạo requisition number thành công", requisitionNo));
    }

    // ===================== CHECK EXIST =====================
    @GetMapping("/exists/{requisitionNo}")
    public ResponseEntity<ApiResponse<Boolean>> checkRequisitionNoExists(@PathVariable String requisitionNo) {

        log.info("API: Kiểm tra requisition number tồn tại: {}", requisitionNo);

        boolean exists = requisitionService.existsByRequisitionNo(requisitionNo);
        return ResponseEntity.ok(new ApiResponse<>(true, "Kiểm tra requisition number thành công", exists));
    }
}

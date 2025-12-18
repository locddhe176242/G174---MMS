package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.GoodsReceiptRequestDTO;
import com.g174.mmssystem.dto.responseDTO.GoodsReceiptResponseDTO;
import com.g174.mmssystem.service.IService.IGoodsReceiptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goods-receipts")
@RequiredArgsConstructor
@Slf4j
public class GoodsReceiptController {

    private final IGoodsReceiptService receiptService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    @LogActivity(
            action = "CREATE_GOODS_RECEIPT",
            activityType = "WAREHOUSE_MANAGEMENT",
            description = "Tạo phiếu nhập kho: #{#result.body.receiptNo}",
            entityId = "#{#result.body.receiptId}"
    )
    public ResponseEntity<GoodsReceiptResponseDTO> createReceipt(
            @Valid @RequestBody GoodsReceiptRequestDTO requestDTO,
            @RequestParam(required = false) Integer createdById) {
        log.info("REST: Creating goods receipt for Inbound Delivery ID: {}, Warehouse ID: {}",
                requestDTO.getInboundDeliveryId(), requestDTO.getWarehouseId());

        // Get current user ID if not provided
        if (createdById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                createdById = 1; // Placeholder - implement based on your auth system
            }
        }

        GoodsReceiptResponseDTO response = receiptService.createReceipt(requestDTO, createdById);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/from-sales-return-inbound/{sriId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    public ResponseEntity<GoodsReceiptResponseDTO> createReceiptFromSalesReturnInboundOrder(
            @PathVariable Integer sriId,
            @Valid @RequestBody GoodsReceiptRequestDTO requestDTO,
            @RequestParam(required = false) Integer createdById) {
        log.info("REST: Creating goods receipt from Sales Return Inbound Order ID: {}, Warehouse ID: {}",
                sriId, requestDTO != null ? requestDTO.getWarehouseId() : "null");
        
        if (requestDTO == null) {
            log.error("Request DTO is null");
            throw new IllegalArgumentException("Request DTO cannot be null");
        }
        
        log.info("REST: Request DTO - receiptNo: {}, sourceType: {}, itemsCount: {}", 
                requestDTO.getReceiptNo(), requestDTO.getSourceType(), 
                requestDTO.getItems() != null ? requestDTO.getItems().size() : 0);
        
        if (requestDTO.getItems() != null) {
            for (int idx = 0; idx < requestDTO.getItems().size(); idx++) {
                var item = requestDTO.getItems().get(idx);
                log.info("REST: Item {} - roiId: {}, productId: {}, receivedQty: {}", 
                        idx, item.getRoiId(), item.getProductId(), item.getReceivedQty());
            }
        }

        // Get current user ID if not provided
        if (createdById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                createdById = 1; // Placeholder - implement based on your auth system
            }
        }

        GoodsReceiptResponseDTO response = receiptService.createReceiptFromSalesReturnInboundOrder(sriId, requestDTO, createdById);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{receiptId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<GoodsReceiptResponseDTO> getReceiptById(@PathVariable Integer receiptId) {
        log.info("REST: Fetching goods receipt ID: {}", receiptId);

        GoodsReceiptResponseDTO response = receiptService.getReceiptById(receiptId);
        return ResponseEntity.ok(response);
    }

    // ===================== GET ALL WITH PAGINATION (REQUIRED) =====================
    // Note: getAllReceipts() without pagination has been removed for ERP safety
    // All list operations must use pagination

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<Page<GoodsReceiptResponseDTO>> getAllReceiptsPaged(Pageable pageable) {
        log.info("REST: Fetching goods receipts with pagination");

        Page<GoodsReceiptResponseDTO> response = receiptService.getAllReceipts(pageable);
        return ResponseEntity.ok(response);
    }

    // ===================== SEARCH WITH PAGINATION (REQUIRED) =====================
    // Note: searchReceipts() without pagination has been removed for ERP safety
    // All search operations must use pagination

    @GetMapping("/search/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<Page<GoodsReceiptResponseDTO>> searchReceiptsPaged(
            @RequestParam String keyword,
            Pageable pageable) {
        log.info("REST: Searching goods receipts with keyword: {} and pagination", keyword);

        Page<GoodsReceiptResponseDTO> response = receiptService.searchReceipts(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/inbound-delivery/{inboundDeliveryId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<List<GoodsReceiptResponseDTO>> getReceiptsByInboundDeliveryId(@PathVariable Integer inboundDeliveryId) {
        log.info("REST: Fetching goods receipts for Inbound Delivery ID: {}", inboundDeliveryId);

        List<GoodsReceiptResponseDTO> response = receiptService.getReceiptsByInboundDeliveryId(inboundDeliveryId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/warehouse/{warehouseId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<List<GoodsReceiptResponseDTO>> getReceiptsByWarehouseId(@PathVariable Integer warehouseId) {
        log.info("REST: Fetching goods receipts for Warehouse ID: {}", warehouseId);

        List<GoodsReceiptResponseDTO> response = receiptService.getReceiptsByWarehouseId(warehouseId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{receiptId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    @LogActivity(
            action = "UPDATE_GOODS_RECEIPT",
            activityType = "WAREHOUSE_MANAGEMENT",
            description = "Cập nhật phiếu nhập kho",
            entityId = "#{#receiptId}"
    )
    public ResponseEntity<GoodsReceiptResponseDTO> updateReceipt(
            @PathVariable Integer receiptId,
            @Valid @RequestBody GoodsReceiptRequestDTO requestDTO,
            @RequestParam(required = false) Integer updatedById) {
        log.info("REST: Updating goods receipt ID: {}", receiptId);

        // Get current user ID if not provided
        if (updatedById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                updatedById = 1; // Placeholder
            }
        }

        GoodsReceiptResponseDTO response = receiptService.updateReceipt(receiptId, requestDTO, updatedById);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{receiptId}/approve")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "APPROVE_GOODS_RECEIPT",
            activityType = "WAREHOUSE_MANAGEMENT",
            description = "Duyệt phiếu nhập kho",
            entityId = "#{#receiptId}"
    )
    public ResponseEntity<GoodsReceiptResponseDTO> approveReceipt(
            @PathVariable Integer receiptId,
            @RequestParam Integer approverId) {
        log.info("REST: Approving goods receipt ID: {} by approver ID: {}", receiptId, approverId);

        GoodsReceiptResponseDTO response = receiptService.approveReceipt(receiptId, approverId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{receiptId}/reject")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "REJECT_GOODS_RECEIPT",
            activityType = "WAREHOUSE_MANAGEMENT",
            description = "Từ chối phiếu nhập kho",
            entityId = "#{#receiptId}"
    )
    public ResponseEntity<GoodsReceiptResponseDTO> rejectReceipt(
            @PathVariable Integer receiptId,
            @RequestParam Integer approverId,
            @RequestParam(required = false) String reason) {
        log.info("REST: Rejecting goods receipt ID: {} by approver ID: {}", receiptId, approverId);

        GoodsReceiptResponseDTO response = receiptService.rejectReceipt(receiptId, approverId, reason);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{receiptId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    @LogActivity(
            action = "DELETE_GOODS_RECEIPT",
            activityType = "WAREHOUSE_MANAGEMENT",
            description = "Xóa phiếu nhập kho",
            entityId = "#{#receiptId}"
    )
    public ResponseEntity<GoodsReceiptResponseDTO> deleteReceipt(@PathVariable Integer receiptId) {
        log.info("REST: Deleting goods receipt ID: {}", receiptId);

        GoodsReceiptResponseDTO response = receiptService.deleteReceipt(receiptId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/generate-number")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<java.util.Map<String, String>> generateReceiptNo() {
        log.info("REST: Generating Receipt number");

        String receiptNo = receiptService.generateReceiptNo();
        return ResponseEntity.ok(java.util.Map.of("receiptNo", receiptNo, "receipt_no", receiptNo));
    }
}


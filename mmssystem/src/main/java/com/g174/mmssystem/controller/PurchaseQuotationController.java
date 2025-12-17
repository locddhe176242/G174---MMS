package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.PurchaseQuotationRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseQuotationResponseDTO;
import com.g174.mmssystem.service.IService.IPurchaseQuotationService;
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
@RequestMapping("/api/purchase-quotations")
@RequiredArgsConstructor
@Slf4j
public class PurchaseQuotationController {

    private final IPurchaseQuotationService quotationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<PurchaseQuotationResponseDTO> createQuotation(
            @Valid @RequestBody PurchaseQuotationRequestDTO requestDTO,
            @RequestParam(required = false) Integer createdById) {
        log.info("REST: Creating purchase quotation for RFQ ID: {}, Vendor ID: {}",
                requestDTO.getRfqId(), requestDTO.getVendorId());

        // Get current user ID if not provided
        if (createdById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                // Extract user ID from authentication - adjust based on your implementation
                createdById = 1; // Placeholder - implement based on your auth system
            }
        }

        PurchaseQuotationResponseDTO response = quotationService.createQuotation(requestDTO, createdById);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{pqId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<PurchaseQuotationResponseDTO> getQuotationById(@PathVariable Integer pqId) {
        log.info("REST: Fetching purchase quotation ID: {}", pqId);

        PurchaseQuotationResponseDTO response = quotationService.getQuotationById(pqId);
        return ResponseEntity.ok(response);
    }

    // ===================== GET ALL WITH PAGINATION (REQUIRED) =====================
    // Note: getAllQuotations() without pagination has been removed for ERP safety
    // All list operations must use pagination

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Page<PurchaseQuotationResponseDTO>> getAllQuotationsPaged(Pageable pageable) {
        log.info("REST: Fetching purchase quotations with pagination");

        Page<PurchaseQuotationResponseDTO> response = quotationService.getAllQuotations(pageable);
        return ResponseEntity.ok(response);
    }

    // ===================== SEARCH WITH PAGINATION (REQUIRED) =====================
    // Note: searchQuotations() without pagination has been removed for ERP safety
    // All search operations must use pagination

    @GetMapping("/search/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Page<PurchaseQuotationResponseDTO>> searchQuotationsPaged(
            @RequestParam String keyword,
            Pageable pageable) {
        log.info("REST: Searching purchase quotations with keyword: {} and pagination", keyword);

        Page<PurchaseQuotationResponseDTO> response = quotationService.searchQuotations(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rfq/{rfqId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<List<PurchaseQuotationResponseDTO>> getQuotationsByRfqId(@PathVariable Integer rfqId) {
        log.info("REST: Fetching purchase quotations for RFQ ID: {}", rfqId);

        List<PurchaseQuotationResponseDTO> response = quotationService.getQuotationsByRfqId(rfqId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vendor/{vendorId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<List<PurchaseQuotationResponseDTO>> getQuotationsByVendorId(@PathVariable Integer vendorId) {
        log.info("REST: Fetching purchase quotations for Vendor ID: {}", vendorId);

        List<PurchaseQuotationResponseDTO> response = quotationService.getQuotationsByVendorId(vendorId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{pqId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(
            action = "UPDATE_PURCHASE_QUOTATION",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Cập nhật báo giá mua hàng",
            entityId = "#{#pqId}"
    )
    public ResponseEntity<PurchaseQuotationResponseDTO> updateQuotation(
            @PathVariable Integer pqId,
            @Valid @RequestBody PurchaseQuotationRequestDTO requestDTO,
            @RequestParam(required = false) Integer updatedById) {
        log.info("REST: Updating purchase quotation ID: {}", pqId);

        // Get current user ID if not provided
        if (updatedById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                updatedById = 1; // Placeholder
            }
        }

        PurchaseQuotationResponseDTO response = quotationService.updateQuotation(pqId, requestDTO, updatedById);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{pqId}/approve")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(
            action = "APPROVE_PURCHASE_QUOTATION",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Duyệt báo giá mua hàng",
            entityId = "#{#pqId}"
    )
    public ResponseEntity<PurchaseQuotationResponseDTO> approveQuotation(
            @PathVariable Integer pqId,
            @RequestParam Integer approverId) {
        log.info("REST: Approving purchase quotation ID: {} by approver ID: {}", pqId, approverId);

        PurchaseQuotationResponseDTO response = quotationService.approveQuotation(pqId, approverId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{pqId}/reject")
    @PreAuthorize("hasAuthority('ROLE_MANAGER')")
    @LogActivity(
            action = "REJECT_PURCHASE_QUOTATION",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Từ chối báo giá mua hàng",
            entityId = "#{#pqId}"
    )
    public ResponseEntity<PurchaseQuotationResponseDTO> rejectQuotation(
            @PathVariable Integer pqId,
            @RequestParam Integer approverId,
            @RequestParam(required = false) String reason) {
        log.info("REST: Rejecting purchase quotation ID: {} by approver ID: {}", pqId, approverId);

        PurchaseQuotationResponseDTO response = quotationService.rejectQuotation(pqId, approverId, reason);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{pqId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    @LogActivity(
            action = "DELETE_PURCHASE_QUOTATION",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Xóa báo giá mua hàng",
            entityId = "#{#pqId}"
    )
    public ResponseEntity<PurchaseQuotationResponseDTO> deleteQuotation(@PathVariable Integer pqId) {
        log.info("REST: Deleting purchase quotation ID: {}", pqId);

        PurchaseQuotationResponseDTO response = quotationService.deleteQuotation(pqId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/generate-number")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<String> generatePqNo() {
        log.info("REST: Generating PQ number");

        String pqNo = quotationService.generatePqNo();
        return ResponseEntity.ok(pqNo);
    }
}


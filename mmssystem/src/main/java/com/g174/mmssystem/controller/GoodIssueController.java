package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.GoodIssueRequestDTO;
import com.g174.mmssystem.dto.responseDTO.GoodIssueResponseDTO;
import com.g174.mmssystem.service.IService.IGoodIssueService;
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
@RequestMapping("/api/good-issues")
@RequiredArgsConstructor
@Slf4j
public class GoodIssueController {

    private final IGoodIssueService issueService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(action = "CREATE_GOOD_ISSUE", activityType = "WAREHOUSE_MANAGEMENT", description = "Tạo phiếu xuất kho: #{#result.body.issueNo}", entityId = "#{#result.body.issueId}")
    public ResponseEntity<GoodIssueResponseDTO> createIssue(
            @Valid @RequestBody GoodIssueRequestDTO requestDTO,
            @RequestParam(required = false) Integer createdById) {
        log.info("REST: Creating good issue for Delivery ID: {}, Warehouse ID: {}",
                requestDTO.getDeliveryId(), requestDTO.getWarehouseId());

        // Get current user ID if not provided
        if (createdById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null
                    && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                createdById = 1; // Placeholder - implement based on your auth system
            }
        }

        GoodIssueResponseDTO response = issueService.createIssue(requestDTO, createdById);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/from-delivery/{deliveryId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(action = "CREATE_GOOD_ISSUE_FROM_DELIVERY", activityType = "WAREHOUSE_MANAGEMENT", description = "Tạo phiếu xuất kho từ Delivery ID: #{#deliveryId}, Issue No: #{#result.body.issueNo}", entityId = "#{#result.body.issueId}")
    public ResponseEntity<GoodIssueResponseDTO> createIssueFromDelivery(
            @PathVariable Integer deliveryId,
            @Valid @RequestBody GoodIssueRequestDTO requestDTO,
            @RequestParam(required = false) Integer createdById) {
        log.info("REST: Creating good issue from Delivery ID: {}", deliveryId);

        // Get current user ID if not provided
        if (createdById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null
                    && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                createdById = 1; // Placeholder
            }
        }

        GoodIssueResponseDTO response = issueService.createIssueFromDelivery(deliveryId, requestDTO, createdById);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{issueId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<GoodIssueResponseDTO> getIssueById(@PathVariable Integer issueId) {
        log.info("REST: Fetching good issue ID: {}", issueId);

        GoodIssueResponseDTO response = issueService.getIssueById(issueId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<Page<GoodIssueResponseDTO>> getAllIssuesPaged(Pageable pageable) {
        log.info("REST: Fetching good issues with pagination");

        Page<GoodIssueResponseDTO> response = issueService.getAllIssues(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search/page")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<Page<GoodIssueResponseDTO>> searchIssuesPaged(
            @RequestParam String keyword,
            Pageable pageable) {
        log.info("REST: Searching good issues with keyword: {} and pagination", keyword);

        Page<GoodIssueResponseDTO> response = issueService.searchIssues(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/delivery/{deliveryId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','SALE','ACCOUNTING')")
    public ResponseEntity<List<GoodIssueResponseDTO>> getIssuesByDeliveryId(@PathVariable Integer deliveryId) {
        log.info("REST: Fetching good issues for Delivery ID: {}", deliveryId);

        List<GoodIssueResponseDTO> response = issueService.getIssuesByDeliveryId(deliveryId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/warehouse/{warehouseId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<List<GoodIssueResponseDTO>> getIssuesByWarehouseId(@PathVariable Integer warehouseId) {
        log.info("REST: Fetching good issues for Warehouse ID: {}", warehouseId);

        List<GoodIssueResponseDTO> response = issueService.getIssuesByWarehouseId(warehouseId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{issueId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "UPDATE_GOOD_ISSUE",
            activityType = "WAREHOUSE_MANAGEMENT",
            description = "Cập nhật phiếu xuất kho",
            entityId = "#{#issueId}"
    )
    public ResponseEntity<GoodIssueResponseDTO> updateIssue(
            @PathVariable Integer issueId,
            @Valid @RequestBody GoodIssueRequestDTO requestDTO,
            @RequestParam(required = false) Integer updatedById) {
        log.info("REST: Updating good issue ID: {}", issueId);

        // Get current user ID if not provided
        if (updatedById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null
                    && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                updatedById = 1; // Placeholder
            }
        }

        GoodIssueResponseDTO response = issueService.updateIssue(issueId, requestDTO, updatedById);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{issueId}/submit-for-approval")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(action = "COMPLETE_GOOD_ISSUE", activityType = "WAREHOUSE_MANAGEMENT", description = "Hoàn tất phiếu xuất kho ID: #{#issueId}", entityId = "#{#issueId}")
    public ResponseEntity<GoodIssueResponseDTO> submitForApproval(
            @PathVariable Integer issueId,
            @RequestParam(required = false) Integer submittedById) {
        log.info("REST: Completing good issue ID: {}", issueId);

        // Get current user ID if not provided
        if (submittedById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null
                    && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                submittedById = 1; // Placeholder
            }
        }

        GoodIssueResponseDTO response = issueService.submitForApproval(issueId, submittedById);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{issueId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(action = "DELETE_GOOD_ISSUE", activityType = "WAREHOUSE_MANAGEMENT", description = "Xóa phiếu xuất kho ID: #{#issueId}", entityId = "#{#issueId}")
    public ResponseEntity<GoodIssueResponseDTO> deleteIssue(@PathVariable Integer issueId) {
        log.info("REST: Deleting good issue ID: {}", issueId);

        GoodIssueResponseDTO response = issueService.deleteIssue(issueId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/generate-number")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    public ResponseEntity<java.util.Map<String, String>> generateIssueNo() {
        log.info("REST: Generating Issue number");

        String issueNo = issueService.generateIssueNo();
        return ResponseEntity.ok(java.util.Map.of("issueNo", issueNo, "issue_no", issueNo));
    }
}
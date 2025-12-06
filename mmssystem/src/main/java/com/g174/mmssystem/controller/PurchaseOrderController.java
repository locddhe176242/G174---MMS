package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.PurchaseOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseOrderResponseDTO;
import com.g174.mmssystem.service.IService.IPurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderController {

    private final IPurchaseOrderService orderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<PurchaseOrderResponseDTO> createOrder(
            @Valid @RequestBody PurchaseOrderRequestDTO requestDTO,
            @RequestParam(required = false) Integer createdById) {
        log.info("REST: Creating purchase order for Vendor ID: {}", requestDTO.getVendorId());

        // Get current user ID if not provided
        if (createdById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                createdById = 1; // Placeholder - implement based on your auth system
            }
        }

        PurchaseOrderResponseDTO response = orderService.createOrder(requestDTO, createdById);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<PurchaseOrderResponseDTO> getOrderById(@PathVariable Integer orderId) {
        log.info("REST: Fetching purchase order ID: {}", orderId);

        PurchaseOrderResponseDTO response = orderService.getOrderById(orderId);
        return ResponseEntity.ok(response);
    }

    // ===================== GET ALL WITH PAGINATION (REQUIRED) =====================
    // Note: getAllOrders() without pagination has been removed for ERP safety
    // All list operations must use pagination

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Page<PurchaseOrderResponseDTO>> getAllOrdersPaged(Pageable pageable) {
        log.info("REST: Fetching purchase orders with pagination");

        Page<PurchaseOrderResponseDTO> response = orderService.getAllOrders(pageable);
        return ResponseEntity.ok(response);
    }

    // ===================== SEARCH WITH PAGINATION (REQUIRED) =====================
    // Note: searchOrders() without pagination has been removed for ERP safety
    // All search operations must use pagination

    @GetMapping("/search/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Page<PurchaseOrderResponseDTO>> searchOrdersPaged(
            @RequestParam String keyword,
            Pageable pageable) {
        log.info("REST: Searching purchase orders with keyword: {} and pagination", keyword);

        Page<PurchaseOrderResponseDTO> response = orderService.searchOrders(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vendor/{vendorId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<List<PurchaseOrderResponseDTO>> getOrdersByVendorId(@PathVariable Integer vendorId) {
        log.info("REST: Fetching purchase orders for Vendor ID: {}", vendorId);

        List<PurchaseOrderResponseDTO> response = orderService.getOrdersByVendorId(vendorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pq/{pqId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<List<PurchaseOrderResponseDTO>> getOrdersByPqId(@PathVariable Integer pqId) {
        log.info("REST: Fetching purchase orders for Purchase Quotation ID: {}", pqId);

        List<PurchaseOrderResponseDTO> response = orderService.getOrdersByPqId(pqId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<PurchaseOrderResponseDTO> updateOrder(
            @PathVariable Integer orderId,
            @Valid @RequestBody PurchaseOrderRequestDTO requestDTO,
            @RequestParam(required = false) Integer updatedById) {
        log.info("REST: Updating purchase order ID: {}", orderId);

        // Get current user ID if not provided
        if (updatedById == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                updatedById = 1; // Placeholder
            }
        }

        PurchaseOrderResponseDTO response = orderService.updateOrder(orderId, requestDTO, updatedById);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/approve")
    @PreAuthorize("hasAnyRole('MANAGER')")
    public ResponseEntity<PurchaseOrderResponseDTO> approveOrder(
            @PathVariable Integer orderId,
            @RequestParam Integer approverId) {
        log.info("REST: Approving purchase order ID: {} by approver ID: {}", orderId, approverId);

        PurchaseOrderResponseDTO response = orderService.approveOrder(orderId, approverId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/reject")
    @PreAuthorize("hasAnyRole('MANAGER')")
    public ResponseEntity<PurchaseOrderResponseDTO> rejectOrder(
            @PathVariable Integer orderId,
            @RequestParam Integer approverId,
            @RequestParam(required = false) String reason) {
        log.info("REST: Rejecting purchase order ID: {} by approver ID: {}", orderId, approverId);

        PurchaseOrderResponseDTO response = orderService.rejectOrder(orderId, approverId, reason);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/send")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<PurchaseOrderResponseDTO> sendOrder(@PathVariable Integer orderId) {
        log.info("REST: Sending purchase order ID: {}", orderId);

        PurchaseOrderResponseDTO response = orderService.sendOrder(orderId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/complete")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<PurchaseOrderResponseDTO> completeOrder(@PathVariable Integer orderId) {
        log.info("REST: Completing purchase order ID: {}", orderId);

        PurchaseOrderResponseDTO response = orderService.completeOrder(orderId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/cancel")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<PurchaseOrderResponseDTO> cancelOrder(@PathVariable Integer orderId) {
        log.info("REST: Cancelling purchase order ID: {}", orderId);

        PurchaseOrderResponseDTO response = orderService.cancelOrder(orderId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<PurchaseOrderResponseDTO> deleteOrder(@PathVariable Integer orderId) {
        log.info("REST: Deleting purchase order ID: {}", orderId);

        PurchaseOrderResponseDTO response = orderService.deleteOrder(orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orderId}/items")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    public ResponseEntity<List<com.g174.mmssystem.dto.responseDTO.PurchaseOrderItemResponseDTO>> getOrderItems(@PathVariable Integer orderId) {
        log.info("REST: Fetching items for purchase order ID: {}", orderId);

        PurchaseOrderResponseDTO order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order.getItems());
    }
    @GetMapping("/generate-number")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<String> generatePoNo() {
        log.info("REST: Generating PO number");

        String poNo = orderService.generatePoNo();
        return ResponseEntity.ok(poNo);
    }
}   



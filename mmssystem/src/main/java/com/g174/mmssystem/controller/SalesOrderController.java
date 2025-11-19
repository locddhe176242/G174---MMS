package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.SalesOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderResponseDTO;
import com.g174.mmssystem.service.IService.ISalesOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sales/orders")
@RequiredArgsConstructor
public class SalesOrderController {

    private final ISalesOrderService salesOrderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<Page<SalesOrderListResponseDTO>> listOrders(
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "orderDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = Sort.by(sortBy);
        sort = "desc".equalsIgnoreCase(sortDir) ? sort.descending() : sort.ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SalesOrderListResponseDTO> result =
                salesOrderService.getOrders(customerId, status, approvalStatus, keyword, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<SalesOrderResponseDTO> getOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(salesOrderService.getOrder(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<SalesOrderResponseDTO> createOrder(
            @Valid @RequestBody SalesOrderRequestDTO request) {
        return ResponseEntity.ok(salesOrderService.createOrder(request));
    }

    @PostMapping("/convert/{quotationId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<SalesOrderResponseDTO> createFromQuotation(@PathVariable Integer quotationId) {
        return ResponseEntity.ok(salesOrderService.createFromQuotation(quotationId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<SalesOrderResponseDTO> updateOrder(
            @PathVariable Integer id,
            @Valid @RequestBody SalesOrderRequestDTO request) {
        return ResponseEntity.ok(salesOrderService.updateOrder(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<SalesOrderResponseDTO> changeStatus(
            @PathVariable Integer id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String approvalStatus) {
        return ResponseEntity.ok(salesOrderService.changeStatus(id, status, approvalStatus));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteOrder(@PathVariable Integer id) {
        salesOrderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}


package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.DeliveryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.DeliveryListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.DeliveryResponseDTO;
import com.g174.mmssystem.service.IService.IDeliveryService;
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
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final IDeliveryService deliveryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<Page<DeliveryListResponseDTO>> listDeliveries(
            @RequestParam(required = false) Integer salesOrderId,
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = Sort.by(sortBy);
        sort = "desc".equalsIgnoreCase(sortDir) ? sort.descending() : sort.ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<DeliveryListResponseDTO> result =
                deliveryService.getDeliveries(salesOrderId, customerId, status, keyword, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<DeliveryResponseDTO> getDelivery(@PathVariable Integer id) {
        return ResponseEntity.ok(deliveryService.getDelivery(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<DeliveryResponseDTO> createDelivery(
            @Valid @RequestBody DeliveryRequestDTO request) {
        return ResponseEntity.ok(deliveryService.createDelivery(request));
    }

    @PostMapping("/convert/{salesOrderId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<DeliveryResponseDTO> createFromSalesOrder(@PathVariable Integer salesOrderId) {
        return ResponseEntity.ok(deliveryService.createFromSalesOrder(salesOrderId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<DeliveryResponseDTO> updateDelivery(
            @PathVariable Integer id,
            @Valid @RequestBody DeliveryRequestDTO request) {
        return ResponseEntity.ok(deliveryService.updateDelivery(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<DeliveryResponseDTO> changeStatus(
            @PathVariable Integer id,
            @RequestParam String status) {
        return ResponseEntity.ok(deliveryService.changeStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteDelivery(@PathVariable Integer id) {
        deliveryService.deleteDelivery(id);
        return ResponseEntity.noContent().build();
    }
}


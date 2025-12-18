package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
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

import java.util.List;

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

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<List<DeliveryListResponseDTO>> getAllDeliveries(
            @RequestParam(required = false) Integer salesOrderId,
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(deliveryService.getAllDeliveries(salesOrderId, customerId, status, keyword));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<DeliveryResponseDTO> getDelivery(@PathVariable Integer id) {
        return ResponseEntity.ok(deliveryService.getDelivery(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    @LogActivity(
            action = "CREATE_DELIVERY",
            activityType = "SALES_MANAGEMENT",
            description = "Tạo phiếu giao hàng mới cho đơn hàng ID: #{#request.salesOrderId}",
            entityId = "#{#result.body.deliveryId}"
    )
    public ResponseEntity<DeliveryResponseDTO> createDelivery(
            @Valid @RequestBody DeliveryRequestDTO request) {
        return ResponseEntity.ok(deliveryService.createDelivery(request));
    }

    @PostMapping("/convert/{salesOrderId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    @LogActivity(
            action = "CREATE_DELIVERY_FROM_SALES_ORDER",
            activityType = "SALES_MANAGEMENT",
            description = "Tạo phiếu giao hàng từ đơn bán hàng ID: #{#salesOrderId}",
            entityId = "#{#result.body.deliveryId}"
    )
    public ResponseEntity<DeliveryResponseDTO> createFromSalesOrder(@PathVariable Integer salesOrderId) {
        return ResponseEntity.ok(deliveryService.createFromSalesOrder(salesOrderId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    @LogActivity(
            action = "UPDATE_DELIVERY",
            activityType = "SALES_MANAGEMENT",
            description = "Cập nhật phiếu giao hàng",
            entityId = "#{#id}"
    )
    public ResponseEntity<DeliveryResponseDTO> updateDelivery(
            @PathVariable Integer id,
            @Valid @RequestBody DeliveryRequestDTO request) {
        return ResponseEntity.ok(deliveryService.updateDelivery(id, request));
    }

    @PostMapping("/{id}/submit-to-warehouse")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    @LogActivity(
            action = "SUBMIT_DELIVERY_TO_WAREHOUSE",
            activityType = "SALES_MANAGEMENT",
            description = "Submit phiếu giao hàng cho kho xử lý",
            entityId = "#{#id}"
    )
    public ResponseEntity<DeliveryResponseDTO> submitToWarehouse(@PathVariable Integer id) {
        return ResponseEntity.ok(deliveryService.submitToWarehouse(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    @LogActivity(
            action = "CHANGE_DELIVERY_STATUS",
            activityType = "SALES_MANAGEMENT",
            description = "Đổi trạng thái giao hàng sang #{#status}",
            entityId = "#{#id}"
    )
    public ResponseEntity<DeliveryResponseDTO> changeStatus(
            @PathVariable Integer id,
            @RequestParam String status) {
        return ResponseEntity.ok(deliveryService.changeStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "DELETE_DELIVERY",
            activityType = "SALES_MANAGEMENT",
            description = "Xóa phiếu giao hàng",
            entityId = "#{#id}"
    )
    public ResponseEntity<Void> deleteDelivery(@PathVariable Integer id) {
        deliveryService.deleteDelivery(id);
        return ResponseEntity.noContent().build();
    }
}

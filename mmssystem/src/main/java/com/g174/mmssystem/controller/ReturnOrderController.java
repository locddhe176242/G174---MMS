package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.ReturnOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ReturnOrderListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ReturnOrderResponseDTO;
import com.g174.mmssystem.service.IService.IReturnOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/return-orders")
@RequiredArgsConstructor
public class ReturnOrderController {

    private final IReturnOrderService returnOrderService;

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<List<ReturnOrderListResponseDTO>> getAllReturnOrders(
            @RequestParam(required = false) Integer deliveryId,
            @RequestParam(required = false) Integer invoiceId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(returnOrderService.getAllReturnOrders(deliveryId, invoiceId, status, keyword));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<ReturnOrderResponseDTO> getReturnOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(returnOrderService.getReturnOrder(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    @LogActivity(action = "CREATE_RETURN_ORDER", activityType = "SALES_MANAGEMENT", 
            description = "Tạo đơn trả hàng từ giao hàng ID: #{#request.deliveryId}",
            entityId = "#{#result.body.returnOrderId}")
    public ResponseEntity<ReturnOrderResponseDTO> createReturnOrder(
            @Valid @RequestBody ReturnOrderRequestDTO request) {
        return ResponseEntity.ok(returnOrderService.createReturnOrder(request));
    }

    @PostMapping("/convert/{deliveryId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    @LogActivity(action = "CREATE_RETURN_ORDER_FROM_DELIVERY", activityType = "SALES_MANAGEMENT", 
            description = "Tạo đơn trả hàng từ Delivery ID: #{#deliveryId}",
            entityId = "#{#result.body.returnOrderId}")
    public ResponseEntity<ReturnOrderResponseDTO> createFromDelivery(@PathVariable Integer deliveryId) {
        return ResponseEntity.ok(returnOrderService.createFromDelivery(deliveryId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    @LogActivity(action = "UPDATE_RETURN_ORDER", activityType = "SALES_MANAGEMENT", 
            description = "Cập nhật đơn trả hàng ID: #{#id}",
            entityId = "#{#id}")
    public ResponseEntity<ReturnOrderResponseDTO> updateReturnOrder(
            @PathVariable Integer id,
            @Valid @RequestBody ReturnOrderRequestDTO request) {
        return ResponseEntity.ok(returnOrderService.updateReturnOrder(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    @LogActivity(action = "CHANGE_RETURN_ORDER_STATUS", activityType = "SALES_MANAGEMENT", 
            description = "Thay đổi trạng thái đơn trả hàng ID: #{#id} sang #{#status}",
            entityId = "#{#id}")
    public ResponseEntity<ReturnOrderResponseDTO> changeStatus(
            @PathVariable Integer id,
            @RequestParam String status) {
        return ResponseEntity.ok(returnOrderService.changeStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(action = "DELETE_RETURN_ORDER", activityType = "SALES_MANAGEMENT", 
            description = "Xóa đơn trả hàng ID: #{#id}",
            entityId = "#{#id}")
    public ResponseEntity<Void> deleteReturnOrder(@PathVariable Integer id) {
        returnOrderService.deleteReturnOrder(id);
        return ResponseEntity.noContent().build();
    }
}


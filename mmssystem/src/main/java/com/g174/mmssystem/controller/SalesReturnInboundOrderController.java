package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.SalesReturnInboundOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesReturnInboundOrderResponseDTO;
import com.g174.mmssystem.service.IService.ISalesReturnInboundOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales-return-inbound-orders")
@RequiredArgsConstructor
public class SalesReturnInboundOrderController {

    private final ISalesReturnInboundOrderService inboundOrderService;

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<List<SalesReturnInboundOrderResponseDTO>> getAll() {
        return ResponseEntity.ok(inboundOrderService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<SalesReturnInboundOrderResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(inboundOrderService.getById(id));
    }

    @GetMapping("/by-return-order/{roId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<List<SalesReturnInboundOrderResponseDTO>> getByReturnOrder(@PathVariable Integer roId) {
        return ResponseEntity.ok(inboundOrderService.getByReturnOrder(roId));
    }

    @PostMapping("/from-return-order")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    @LogActivity(action = "CREATE_SRI_FROM_RETURN_ORDER",
                 activityType = "SALES_MANAGEMENT",
                 description = "Tạo Đơn nhập hàng lại từ Đơn trả hàng",
                 entityId = "#{#result.body.sriId}"
    )

    public ResponseEntity<SalesReturnInboundOrderResponseDTO> createFromReturnOrder(
            @Valid @RequestBody SalesReturnInboundOrderRequestDTO request) {
        return ResponseEntity.ok(inboundOrderService.createFromReturnOrder(request));
    }
}



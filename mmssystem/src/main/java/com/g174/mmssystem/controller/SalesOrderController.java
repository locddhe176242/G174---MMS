package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
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

import java.util.List;

@RestController
@RequestMapping({ "/api/sales/orders", "/sales/orders" })
@RequiredArgsConstructor
public class SalesOrderController {

    private final ISalesOrderService salesOrderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<Page<SalesOrderListResponseDTO>> listOrders(
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "orderDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = Sort.by(sortBy);
        sort = "desc".equalsIgnoreCase(sortDir) ? sort.descending() : sort.ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SalesOrderListResponseDTO> result = salesOrderService.getOrders(customerId, status, keyword, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<List<SalesOrderListResponseDTO>> getAllOrders(
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(salesOrderService.getAllOrders(customerId, status, keyword));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','WAREHOUSE')")
    public ResponseEntity<SalesOrderResponseDTO> getOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(salesOrderService.getOrder(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    @LogActivity(action = "CREATE_SALES_ORDER", activityType = "SALES_MANAGEMENT", description = "Tạo đơn bán hàng mới cho khách hàng ID: #{#request.customerId}", entityId = "#{#result.body.orderId}")
    public ResponseEntity<SalesOrderResponseDTO> createOrder(
            @Valid @RequestBody SalesOrderRequestDTO request) {
        return ResponseEntity.ok(salesOrderService.createOrder(request));
    }

    @PostMapping("/convert/{quotationId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    @LogActivity(action = "CREATE_SALES_ORDER_FROM_QUOTATION", activityType = "SALES_MANAGEMENT", description = "Tạo đơn bán hàng từ báo giá ID: #{#quotationId}", entityId = "#{#result.body.orderId}")
    public ResponseEntity<SalesOrderResponseDTO> createFromQuotation(@PathVariable Integer quotationId) {
        return ResponseEntity.ok(salesOrderService.createFromQuotation(quotationId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    @LogActivity(
            action = "UPDATE_SALES_ORDER",
            activityType = "SALES_MANAGEMENT",
            description = "Cập nhật đơn bán hàng",
            entityId = "#{#id}"
    )
    public ResponseEntity<SalesOrderResponseDTO> updateOrder(
            @PathVariable Integer id,
            @Valid @RequestBody SalesOrderRequestDTO request) {
        return ResponseEntity.ok(salesOrderService.updateOrder(id, request));
    }

    @PostMapping("/{id}/send-to-customer")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    @LogActivity(action = "SEND_SALES_ORDER_TO_CUSTOMER", activityType = "SALES_MANAGEMENT", description = "Gửi đơn bán hàng ID: #{#id} cho khách hàng", entityId = "#{#id}")
    public ResponseEntity<SalesOrderResponseDTO> sendToCustomer(@PathVariable Integer id) {
        return ResponseEntity.ok(salesOrderService.sendToCustomer(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    @LogActivity(action = "DELETE_SALES_ORDER", activityType = "SALES_MANAGEMENT", description = "Xóa đơn bán hàng ID: #{#id}", entityId = "#{#id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Integer id) {
        salesOrderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}
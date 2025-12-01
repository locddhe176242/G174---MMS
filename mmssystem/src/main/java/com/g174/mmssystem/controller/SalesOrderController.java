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

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<List<SalesOrderListResponseDTO>> getAllOrders(
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(salesOrderService.getAllOrders(customerId, status, approvalStatus, keyword));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<SalesOrderResponseDTO> getOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(salesOrderService.getOrder(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    @LogActivity(
            action = "CREATE_SALES_ORDER",
            activityType = "SALES_MANAGEMENT",
            description = "Tạo đơn bán hàng mới cho khách hàng ID: #{#request.customerId}",
            entityId = "#{#result.body.orderId}"
    )
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
    @LogActivity(
            action = "UPDATE_SALES_ORDER",
            activityType = "SALES_MANAGEMENT",
            description = "Cập nhật đơn bán hàng ID: #{#id}",
            entityId = "#{#id}"
    )
    public ResponseEntity<SalesOrderResponseDTO> updateOrder(
            @PathVariable Integer id,
            @Valid @RequestBody SalesOrderRequestDTO request) {
        return ResponseEntity.ok(salesOrderService.updateOrder(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    @LogActivity(
            action = "CHANGE_SALES_ORDER_STATUS",
            activityType = "SALES_MANAGEMENT",
            description = "Đổi trạng thái đơn bán hàng ID: #{#id} - Status: #{#status}, ApprovalStatus: #{#approvalStatus}",
            entityId = "#{#id}"
    )
    public ResponseEntity<SalesOrderResponseDTO> changeStatus(
            @PathVariable Integer id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String approvalStatus) {
        return ResponseEntity.ok(salesOrderService.changeStatus(id, status, approvalStatus));
    }

    @PatchMapping("/{id}/approval-status")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "CHANGE_SALES_ORDER_APPROVAL_STATUS",
            activityType = "SALES_MANAGEMENT",
            description = "Đổi trạng thái phê duyệt đơn bán hàng ID: #{#id} sang #{#approvalStatus}",
            entityId = "#{#id}"
    )
    public ResponseEntity<SalesOrderResponseDTO> changeApprovalStatus(
            @PathVariable Integer id,
            @RequestParam String approvalStatus) {
        return ResponseEntity.ok(salesOrderService.changeApprovalStatus(id, approvalStatus));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "DELETE_SALES_ORDER",
            activityType = "SALES_MANAGEMENT",
            description = "Xóa đơn bán hàng ID: #{#id}",
            entityId = "#{#id}"
    )
    public ResponseEntity<Void> deleteOrder(@PathVariable Integer id) {
        salesOrderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}

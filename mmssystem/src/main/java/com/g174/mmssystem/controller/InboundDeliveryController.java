package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.InboundDeliveryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.InboundDeliveryListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.InboundDeliveryResponseDTO;
import com.g174.mmssystem.service.IService.IInboundDeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inbound-deliveries")
@RequiredArgsConstructor
@Slf4j
public class InboundDeliveryController {

    private final IInboundDeliveryService inboundDeliveryService;

    @GetMapping("/generate-number")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    public ResponseEntity<String> generateInboundDeliveryNumber() {
        log.info("REST: Generating unique Inbound Delivery number");
        
        String generatedNumber = inboundDeliveryService.generateUniqueInboundDeliveryNo();
        return ResponseEntity.ok(generatedNumber);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    @LogActivity(
            action = "CREATE_INBOUND_DELIVERY",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Tạo đơn nhận hàng: #{#result.body.inboundDeliveryNo}",
            entityId = "#{#result.body.inboundDeliveryId}"
    )
    public ResponseEntity<InboundDeliveryResponseDTO> createInboundDelivery(
            @Valid @RequestBody InboundDeliveryRequestDTO requestDTO) {
        log.info("REST: Creating Inbound Delivery for Order ID: {}, Warehouse ID: {}",
                requestDTO.getOrderId(), requestDTO.getWarehouseId());

        InboundDeliveryResponseDTO response = inboundDeliveryService.createInboundDelivery(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/convert/{orderId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    @LogActivity(
            action = "CREATE_INBOUND_DELIVERY_FROM_PO",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Tạo đơn nhận hàng từ Purchase Order ID: #{#orderId}",
            entityId = "#{#result.body.inboundDeliveryId}"
    )
    public ResponseEntity<InboundDeliveryResponseDTO> createFromPurchaseOrder(@PathVariable Integer orderId) {
        log.info("REST: Creating Inbound Delivery from Purchase Order ID: {}", orderId);

        InboundDeliveryResponseDTO response = inboundDeliveryService.createFromPurchaseOrder(orderId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<InboundDeliveryResponseDTO> getInboundDeliveryById(@PathVariable Integer id) {
        log.info("REST: Fetching Inbound Delivery ID: {}", id);

        InboundDeliveryResponseDTO response = inboundDeliveryService.getInboundDeliveryById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<Page<InboundDeliveryListResponseDTO>> getAllInboundDeliveries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = Sort.by(sortBy);
        sort = "desc".equalsIgnoreCase(sortDir) ? sort.descending() : sort.ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<InboundDeliveryListResponseDTO> response = inboundDeliveryService.getAllInboundDeliveries(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<Page<InboundDeliveryListResponseDTO>> getAllInboundDeliveriesPaged(Pageable pageable) {
        log.info("REST: Fetching Inbound Deliveries with pagination");

        Page<InboundDeliveryListResponseDTO> response = inboundDeliveryService.getAllInboundDeliveries(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<List<InboundDeliveryListResponseDTO>> getAllInboundDeliveriesList() {
        log.info("REST: Fetching all Inbound Deliveries (no pagination)");

        List<InboundDeliveryListResponseDTO> response = inboundDeliveryService.getAllInboundDeliveriesList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<Page<InboundDeliveryListResponseDTO>> searchInboundDeliveries(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = Sort.by(sortBy);
        sort = "desc".equalsIgnoreCase(sortDir) ? sort.descending() : sort.ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        log.info("REST: Searching Inbound Deliveries with keyword: {}", keyword);

        Page<InboundDeliveryListResponseDTO> response = inboundDeliveryService.searchInboundDeliveries(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<List<InboundDeliveryResponseDTO>> getInboundDeliveriesByOrderId(@PathVariable Integer orderId) {
        log.info("REST: Fetching Inbound Deliveries for Order ID: {}", orderId);

        List<InboundDeliveryResponseDTO> response = inboundDeliveryService.getInboundDeliveriesByOrderId(orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/warehouse/{warehouseId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<List<InboundDeliveryResponseDTO>> getInboundDeliveriesByWarehouseId(@PathVariable Integer warehouseId) {
        log.info("REST: Fetching Inbound Deliveries for Warehouse ID: {}", warehouseId);

        List<InboundDeliveryResponseDTO> response = inboundDeliveryService.getInboundDeliveriesByWarehouseId(warehouseId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vendor/{vendorId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','ACCOUNTING')")
    public ResponseEntity<List<InboundDeliveryResponseDTO>> getInboundDeliveriesByVendorId(@PathVariable Integer vendorId) {
        log.info("REST: Fetching Inbound Deliveries for Vendor ID: {}", vendorId);

        List<InboundDeliveryResponseDTO> response = inboundDeliveryService.getInboundDeliveriesByVendorId(vendorId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    @LogActivity(
            action = "UPDATE_INBOUND_DELIVERY",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Cập nhật đơn nhận hàng",
            entityId = "#{#id}"
    )
    public ResponseEntity<InboundDeliveryResponseDTO> updateInboundDelivery(
            @PathVariable Integer id,
            @Valid @RequestBody InboundDeliveryRequestDTO requestDTO) {
        log.info("REST: Updating Inbound Delivery ID: {}", id);

        InboundDeliveryResponseDTO response = inboundDeliveryService.updateInboundDelivery(id, requestDTO);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    @LogActivity(
            action = "UPDATE_INBOUND_DELIVERY_STATUS",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Cập nhật trạng thái đơn nhận hàng sang #{#status}",
            entityId = "#{#id}"
    )
    public ResponseEntity<InboundDeliveryResponseDTO> updateStatus(
            @PathVariable Integer id,
            @RequestParam String status) {
        log.info("REST: Updating status of Inbound Delivery ID: {} to {}", id, status);

        InboundDeliveryResponseDTO response = inboundDeliveryService.updateStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    @LogActivity(
            action = "DELETE_INBOUND_DELIVERY",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Xóa đơn nhận hàng",
            entityId = "#{#id}"
    )
    public ResponseEntity<Void> deleteInboundDelivery(@PathVariable Integer id) {
        log.info("REST: Deleting Inbound Delivery ID: {}", id);

        inboundDeliveryService.deleteInboundDelivery(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE')")
    @LogActivity(
            action = "CANCEL_INBOUND_DELIVERY",
            activityType = "PURCHASE_MANAGEMENT",
            description = "Hủy đơn nhận hàng",
            entityId = "#{#id}"
    )
    public ResponseEntity<InboundDeliveryResponseDTO> cancelInboundDelivery(@PathVariable Integer id) {
        log.info("REST: Cancelling Inbound Delivery ID: {}", id);

        InboundDeliveryResponseDTO response = inboundDeliveryService.cancelInboundDelivery(id);
        return ResponseEntity.ok(response);
    }
}

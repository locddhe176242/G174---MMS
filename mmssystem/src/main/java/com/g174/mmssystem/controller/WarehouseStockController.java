package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.responseDTO.WarehouseStockResponseDTO;
import com.g174.mmssystem.service.IService.IWarehouseStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/warehouse-stocks")
@RequiredArgsConstructor
public class WarehouseStockController {

    private final IWarehouseStockService warehouseStockService;

    /**
     * Lấy danh sách stock trong một warehouse
     */
    @GetMapping("/warehouse/{warehouseId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','PURCHASE','SALE','ACCOUNTING')")
    public ResponseEntity<List<WarehouseStockResponseDTO>> getStockByWarehouse(
            @PathVariable Integer warehouseId) {
        List<WarehouseStockResponseDTO> stocks = warehouseStockService.getStockByWarehouseId(warehouseId);
        return ResponseEntity.ok(stocks);
    }

    /**
     * Lấy stock của một product trong một warehouse cụ thể
     */
    @GetMapping("/warehouse/{warehouseId}/product/{productId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','PURCHASE','SALE','ACCOUNTING')")
    public ResponseEntity<WarehouseStockResponseDTO> getStockByWarehouseAndProduct(
            @PathVariable Integer warehouseId,
            @PathVariable Integer productId) {
        WarehouseStockResponseDTO stock = warehouseStockService.getStockByWarehouseAndProduct(warehouseId, productId);
        return ResponseEntity.ok(stock);
    }

    /**
     * Lấy tổng số lượng của một product trong tất cả warehouses
     */
    @GetMapping("/product/{productId}/total-quantity")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','PURCHASE','SALE','ACCOUNTING')")
    public ResponseEntity<BigDecimal> getTotalQuantityByProduct(@PathVariable Integer productId) {
        BigDecimal totalQuantity = warehouseStockService.getTotalQuantityByProductId(productId);
        return ResponseEntity.ok(totalQuantity);
    }

    /**
     * Lấy số lượng của một product trong một warehouse cụ thể (trả về số, không phải object)
     */
    @GetMapping("/warehouse/{warehouseId}/product/{productId}/quantity")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','PURCHASE','SALE','ACCOUNTING')")
    public ResponseEntity<BigDecimal> getQuantityByWarehouseAndProduct(
            @PathVariable Integer warehouseId,
            @PathVariable Integer productId) {
        BigDecimal quantity = warehouseStockService.getQuantityByWarehouseAndProduct(warehouseId, productId);
        return ResponseEntity.ok(quantity);
    }

    /**
     * Cập nhật số lượng stock (set giá trị mới)
     */
    @PutMapping("/warehouse/{warehouseId}/product/{productId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "UPDATE_WAREHOUSE_STOCK",
            activityType = "INVENTORY_MANAGEMENT",
            description = "Cập nhật số lượng tồn kho",
            entityId = "#{#warehouseId + '-' + #productId}"
    )
    public ResponseEntity<WarehouseStockResponseDTO> updateStock(
            @PathVariable Integer warehouseId,
            @PathVariable Integer productId,
            @RequestParam BigDecimal quantity) {
        WarehouseStockResponseDTO updated = warehouseStockService.updateStock(warehouseId, productId, quantity);
        return ResponseEntity.ok(updated);
    }

    /**
     * Tăng số lượng stock
     */
    @PostMapping("/warehouse/{warehouseId}/product/{productId}/increase")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "INCREASE_STOCK",
            activityType = "INVENTORY_MANAGEMENT",
            description = "Nhập kho",
            entityId = "#{#warehouseId + '-' + #productId}"
    )
    public ResponseEntity<WarehouseStockResponseDTO> increaseStock(
            @PathVariable Integer warehouseId,
            @PathVariable Integer productId,
            @RequestParam BigDecimal quantity) {
        WarehouseStockResponseDTO updated = warehouseStockService.increaseStock(warehouseId, productId, quantity);
        return ResponseEntity.ok(updated);
    }

    /**
     * Giảm số lượng stock
     */
    @PostMapping("/warehouse/{warehouseId}/product/{productId}/decrease")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "DECREASE_STOCK",
            activityType = "INVENTORY_MANAGEMENT",
            description = "Xuất kho",
            entityId = "#{#warehouseId + '-' + #productId}"
    )
    public ResponseEntity<WarehouseStockResponseDTO> decreaseStock(
            @PathVariable Integer warehouseId,
            @PathVariable Integer productId,
            @RequestParam BigDecimal quantity) {
        WarehouseStockResponseDTO updated = warehouseStockService.decreaseStock(warehouseId, productId, quantity);
        return ResponseEntity.ok(updated);
    }

    /**
     * Tạo hoặc cập nhật stock
     */
    @PostMapping("/warehouse/{warehouseId}/product/{productId}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "CREATE_OR_UPDATE_STOCK",
            activityType = "INVENTORY_MANAGEMENT",
            description = "Tạo/Cập nhật tồn kho",
            entityId = "#{#warehouseId + '-' + #productId}"
    )
    public ResponseEntity<WarehouseStockResponseDTO> createOrUpdateStock(
            @PathVariable Integer warehouseId,
            @PathVariable Integer productId,
            @RequestParam BigDecimal quantity) {
        WarehouseStockResponseDTO created = warehouseStockService.createOrUpdateStock(warehouseId, productId, quantity);
        return ResponseEntity.ok(created);
    }
}

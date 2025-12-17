package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.WarehouseRequestDTO;
import com.g174.mmssystem.dto.responseDTO.WarehouseResponseDTO;
import com.g174.mmssystem.service.IService.IWarehouseService;
import com.g174.mmssystem.service.Impl.WarehouseServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final IWarehouseService service;
    private final WarehouseServiceImpl warehouseServiceImpl;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "CREATE_WAREHOUSE",
            activityType = "WAREHOUSE_MANAGEMENT",
            description = "Tạo kho mới: #{#warehouseDTO.warehouseName}",
            entityId = "#{#result.id}"
    )
    public ResponseEntity<WarehouseResponseDTO> createWarehouse(
            @Valid @RequestBody WarehouseRequestDTO warehouseDTO,
            @RequestParam(required = false) Integer createdById) {

        WarehouseResponseDTO created = service.createWarehouse(warehouseDTO, createdById);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','PURCHASE','SALE','ACCOUNTING')")
    public ResponseEntity<List<WarehouseResponseDTO>> getAllWarehouses() {
        return ResponseEntity.ok(service.getAllWarehouses());
    }

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','PURCHASE','SALE','ACCOUNTING')")
    public ResponseEntity<Page<WarehouseResponseDTO>> getAllWarehousesPaged(Pageable pageable) {
        return ResponseEntity.ok(service.getAllWarehouses(pageable));
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','PURCHASE','SALE','ACCOUNTING')")
    public ResponseEntity<WarehouseResponseDTO> getWarehouseById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getWarehouseById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "UPDATE_WAREHOUSE",
            activityType = "WAREHOUSE_MANAGEMENT",
            description = "Cập nhật kho: #{#warehouseDTO.warehouseName}",
            entityId = "#{#id}"
    )
    public ResponseEntity<WarehouseResponseDTO> updateWarehouse(
            @PathVariable Integer id,
            @Valid @RequestBody WarehouseRequestDTO warehouseDTO,
            @RequestParam(required = false) Integer updatedById) {

        return ResponseEntity.ok(service.updateWarehouse(id, warehouseDTO, updatedById));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "DEACTIVATE_WAREHOUSE",
            activityType = "WAREHOUSE_MANAGEMENT",
            description = "Vô hiệu hóa kho",
            entityId = "#{#id}"
    )
    public ResponseEntity<WarehouseResponseDTO> deactivateWarehouse(@PathVariable Integer id) {
        WarehouseResponseDTO response = service.deactivateWarehouse(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    @LogActivity(
            action = "RESTORE_WAREHOUSE",
            activityType = "WAREHOUSE_MANAGEMENT",
            description = "Khôi phục kho",
            entityId = "#{#id}"
    )
    public ResponseEntity<WarehouseResponseDTO> restoreWarehouse(@PathVariable Integer id) {
        WarehouseResponseDTO response = service.restoreWarehouse(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','PURCHASE','SALE','ACCOUNTING')")
    public ResponseEntity<List<WarehouseResponseDTO>> searchWarehouses(
            @RequestParam(required = false, defaultValue = "") String keyword) {
        return ResponseEntity.ok(service.searchWarehouses(keyword));
    }


    @GetMapping("/search/page")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','PURCHASE','SALE','ACCOUNTING')")
    public ResponseEntity<Page<WarehouseResponseDTO>> searchWarehousesPaged(
            @RequestParam(required = false, defaultValue = "") String keyword,
            Pageable pageable) {
        return ResponseEntity.ok(service.searchWarehouses(keyword, pageable));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE')")
    public ResponseEntity<WarehouseResponseDTO> deleteWarehouse(@PathVariable Integer id) {
        WarehouseResponseDTO deleted = warehouseServiceImpl.deleteWarehouse(id);
        return ResponseEntity.ok(deleted);
    }


    @GetMapping("/exists/{code}")
    @PreAuthorize("hasAnyRole('MANAGER','WAREHOUSE','PURCHASE','SALE','ACCOUNTING')")
    public ResponseEntity<Boolean> checkWarehouseCodeExists(@PathVariable String code) {
        return ResponseEntity.ok(service.existsByCode(code));
    }
}
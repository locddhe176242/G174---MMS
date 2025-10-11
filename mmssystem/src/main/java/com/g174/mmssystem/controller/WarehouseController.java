package com.g174.mmssystem.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.g174.mmssystem.dto.responseDTO.WarehouseResponseDTO;
import com.g174.mmssystem.entity.Warehouse;
import com.g174.mmssystem.service.WarehouseService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService service;

    @PostMapping
    public ResponseEntity<Warehouse> createWarehouse(@Valid @RequestBody Warehouse warehouse) {
        return ResponseEntity.ok(service.addWarehouse(warehouse));
    }

    @GetMapping
    public ResponseEntity<List<WarehouseResponseDTO>> getAllWarehouses() {
        return ResponseEntity.ok(service.getAllWarehouses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseResponseDTO> getWarehouseById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getWarehouseDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Warehouse> updateWarehouse(@PathVariable Long id,
                                                     @Valid @RequestBody Warehouse warehouse) {
        return ResponseEntity.ok(service.updateWarehouse(id, warehouse));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Warehouse> deactivateWarehouse(@PathVariable Long id) {
        return ResponseEntity.ok(service.deactivateWarehouse(id));
    }
}

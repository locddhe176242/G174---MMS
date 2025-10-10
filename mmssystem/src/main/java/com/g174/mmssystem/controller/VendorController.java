package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.VendorRequestDTO;
import com.g174.mmssystem.dto.responseDTO.VendorResponseDTO;
import com.g174.mmssystem.service.IService.IVendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*") // Configure appropriately for production
public class VendorController {

    private final IVendorService vendorService;

    @PostMapping
    public ResponseEntity<VendorResponseDTO> createVendor(
            @Valid @RequestBody VendorRequestDTO vendorRequestDTO) {

        log.info("REST: Creating new vendor: {} with code: {}",
                vendorRequestDTO.getName(), vendorRequestDTO.getVendorCode());

        VendorResponseDTO response = vendorService.createVendor(vendorRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{vendorId}")
    public ResponseEntity<VendorResponseDTO> getVendorById(@PathVariable Integer vendorId) {
        log.info("REST: Fetching vendor with ID: {}", vendorId);

        VendorResponseDTO response = vendorService.getVendorById(vendorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/code/{vendorCode}")
    public ResponseEntity<VendorResponseDTO> getVendorByCode(@PathVariable String vendorCode) {
        log.info("REST: Fetching vendor with code: {}", vendorCode);

        VendorResponseDTO response = vendorService.getVendorByCode(vendorCode);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<VendorResponseDTO>> getAllVendors() {
        log.info("REST: Fetching all vendors");

        List<VendorResponseDTO> response = vendorService.getAllVendors();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/page")
    public ResponseEntity<Page<VendorResponseDTO>> getAllVendorsWithPagination(Pageable pageable) {
        log.info("REST: Fetching vendors with pagination - page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<VendorResponseDTO> response = vendorService.getAllVendors(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<List<VendorResponseDTO>> searchVendors(
            @RequestParam(required = false, defaultValue = "") String keyword) {
        log.info("REST: Searching vendors with keyword: '{}'", keyword);

        List<VendorResponseDTO> response = vendorService.searchVendors(keyword);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search/page")
    public ResponseEntity<Page<VendorResponseDTO>> searchVendorsWithPagination(
            @RequestParam(required = false, defaultValue = "") String keyword,
            Pageable pageable) {
        log.info("REST: Searching vendors with keyword: '{}' and pagination - page: {}, size: {}",
                keyword, pageable.getPageNumber(), pageable.getPageSize());

        Page<VendorResponseDTO> response = vendorService.searchVendors(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{vendorId}")
    public ResponseEntity<VendorResponseDTO> updateVendor(
            @PathVariable Integer vendorId,
            @Valid @RequestBody VendorRequestDTO vendorRequestDTO) {

        log.info("REST: Updating vendor with ID: {}", vendorId);

        VendorResponseDTO response = vendorService.updateVendor(vendorId, vendorRequestDTO);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{vendorId}")
    public ResponseEntity<Void> deleteVendor(@PathVariable Integer vendorId) {
        log.info("REST: Soft deleting vendor with ID: {}", vendorId);

        vendorService.deleteVendor(vendorId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{vendorId}/restore")
    public ResponseEntity<VendorResponseDTO> restoreVendor(@PathVariable Integer vendorId) {
        log.info("REST: Restoring vendor with ID: {}", vendorId);

        vendorService.restoreVendor(vendorId);

        // Return the restored vendor
        VendorResponseDTO response = vendorService.getVendorById(vendorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/exists/{vendorCode}")
    public ResponseEntity<Boolean> checkVendorCodeExists(@PathVariable String vendorCode) {
        log.info("REST: Checking if vendor code exists: {}", vendorCode);

        boolean exists = vendorService.existsByVendorCode(vendorCode);
        return ResponseEntity.ok(exists);
    }
}
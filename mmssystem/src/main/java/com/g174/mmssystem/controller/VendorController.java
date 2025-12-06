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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
@Slf4j
public class VendorController {

    private final IVendorService vendorService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<VendorResponseDTO> createVendor(
            @Valid @RequestBody VendorRequestDTO vendorRequestDTO) {

        log.info("REST: Creating new vendor: {} with code: {}",
                vendorRequestDTO.getName(), vendorRequestDTO.getVendorCode());

        VendorResponseDTO response = vendorService.createVendor(vendorRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{vendorId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','ACCOUNTANT')")
    public ResponseEntity<VendorResponseDTO> getVendorById(@PathVariable Integer vendorId) {
        log.info("REST: Fetching vendor with ID: {}", vendorId);

        VendorResponseDTO response = vendorService.getVendorById(vendorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/code/{vendorCode}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','ACCOUNTANT')")
    public ResponseEntity<VendorResponseDTO> getVendorByCode(@PathVariable String vendorCode) {
        log.info("REST: Fetching vendor with code: {}", vendorCode);

        VendorResponseDTO response = vendorService.getVendorByCode(vendorCode);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','ACCOUNTANT')")
    public ResponseEntity<List<VendorResponseDTO>> getAllVendors() {
        log.info("REST: Fetching all vendors");

        List<VendorResponseDTO> response = vendorService.getAllVendors();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','ACCOUNTANT')")
    public ResponseEntity<Page<VendorResponseDTO>> getAllVendorsWithPagination(Pageable pageable) {
        log.info("REST: Fetching vendors with pagination - page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<VendorResponseDTO> response = vendorService.getAllVendors(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','ACCOUNTANT')")
    public ResponseEntity<List<VendorResponseDTO>> searchVendors(
            @RequestParam(required = false, defaultValue = "") String keyword) {
        log.info("REST: Searching vendors with keyword: '{}'", keyword);

        List<VendorResponseDTO> response = vendorService.searchVendors(keyword);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search/page")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','ACCOUNTANT')")
    public ResponseEntity<Page<VendorResponseDTO>> searchVendorsWithPagination(
            @RequestParam(required = false, defaultValue = "") String keyword,
            Pageable pageable) {
        log.info("REST: Searching vendors with keyword: '{}' and pagination - page: {}, size: {}",
                keyword, pageable.getPageNumber(), pageable.getPageSize());

        Page<VendorResponseDTO> response = vendorService.searchVendors(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{vendorId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<VendorResponseDTO> updateVendor(
            @PathVariable Integer vendorId,
            @Valid @RequestBody VendorRequestDTO vendorRequestDTO) {

        log.info("REST: Updating vendor with ID: {}", vendorId);

        VendorResponseDTO response = vendorService.updateVendor(vendorId, vendorRequestDTO);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{vendorId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Void> deleteVendor(@PathVariable Integer vendorId) {
        log.info("REST: Soft deleting vendor with ID: {}", vendorId);

        vendorService.deleteVendor(vendorId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{vendorId}/restore")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<VendorResponseDTO> restoreVendor(@PathVariable Integer vendorId) {
        log.info("REST: Restoring vendor with ID: {}", vendorId);

        vendorService.restoreVendor(vendorId);

        VendorResponseDTO response = vendorService.getVendorById(vendorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/exists/{vendorCode}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','ACCOUNTANT')")
    public ResponseEntity<Map<String, Boolean>> checkVendorCodeExists(@PathVariable String vendorCode) {
        log.info("REST: Checking if vendor code exists: {}", vendorCode);

        boolean exists = vendorService.existsByVendorCode(vendorCode);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/generate-code")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Map<String, String>> generateVendorCode() {
        log.info("Generating new vendor code");
        String vendorCode = vendorService.generateNextVendorCode();
        Map<String, String> response = new HashMap<>();
        response.put("vendorCode", vendorCode);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{vendorId}/balance")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','ACCOUNTANT')")
    public ResponseEntity<Map<String, Object>> getVendorBalance(@PathVariable Integer vendorId) {
        log.info("REST: Fetching balance for vendor ID: {}", vendorId);
        Map<String, Object> balance = vendorService.getVendorBalance(vendorId);
        return ResponseEntity.ok(balance);
    }

    @GetMapping("/{vendorId}/documents")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Map<String, Object>> getVendorDocuments(@PathVariable Integer vendorId) {
        log.info("REST: Fetching documents for vendor ID: {}", vendorId);
        Map<String, Object> documents = vendorService.getVendorDocuments(vendorId);
        return ResponseEntity.ok(documents);
    }
}
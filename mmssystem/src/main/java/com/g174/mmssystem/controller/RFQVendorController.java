package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.RFQVendorRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RFQVendorResponseDTO;
import com.g174.mmssystem.enums.RFQVendorStatus;
import com.g174.mmssystem.service.IService.IRFQVendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rfq-vendors")
@RequiredArgsConstructor
@Slf4j
public class RFQVendorController {

    private final IRFQVendorService rfqVendorService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<RFQVendorResponseDTO> createRFQVendor(
            @Valid @RequestBody RFQVendorRequestDTO requestDTO) {
        log.info("REST: Creating RFQ Vendor relationship: RFQ ID: {}, Vendor ID: {}",
                requestDTO.getRfqId(), requestDTO.getVendorId());

        RFQVendorResponseDTO response = rfqVendorService.createRFQVendor(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/rfq/{rfqId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<List<RFQVendorResponseDTO>> getVendorsByRfqId(@PathVariable Integer rfqId) {
        log.info("REST: Fetching vendors for RFQ ID: {}", rfqId);

        List<RFQVendorResponseDTO> response = rfqVendorService.getVendorsByRfqId(rfqId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vendor/{vendorId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<List<RFQVendorResponseDTO>> getRfqsByVendorId(@PathVariable Integer vendorId) {
        log.info("REST: Fetching RFQs for Vendor ID: {}", vendorId);

        List<RFQVendorResponseDTO> response = rfqVendorService.getRfqsByVendorId(vendorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rfq/{rfqId}/vendor/{vendorId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<RFQVendorResponseDTO> getRFQVendor(
            @PathVariable Integer rfqId,
            @PathVariable Integer vendorId) {
        log.info("REST: Fetching RFQ Vendor: RFQ ID: {}, Vendor ID: {}", rfqId, vendorId);

        RFQVendorResponseDTO response = rfqVendorService.getRFQVendor(rfqId, vendorId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/rfq/{rfqId}/vendor/{vendorId}/status")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<RFQVendorResponseDTO> updateStatus(
            @PathVariable Integer rfqId,
            @PathVariable Integer vendorId,
            @RequestParam RFQVendorStatus status) {
        log.info("REST: Updating RFQ Vendor status: RFQ ID: {}, Vendor ID: {}, Status: {}", rfqId, vendorId, status);

        RFQVendorResponseDTO response = rfqVendorService.updateRFQVendorStatus(rfqId, vendorId, status);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/rfq/{rfqId}/vendor/{vendorId}")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE')")
    public ResponseEntity<Void> deleteRFQVendor(
            @PathVariable Integer rfqId,
            @PathVariable Integer vendorId) {
        log.info("REST: Deleting RFQ Vendor: RFQ ID: {}, Vendor ID: {}", rfqId, vendorId);

        rfqVendorService.deleteRFQVendor(rfqId, vendorId);
        return ResponseEntity.noContent().build();
    }
}


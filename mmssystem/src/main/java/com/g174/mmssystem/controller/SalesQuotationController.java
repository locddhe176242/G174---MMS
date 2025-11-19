package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.SalesQuotationRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesQuotationListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesQuotationResponseDTO;
import com.g174.mmssystem.service.IService.ISalesQuotationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sales/quotations")
@RequiredArgsConstructor
public class SalesQuotationController {

    private final ISalesQuotationService salesQuotationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<Page<SalesQuotationListResponseDTO>> listQuotations(
            @RequestParam(required = false) Integer customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "quotationDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = Sort.by(sortBy);
        if ("desc".equalsIgnoreCase(sortDir)) {
            sort = sort.descending();
        } else {
            sort = sort.ascending();
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SalesQuotationListResponseDTO> result =
                salesQuotationService.getQuotations(customerId, status, keyword, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<SalesQuotationResponseDTO> getQuotation(@PathVariable Integer id) {
        return ResponseEntity.ok(salesQuotationService.getQuotation(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<SalesQuotationResponseDTO> createQuotation(
            @Valid @RequestBody SalesQuotationRequestDTO request) {
        return ResponseEntity.ok(salesQuotationService.createQuotation(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<SalesQuotationResponseDTO> updateQuotation(
            @PathVariable Integer id,
            @Valid @RequestBody SalesQuotationRequestDTO request) {
        return ResponseEntity.ok(salesQuotationService.updateQuotation(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<SalesQuotationResponseDTO> changeStatus(
            @PathVariable Integer id,
            @RequestParam String status) {
        return ResponseEntity.ok(salesQuotationService.changeStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteQuotation(@PathVariable Integer id) {
        salesQuotationService.deleteQuotation(id);
        return ResponseEntity.noContent().build();
    }
}


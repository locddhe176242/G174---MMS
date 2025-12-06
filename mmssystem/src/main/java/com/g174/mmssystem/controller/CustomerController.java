package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.CustomerRequestDTO;
import com.g174.mmssystem.dto.responseDTO.CustomerResponseDTO;
import com.g174.mmssystem.dto.responseDTO.CustomerDetailResponseDTO;
import com.g174.mmssystem.service.IService.ICustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {

    private final ICustomerService customerService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<CustomerResponseDTO> createCustomer(
            @Valid @RequestBody CustomerRequestDTO customerRequestDTO) {

        log.info("REST: Creating new customer: {} {} with code: {}",
                customerRequestDTO.getFirstName(), customerRequestDTO.getLastName(), customerRequestDTO.getCustomerCode());

        CustomerResponseDTO response = customerService.createCustomer(customerRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{customerId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<CustomerResponseDTO> getCustomerById(@PathVariable Integer customerId) {
        log.info("REST: Fetching customer with ID: {}", customerId);

        CustomerResponseDTO response = customerService.getCustomerById(customerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/code/{customerCode}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<CustomerResponseDTO> getCustomerByCode(@PathVariable String customerCode) {
        log.info("REST: Fetching customer with code: {}", customerCode);

        CustomerResponseDTO response = customerService.getCustomerByCode(customerCode);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<List<CustomerResponseDTO>> getAllCustomers() {
        log.info("REST: Fetching all customers");

        List<CustomerResponseDTO> response = customerService.getAllCustomers();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<Page<CustomerResponseDTO>> getAllCustomersWithPagination(Pageable pageable) {
        log.info("REST: Fetching customers with pagination - page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Page<CustomerResponseDTO> response = customerService.getAllCustomers(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<List<CustomerResponseDTO>> searchCustomers(
            @RequestParam(required = false, defaultValue = "") String keyword) {
        log.info("REST: Searching customers with keyword: '{}'", keyword);

        List<CustomerResponseDTO> response = customerService.searchCustomers(keyword);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search/page")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<Page<CustomerResponseDTO>> searchCustomersWithPagination(
            @RequestParam(required = false, defaultValue = "") String keyword,
            Pageable pageable) {
        log.info("REST: Searching customers with keyword: '{}' and pagination - page: {}, size: {}",
                keyword, pageable.getPageNumber(), pageable.getPageSize());

        Page<CustomerResponseDTO> response = customerService.searchCustomers(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{customerId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<CustomerResponseDTO> updateCustomer(
            @PathVariable Integer customerId,
            @Valid @RequestBody CustomerRequestDTO customerRequestDTO) {

        log.info("REST: Updating customer with ID: {}", customerId);

        CustomerResponseDTO response = customerService.updateCustomer(customerId, customerRequestDTO);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{customerId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Integer customerId) {
        log.info("REST: Soft deleting customer with ID: {}", customerId);

        customerService.deleteCustomer(customerId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{customerId}/restore")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<CustomerResponseDTO> restoreCustomer(@PathVariable Integer customerId) {
        log.info("REST: Restoring customer with ID: {}", customerId);

        customerService.restoreCustomer(customerId);

        CustomerResponseDTO response = customerService.getCustomerById(customerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{customerId}/detail")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<CustomerDetailResponseDTO> getCustomerDetailById(@PathVariable Integer customerId) {
        log.info("REST: Fetching customer detail with ID: {}", customerId);

        CustomerDetailResponseDTO response = customerService.getCustomerDetailById(customerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/exists/{customerCode}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<Map<String, Boolean>> checkCustomerCodeExists(@PathVariable String customerCode) {
        log.info("REST: Checking if customer code exists: {}", customerCode);

        boolean exists = customerService.existsByCustomerCode(customerCode);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/generate-code")
    @PreAuthorize("hasAnyRole('MANAGER','SALE')")
    public ResponseEntity<Map<String, String>> generateCustomerCode() {
        log.info("REST: Generating new customer code");
        String customerCode = customerService.generateNextCustomerCode();
        Map<String, String> response = new HashMap<>();
        response.put("customerCode", customerCode);
        return ResponseEntity.ok(response);
    }
}
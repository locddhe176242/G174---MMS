package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.APInvoiceRequestDTO;
import com.g174.mmssystem.dto.responseDTO.APInvoiceResponseDTO;
import com.g174.mmssystem.entity.APInvoice;
import com.g174.mmssystem.service.IService.IAPInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ap-invoices")
@RequiredArgsConstructor
@Slf4j
public class APInvoiceController {

    private final IAPInvoiceService apInvoiceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    @LogActivity(
            action = "CREATE_AP_INVOICE",
            activityType = "ACCOUNTANT_MANAGEMENT",
            description = "Tạo hóa đơn phải trả: #{#result.body.invoiceNo}",
            entityId = "#{#result.body.apInvoiceId}"
    )
    public ResponseEntity<APInvoiceResponseDTO> createInvoice(@RequestBody APInvoiceRequestDTO requestDTO) {
        APInvoiceResponseDTO response = apInvoiceService.createInvoice(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/from-goods-receipt/{receiptId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    @LogActivity(
            action = "CREATE_AP_INVOICE_FROM_GR",
            activityType = "ACCOUNTANT_MANAGEMENT",
            description = "Tạo hóa đơn từ phiếu nhập kho ID: #{#receiptId}",
            entityId = "#{#result.body.apInvoiceId}"
    )
    public ResponseEntity<APInvoiceResponseDTO> createInvoiceFromGoodsReceipt(@PathVariable Integer receiptId) {
        APInvoiceResponseDTO response = apInvoiceService.createInvoiceFromGoodsReceipt(receiptId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{invoiceId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<APInvoiceResponseDTO> getInvoiceById(@PathVariable Integer invoiceId) {
        APInvoiceResponseDTO response = apInvoiceService.getInvoiceById(invoiceId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<List<APInvoiceResponseDTO>> getAllInvoices() {
        List<APInvoiceResponseDTO> response = apInvoiceService.getAllInvoices();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<Page<APInvoiceResponseDTO>> getAllInvoicesPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<APInvoiceResponseDTO> response = apInvoiceService.getAllInvoices(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<List<APInvoiceResponseDTO>> searchInvoices(@RequestParam String keyword) {
        List<APInvoiceResponseDTO> response = apInvoiceService.searchInvoices(keyword);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search/paged")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<Page<APInvoiceResponseDTO>> searchInvoicesPaged(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<APInvoiceResponseDTO> response = apInvoiceService.searchInvoices(keyword, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vendor/{vendorId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<List<APInvoiceResponseDTO>> getInvoicesByVendorId(@PathVariable Integer vendorId) {
        List<APInvoiceResponseDTO> response = apInvoiceService.getInvoicesByVendorId(vendorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/purchase-order/{orderId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<List<APInvoiceResponseDTO>> getInvoicesByOrderId(@PathVariable Integer orderId) {
        List<APInvoiceResponseDTO> response = apInvoiceService.getInvoicesByOrderId(orderId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/goods-receipt/{receiptId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<List<APInvoiceResponseDTO>> getInvoicesByReceiptId(@PathVariable Integer receiptId) {
        List<APInvoiceResponseDTO> response = apInvoiceService.getInvoicesByReceiptId(receiptId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<List<APInvoiceResponseDTO>> getInvoicesByStatus(@PathVariable APInvoice.APInvoiceStatus status) {
        List<APInvoiceResponseDTO> response = apInvoiceService.getInvoicesByStatus(status);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{invoiceId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    @LogActivity(
            action = "UPDATE_AP_INVOICE",
            activityType = "ACCOUNTANT_MANAGEMENT",
            description = "Cập nhật hóa đơn phải trả ID: #{#invoiceId}",
            entityId = "#{#invoiceId}"
    )
    public ResponseEntity<APInvoiceResponseDTO> updateInvoice(
            @PathVariable Integer invoiceId,
            @RequestBody APInvoiceRequestDTO dto) {
        APInvoiceResponseDTO response = apInvoiceService.updateInvoice(invoiceId, dto);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{invoiceId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    @LogActivity(
            action = "DELETE_AP_INVOICE",
            activityType = "ACCOUNTANT_MANAGEMENT",
            description = "Xóa hóa đơn phải trả ID: #{#invoiceId}",
            entityId = "#{#invoiceId}"
    )
    public ResponseEntity<APInvoiceResponseDTO> deleteInvoice(@PathVariable Integer invoiceId) {
        APInvoiceResponseDTO response = apInvoiceService.deleteInvoice(invoiceId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-invoice-no")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<Boolean> checkInvoiceNoExists(@RequestParam String invoiceNo) {
        boolean exists = apInvoiceService.existsByInvoiceNo(invoiceNo);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/generate-invoice-no")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<Map<String, String>> generateInvoiceNo() {
        String invoiceNo = apInvoiceService.generateInvoiceNo();
        return ResponseEntity.ok(Map.of("invoiceNo", invoiceNo));
    }
}

package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.APPaymentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.APPaymentResponseDTO;
import com.g174.mmssystem.service.IService.IAPInvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.List;

@RestController
@RequestMapping("/api/ap-payments")
@RequiredArgsConstructor
public class APPaymentController {

    private final IAPInvoiceService apInvoiceService;

    /**
     * Tạo payment mới cho AP Invoice
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    @LogActivity(
            action = "CREATE_AP_PAYMENT",
            activityType = "PAYMENT_MANAGEMENT",
            description = "Tạo thanh toán cho hóa đơn ID: #{#dto.apInvoiceId}, Số tiền: #{#dto.amount}",
            entityId = "#{#dto.apInvoiceId}"
    )
    public ResponseEntity<APPaymentResponseDTO> createPayment(@Valid @RequestBody APPaymentRequestDTO dto) {
        APPaymentResponseDTO response = apInvoiceService.addPayment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lấy danh sách payments của một invoice
     */
    @GetMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<List<APPaymentResponseDTO>> getPaymentsByInvoiceId(@PathVariable Integer invoiceId) {
        List<APPaymentResponseDTO> response = apInvoiceService.getPaymentsByInvoiceId(invoiceId);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy tất cả payments với pagination và search
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    public ResponseEntity<org.springframework.data.domain.Page<APPaymentResponseDTO>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String keyword
    ) {
        org.springframework.data.domain.Sort sort = sortDir.equalsIgnoreCase("asc") 
            ? org.springframework.data.domain.Sort.by(sortBy).ascending()
            : org.springframework.data.domain.Sort.by(sortBy).descending();
        
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);
        org.springframework.data.domain.Page<APPaymentResponseDTO> response = apInvoiceService.getAllPayments(keyword, pageable);
        
        return ResponseEntity.ok(response);
    }
}

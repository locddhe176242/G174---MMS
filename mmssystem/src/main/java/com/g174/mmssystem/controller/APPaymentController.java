package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.APPaymentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.APPaymentResponseDTO;
import com.g174.mmssystem.service.IService.IAPInvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<List<APPaymentResponseDTO>> getPaymentsByInvoiceId(@PathVariable Integer invoiceId) {
        List<APPaymentResponseDTO> response = apInvoiceService.getPaymentsByInvoiceId(invoiceId);
        return ResponseEntity.ok(response);
    }
}

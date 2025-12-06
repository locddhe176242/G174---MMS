package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.ARInvoiceRequestDTO;
import com.g174.mmssystem.dto.requestDTO.ARPaymentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ARInvoiceListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ARInvoiceResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ARPaymentResponseDTO;
import com.g174.mmssystem.service.IService.IARInvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ar-invoices")
@RequiredArgsConstructor
public class ARInvoiceController {

    private final IARInvoiceService arInvoiceService;

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<List<ARInvoiceListResponseDTO>> getAllInvoices() {
        return ResponseEntity.ok(arInvoiceService.getAllInvoices());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<ARInvoiceResponseDTO> getInvoice(@PathVariable Integer id) {
        return ResponseEntity.ok(arInvoiceService.getInvoiceById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    @LogActivity(action = "CREATE_INVOICE", activityType = "SALES_MANAGEMENT", description = "Tạo hóa đơn mới")
    public ResponseEntity<ARInvoiceResponseDTO> createInvoice(
            @Valid @RequestBody ARInvoiceRequestDTO request) {
        return ResponseEntity.ok(arInvoiceService.createInvoice(request));
    }

    @PostMapping("/from-delivery/{deliveryId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    @LogActivity(action = "CREATE_INVOICE_FROM_DELIVERY", activityType = "SALES_MANAGEMENT", description = "Tạo hóa đơn từ Delivery #deliveryId")
    public ResponseEntity<ARInvoiceResponseDTO> createInvoiceFromDelivery(
            @PathVariable Integer deliveryId) {
        return ResponseEntity.ok(arInvoiceService.createInvoiceFromDelivery(deliveryId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    @LogActivity(action = "UPDATE_INVOICE", activityType = "SALES_MANAGEMENT", description = "Cập nhật hóa đơn #id")
    public ResponseEntity<ARInvoiceResponseDTO> updateInvoice(
            @PathVariable Integer id,
            @Valid @RequestBody ARInvoiceRequestDTO request) {
        return ResponseEntity.ok(arInvoiceService.updateInvoice(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT')")
    @LogActivity(action = "DELETE_INVOICE", activityType = "SALES_MANAGEMENT", description = "Xóa hóa đơn #id")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Integer id) {
        arInvoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    @LogActivity(action = "ADD_INVOICE_PAYMENT", activityType = "SALES_MANAGEMENT", description = "Thêm thanh toán cho hóa đơn #id")
    public ResponseEntity<ARPaymentResponseDTO> addPayment(
            @PathVariable Integer id,
            @Valid @RequestBody ARPaymentRequestDTO request) {
        request.setInvoiceId(id);
        return ResponseEntity.ok(arInvoiceService.addPayment(request));
    }

    @GetMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTANT')")
    public ResponseEntity<List<ARPaymentResponseDTO>> getPayments(@PathVariable Integer id) {
        return ResponseEntity.ok(arInvoiceService.getPaymentsByInvoiceId(id));
    }
}


package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.CreditNoteRequestDTO;
import com.g174.mmssystem.dto.responseDTO.CreditNoteListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.CreditNoteResponseDTO;
import com.g174.mmssystem.service.IService.ICreditNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/credit-notes")
@RequiredArgsConstructor
public class CreditNoteController {

    private final ICreditNoteService creditNoteService;

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTING')")
    public ResponseEntity<List<CreditNoteListResponseDTO>> getAllCreditNotes(
            @RequestParam(required = false) Integer invoiceId,
            @RequestParam(required = false) Integer returnOrderId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(creditNoteService.getAllCreditNotes(invoiceId, returnOrderId, status, keyword));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTING')")
    public ResponseEntity<CreditNoteResponseDTO> getCreditNote(@PathVariable Integer id) {
        return ResponseEntity.ok(creditNoteService.getCreditNote(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTING')")
    @LogActivity(action = "CREATE_CREDIT_NOTE", activityType = "SALES_MANAGEMENT", description = "Tạo Credit Note")
    public ResponseEntity<CreditNoteResponseDTO> createCreditNote(
            @Valid @RequestBody CreditNoteRequestDTO request) {
        return ResponseEntity.ok(creditNoteService.createCreditNote(request));
    }

    @PostMapping("/from-invoice/{invoiceId}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTING')")
    @LogActivity(action = "CREATE_CREDIT_NOTE_FROM_INVOICE", activityType = "SALES_MANAGEMENT", description = "Tạo Credit Note (hóa đơn điều chỉnh) từ Invoice gốc")
    public ResponseEntity<CreditNoteResponseDTO> createFromInvoice(@PathVariable Integer invoiceId) {
        return ResponseEntity.ok(creditNoteService.createFromInvoice(invoiceId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTING')")
    @LogActivity(action = "UPDATE_CREDIT_NOTE", activityType = "SALES_MANAGEMENT", description = "Cập nhật Credit Note")
    public ResponseEntity<CreditNoteResponseDTO> updateCreditNote(
            @PathVariable Integer id,
            @Valid @RequestBody CreditNoteRequestDTO request) {
        return ResponseEntity.ok(creditNoteService.updateCreditNote(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','SALE','ACCOUNTING')")
    @LogActivity(action = "CHANGE_CREDIT_NOTE_STATUS", activityType = "SALES_MANAGEMENT", description = "Thay đổi trạng thái Credit Note")
    public ResponseEntity<CreditNoteResponseDTO> changeStatus(
            @PathVariable Integer id,
            @RequestParam String status) {
        return ResponseEntity.ok(creditNoteService.changeStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(action = "DELETE_CREDIT_NOTE", activityType = "SALES_MANAGEMENT", description = "Xóa Credit Note")
    public ResponseEntity<Void> deleteCreditNote(@PathVariable Integer id) {
        creditNoteService.deleteCreditNote(id);
        return ResponseEntity.noContent().build();
    }
}

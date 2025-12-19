package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.CreditNoteRequestDTO;
import com.g174.mmssystem.dto.responseDTO.CreditNoteListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.CreditNoteResponseDTO;

import java.util.List;

public interface ICreditNoteService {

    CreditNoteResponseDTO createCreditNote(CreditNoteRequestDTO request);

    CreditNoteResponseDTO updateCreditNote(Integer id, CreditNoteRequestDTO request);

    CreditNoteResponseDTO getCreditNote(Integer id);

    List<CreditNoteListResponseDTO> getAllCreditNotes(Integer invoiceId, Integer returnOrderId, String status, String keyword);

    void deleteCreditNote(Integer id);

    CreditNoteResponseDTO changeStatus(Integer id, String status);

    CreditNoteResponseDTO createFromInvoice(Integer invoiceId);

    CreditNoteResponseDTO updateRefundPaidAmount(Integer id, java.math.BigDecimal refundPaidAmount);
}

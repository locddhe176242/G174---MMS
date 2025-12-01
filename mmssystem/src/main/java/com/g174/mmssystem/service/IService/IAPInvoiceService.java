package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.APInvoiceRequestDTO;
import com.g174.mmssystem.dto.requestDTO.APPaymentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.APInvoiceResponseDTO;
import com.g174.mmssystem.dto.responseDTO.APPaymentResponseDTO;
import com.g174.mmssystem.entity.APInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IAPInvoiceService {
    APInvoiceResponseDTO createInvoice(APInvoiceRequestDTO dto);
    
    APInvoiceResponseDTO createInvoiceFromGoodsReceipt(Integer receiptId);
    
    APInvoiceResponseDTO getInvoiceById(Integer invoiceId);
    
    List<APInvoiceResponseDTO> getAllInvoices();
    
    Page<APInvoiceResponseDTO> getAllInvoices(Pageable pageable);
    
    List<APInvoiceResponseDTO> searchInvoices(String keyword);
    
    Page<APInvoiceResponseDTO> searchInvoices(String keyword, Pageable pageable);
    
    List<APInvoiceResponseDTO> getInvoicesByVendorId(Integer vendorId);
    
    List<APInvoiceResponseDTO> getInvoicesByOrderId(Integer orderId);
    
    List<APInvoiceResponseDTO> getInvoicesByReceiptId(Integer receiptId);
    
    List<APInvoiceResponseDTO> getInvoicesByStatus(APInvoice.APInvoiceStatus status);
    
    APInvoiceResponseDTO updateInvoice(Integer invoiceId, APInvoiceRequestDTO dto);
    
    APInvoiceResponseDTO deleteInvoice(Integer invoiceId);
    
    APPaymentResponseDTO addPayment(APPaymentRequestDTO dto);
    
    List<APPaymentResponseDTO> getPaymentsByInvoiceId(Integer invoiceId);
    
    Page<APPaymentResponseDTO> getAllPayments(String keyword, Pageable pageable);
    
    boolean existsByInvoiceNo(String invoiceNo);
    
    String generateInvoiceNo();
}

package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.ARInvoiceRequestDTO;
import com.g174.mmssystem.dto.requestDTO.ARPaymentRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ARInvoiceResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ARInvoiceListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ARPaymentResponseDTO;

import java.util.List;

public interface IARInvoiceService {

    ARInvoiceResponseDTO createInvoice(ARInvoiceRequestDTO request);

    ARInvoiceResponseDTO updateInvoice(Integer invoiceId, ARInvoiceRequestDTO request);

    ARInvoiceResponseDTO getInvoiceById(Integer invoiceId);

    List<ARInvoiceListResponseDTO> getAllInvoices();

    void deleteInvoice(Integer invoiceId);

    ARPaymentResponseDTO addPayment(ARPaymentRequestDTO request);

    List<ARPaymentResponseDTO> getPaymentsByInvoiceId(Integer invoiceId);

    ARInvoiceResponseDTO createInvoiceFromDelivery(Integer deliveryId);
}


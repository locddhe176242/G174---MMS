package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.dto.requestDTO.AddressDTO;
import com.g174.mmssystem.dto.requestDTO.ContactDTO;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
public class VendorDetailResponseDTO {
    private Integer vendorId;
    private String name;
    private String vendorCode;
    private AddressDTO address;
    private ContactDTO contact;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;

    // Transaction summary
    private TransactionSummaryDTO transactionSummary;

    // Recent transactions
    private List<PurchaseQuotationDTO> recentQuotations;
    private List<PurchaseOrderDTO> recentOrders;
    private List<APInvoiceDTO> recentInvoices;
}
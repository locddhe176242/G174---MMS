package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.responseDTO.DebtTransactionResponseDTO;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.IDebtManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation cho Debt Management
 * Tổng hợp công nợ từ APInvoice, APPayment, ARInvoice, ARPayment
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DebtManagementServiceImpl implements IDebtManagementService {

    private final APInvoiceRepository apInvoiceRepository;
    private final APPaymentRepository apPaymentRepository;
    private final ARInvoiceRepository arInvoiceRepository;
    private final ARPaymentRepository arPaymentRepository;

    @Override
    public Page<DebtTransactionResponseDTO> getAllDebtTransactions(Pageable pageable) {
        log.info("Fetching all debt transactions with pagination - page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        // Lấy tất cả transactions
        List<DebtTransactionResponseDTO> allTransactions = combineAllTransactions(null);

        // Sort
        allTransactions = sortTransactions(allTransactions, pageable.getSort());

        // Paginate manually
        return paginateTransactions(allTransactions, pageable);
    }

    @Override
    public Page<DebtTransactionResponseDTO> searchDebtTransactions(String keyword, Pageable pageable) {
        log.info("Searching debt transactions with keyword: '{}', page: {}, size: {}",
                keyword, pageable.getPageNumber(), pageable.getPageSize());

        // Lấy tất cả transactions
        List<DebtTransactionResponseDTO> allTransactions = combineAllTransactions(keyword);

        // Sort
        allTransactions = sortTransactions(allTransactions, pageable.getSort());

        // Paginate manually
        return paginateTransactions(allTransactions, pageable);
    }

    /**
     * Kết hợp tất cả transactions từ 4 nguồn: APInvoice, APPayment, ARInvoice, ARPayment
     */
    private List<DebtTransactionResponseDTO> combineAllTransactions(String keyword) {
        List<DebtTransactionResponseDTO> transactions = new ArrayList<>();

        // 1. Lấy AP Invoices (Vendor - công nợ phải trả)
        List<APInvoice> apInvoices = apInvoiceRepository.findAllActive();
        for (APInvoice invoice : apInvoices) {
            if (invoice.getVendor() == null) continue;

            DebtTransactionResponseDTO dto = DebtTransactionResponseDTO.builder()
                    .id(invoice.getApInvoiceId().longValue())
                    .customerVendorCode(invoice.getVendor().getVendorCode())
                    .customerVendorType("Vendor")
                    .customerVendorName(invoice.getVendor().getName())
                    .debitAmount(invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO)
                    .creditAmount(BigDecimal.ZERO)
                    .transactionContent("Hóa đơn phải trả: " + invoice.getInvoiceNo())
                    .transactionDate(invoice.getInvoiceDate())
                    .transactionType("AP_INVOICE")
                    .referenceNo(invoice.getInvoiceNo())
                    .build();

            // Filter by keyword if provided
            if (keyword == null || keyword.isEmpty() || matchesKeyword(dto, keyword)) {
                transactions.add(dto);
            }
        }

        // 2. Lấy AP Payments (Vendor - thanh toán đã trả)
        List<APPayment> apPayments = apPaymentRepository.findAll();
        for (APPayment payment : apPayments) {
            if (payment.getApInvoice() == null || payment.getApInvoice().getVendor() == null) continue;
            if (payment.getApInvoice().getDeletedAt() != null) continue; // Skip if invoice is deleted

            LocalDate paymentDate = convertToLocalDate(payment.getPaymentDate());

            DebtTransactionResponseDTO dto = DebtTransactionResponseDTO.builder()
                    .id(payment.getApPaymentId().longValue())
                    .customerVendorCode(payment.getApInvoice().getVendor().getVendorCode())
                    .customerVendorType("Vendor")
                    .customerVendorName(payment.getApInvoice().getVendor().getName())
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO)
                    .transactionContent("Thanh toán cho: " + payment.getApInvoice().getInvoiceNo() +
                            (payment.getReferenceNo() != null ? " - " + payment.getReferenceNo() : ""))
                    .transactionDate(paymentDate)
                    .transactionType("AP_PAYMENT")
                    .referenceNo(payment.getReferenceNo() != null ? payment.getReferenceNo() : payment.getApInvoice().getInvoiceNo())
                    .build();

            // Filter by keyword if provided
            if (keyword == null || keyword.isEmpty() || matchesKeyword(dto, keyword)) {
                transactions.add(dto);
            }
        }

        // 3. Lấy AR Invoices (Customer - công nợ phải thu)
        List<ARInvoice> arInvoices = arInvoiceRepository.findAllActiveInvoices();
        for (ARInvoice invoice : arInvoices) {
            if (invoice.getCustomer() == null) continue;

            DebtTransactionResponseDTO dto = DebtTransactionResponseDTO.builder()
                    .id(invoice.getArInvoiceId().longValue())
                    .customerVendorCode(invoice.getCustomer().getCustomerCode())
                    .customerVendorType("Customer")
                    .customerVendorName(invoice.getCustomer().getFirstName() + " " + invoice.getCustomer().getLastName())
                    .debitAmount(invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO)
                    .creditAmount(BigDecimal.ZERO)
                    .transactionContent("Hóa đơn phải thu: " + invoice.getInvoiceNo())
                    .transactionDate(invoice.getInvoiceDate())
                    .transactionType("AR_INVOICE")
                    .referenceNo(invoice.getInvoiceNo())
                    .build();

            // Filter by keyword if provided
            if (keyword == null || keyword.isEmpty() || matchesKeyword(dto, keyword)) {
                transactions.add(dto);
            }
        }

        // 4. Lấy AR Payments (Customer - thanh toán đã thu)
        List<ARPayment> arPayments = arPaymentRepository.findAll();
        for (ARPayment payment : arPayments) {
            if (payment.getInvoice() == null || payment.getInvoice().getCustomer() == null) continue;
            if (payment.getInvoice().getDeletedAt() != null) continue; // Skip if invoice is deleted

            LocalDate paymentDate = convertInstantToLocalDate(payment.getPaymentDate());

            DebtTransactionResponseDTO dto = DebtTransactionResponseDTO.builder()
                    .id(payment.getArPaymentId().longValue())
                    .customerVendorCode(payment.getInvoice().getCustomer().getCustomerCode())
                    .customerVendorType("Customer")
                    .customerVendorName(payment.getInvoice().getCustomer().getFirstName() + " " +
                            payment.getInvoice().getCustomer().getLastName())
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO)
                    .transactionContent("Thanh toán từ: " + payment.getInvoice().getInvoiceNo() +
                            (payment.getReferenceNo() != null ? " - " + payment.getReferenceNo() : ""))
                    .transactionDate(paymentDate)
                    .transactionType("AR_PAYMENT")
                    .referenceNo(payment.getReferenceNo() != null ? payment.getReferenceNo() : payment.getInvoice().getInvoiceNo())
                    .build();

            // Filter by keyword if provided
            if (keyword == null || keyword.isEmpty() || matchesKeyword(dto, keyword)) {
                transactions.add(dto);
            }
        }

        return transactions;
    }

    /**
     * Kiểm tra transaction có match với keyword không
     */
    private boolean matchesKeyword(DebtTransactionResponseDTO dto, String keyword) {
        if (keyword == null || keyword.isEmpty()) return true;

        String lowerKeyword = keyword.toLowerCase();
        return (dto.getCustomerVendorCode() != null && dto.getCustomerVendorCode().toLowerCase().contains(lowerKeyword)) ||
                (dto.getCustomerVendorName() != null && dto.getCustomerVendorName().toLowerCase().contains(lowerKeyword)) ||
                (dto.getTransactionContent() != null && dto.getTransactionContent().toLowerCase().contains(lowerKeyword)) ||
                (dto.getReferenceNo() != null && dto.getReferenceNo().toLowerCase().contains(lowerKeyword));
    }

    /**
     * Convert LocalDateTime to LocalDate
     */
    private LocalDate convertToLocalDate(LocalDateTime dateTime) {
        if (dateTime == null) return LocalDate.now();
        return dateTime.toLocalDate();
    }

    /**
     * Convert Instant to LocalDate
     */
    private LocalDate convertInstantToLocalDate(Instant instant) {
        if (instant == null) return LocalDate.now();
        return instant.atZone(ZoneId.systemDefault()).toLocalDate();
    }

    /**
     * Sort transactions theo Sort object
     */
    private List<DebtTransactionResponseDTO> sortTransactions(List<DebtTransactionResponseDTO> transactions, Sort sort) {
        if (sort == null || sort.isUnsorted()) {
            // Default sort by transactionDate desc
            return transactions.stream()
                    .sorted(Comparator.comparing(
                            DebtTransactionResponseDTO::getTransactionDate,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(Collectors.toList());
        }

        Comparator<DebtTransactionResponseDTO> comparator = null;

        for (Sort.Order order : sort) {
            Comparator<DebtTransactionResponseDTO> orderComparator = getComparator(order.getProperty(), order.getDirection());
            if (comparator == null) {
                comparator = orderComparator;
            } else {
                comparator = comparator.thenComparing(orderComparator);
            }
        }

        return transactions.stream()
                .sorted(comparator != null ? comparator :
                        Comparator.comparing(DebtTransactionResponseDTO::getTransactionDate,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    /**
     * Tạo Comparator cho từng field
     */
    private Comparator<DebtTransactionResponseDTO> getComparator(String property, Sort.Direction direction) {
        Comparator<DebtTransactionResponseDTO> comparator = null;

        switch (property.toLowerCase()) {
            case "id":
                comparator = Comparator.comparing(d -> d.getId() != null ? d.getId() : 0L);
                break;
            case "customervendorcode":
                comparator = Comparator.comparing(
                        d -> d.getCustomerVendorCode() != null ? d.getCustomerVendorCode() : "",
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
                break;
            case "debitamount":
                comparator = Comparator.comparing(
                        d -> d.getDebitAmount() != null ? d.getDebitAmount() : BigDecimal.ZERO,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "creditamount":
                comparator = Comparator.comparing(
                        d -> d.getCreditAmount() != null ? d.getCreditAmount() : BigDecimal.ZERO,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "transactiondate":
                comparator = Comparator.comparing(
                        DebtTransactionResponseDTO::getTransactionDate,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            default:
                comparator = Comparator.comparing(
                        DebtTransactionResponseDTO::getTransactionDate,
                        Comparator.nullsLast(Comparator.reverseOrder()));
        }

        return direction == Sort.Direction.DESC ? comparator.reversed() : comparator;
    }

    /**
     * Paginate transactions manually
     */
    private Page<DebtTransactionResponseDTO> paginateTransactions(
            List<DebtTransactionResponseDTO> allTransactions, Pageable pageable) {

        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int start = page * size;
        int end = Math.min(start + size, allTransactions.size());

        List<DebtTransactionResponseDTO> pageContent = start < allTransactions.size()
                ? allTransactions.subList(start, end)
                : new ArrayList<>();

        return new PageImpl<>(pageContent, pageable, allTransactions.size());
    }
}
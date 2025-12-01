package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.entity.CustomerBalance;
import com.g174.mmssystem.repository.CustomerBalanceRepository;
import com.g174.mmssystem.repository.CustomerRepository;
import com.g174.mmssystem.repository.ARInvoiceRepository;
import com.g174.mmssystem.repository.ARPaymentRepository;
import com.g174.mmssystem.repository.CreditNoteRepository;
import com.g174.mmssystem.service.IService.ICustomerBalanceService;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CustomerBalanceServiceImpl implements ICustomerBalanceService {

    private final CustomerBalanceRepository customerBalanceRepository;
    private final CustomerRepository customerRepository;
    private final ARInvoiceRepository arInvoiceRepository;
    private final ARPaymentRepository arPaymentRepository;
    private final CreditNoteRepository creditNoteRepository;

    @Override
    public CustomerBalance getOrCreateBalance(Integer customerId) {
        return customerBalanceRepository.findByCustomer_CustomerId(customerId)
                .orElseGet(() -> {
                    CustomerBalance balance = new CustomerBalance();
                    balance.setCustomer(customerRepository.findById(customerId)
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy customer ID: " + customerId)));
                    balance.setTotalInvoiced(BigDecimal.ZERO);
                    balance.setTotalPaid(BigDecimal.ZERO);
                    balance.setTotalCreditNote(BigDecimal.ZERO);
                    balance.setOutstandingBalance(BigDecimal.ZERO);
                    return customerBalanceRepository.save(balance);
                });
    }

    @Override
    public void updateOnInvoiceCreated(Integer customerId, BigDecimal invoiceAmount) {
        CustomerBalance balance = getOrCreateBalance(customerId);
        balance.setTotalInvoiced(balance.getTotalInvoiced().add(invoiceAmount));
        balance.recalculateOutstandingBalance();
        customerBalanceRepository.save(balance);
        log.info("Updated customer {} balance: +{} invoice", customerId, invoiceAmount);
    }

    @Override
    public void updateOnInvoiceDeleted(Integer customerId, BigDecimal invoiceAmount) {
        CustomerBalance balance = getOrCreateBalance(customerId);
        balance.setTotalInvoiced(balance.getTotalInvoiced().subtract(invoiceAmount).max(BigDecimal.ZERO));
        balance.recalculateOutstandingBalance();
        customerBalanceRepository.save(balance);
        log.info("Updated customer {} balance: -{} invoice", customerId, invoiceAmount);
    }

    @Override
    public void updateOnPaymentAdded(Integer customerId, BigDecimal paymentAmount) {
        CustomerBalance balance = getOrCreateBalance(customerId);
        balance.setTotalPaid(balance.getTotalPaid().add(paymentAmount));
        balance.recalculateOutstandingBalance();
        customerBalanceRepository.save(balance);
        log.info("Updated customer {} balance: +{} payment", customerId, paymentAmount);
    }

    @Override
    public void updateOnPaymentDeleted(Integer customerId, BigDecimal paymentAmount) {
        CustomerBalance balance = getOrCreateBalance(customerId);
        balance.setTotalPaid(balance.getTotalPaid().subtract(paymentAmount).max(BigDecimal.ZERO));
        balance.recalculateOutstandingBalance();
        customerBalanceRepository.save(balance);
        log.info("Updated customer {} balance: -{} payment", customerId, paymentAmount);
    }

    @Override
    public void updateOnCreditNoteApplied(Integer customerId, BigDecimal creditNoteAmount) {
        CustomerBalance balance = getOrCreateBalance(customerId);
        balance.setTotalCreditNote(balance.getTotalCreditNote().add(creditNoteAmount));
        balance.recalculateOutstandingBalance();
        customerBalanceRepository.save(balance);
        log.info("Updated customer {} balance: +{} credit note", customerId, creditNoteAmount);
    }

    @Override
    public void updateOnCreditNoteRemoved(Integer customerId, BigDecimal creditNoteAmount) {
        CustomerBalance balance = getOrCreateBalance(customerId);
        balance.setTotalCreditNote(balance.getTotalCreditNote().subtract(creditNoteAmount).max(BigDecimal.ZERO));
        balance.recalculateOutstandingBalance();
        customerBalanceRepository.save(balance);
        log.info("Updated customer {} balance: -{} credit note", customerId, creditNoteAmount);
    }

    @Override
    public void recalculateBalance(Integer customerId) {
        CustomerBalance balance = getOrCreateBalance(customerId);

        // Tính tổng từ tất cả Invoice
        BigDecimal totalInvoiced = arInvoiceRepository.findAllActiveInvoices().stream()
                .filter(inv -> inv.getCustomer().getCustomerId().equals(customerId))
                .map(inv -> inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tính tổng từ tất cả Payment của customer
        BigDecimal totalPaid = arPaymentRepository.getTotalPaidByCustomerId(customerId);
        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }

        // Tính tổng từ tất cả Credit Note đã áp dụng của customer
        BigDecimal totalCreditNote = creditNoteRepository.findByCustomerIdAndDeletedAtIsNull(customerId).stream()
                .filter(cn -> cn.getStatus() == com.g174.mmssystem.entity.CreditNote.CreditNoteStatus.Issued ||
                             cn.getStatus() == com.g174.mmssystem.entity.CreditNote.CreditNoteStatus.Applied)
                .map(cn -> cn.getTotalAmount() != null ? cn.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        balance.setTotalInvoiced(totalInvoiced);
        balance.setTotalPaid(totalPaid);
        balance.setTotalCreditNote(totalCreditNote);
        balance.recalculateOutstandingBalance();
        customerBalanceRepository.save(balance);

        log.info("Recalculated balance for customer {}: invoiced={}, paid={}, creditNote={}, outstanding={}",
                customerId, totalInvoiced, totalPaid, totalCreditNote, balance.getOutstandingBalance());
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getOutstandingBalance(Integer customerId) {
        return customerBalanceRepository.findByCustomer_CustomerId(customerId)
                .map(CustomerBalance::getOutstandingBalance)
                .orElse(BigDecimal.ZERO);
    }
}


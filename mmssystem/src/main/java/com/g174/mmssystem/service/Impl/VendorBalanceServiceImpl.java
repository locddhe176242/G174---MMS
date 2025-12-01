package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.entity.VendorBalance;
import com.g174.mmssystem.repository.VendorBalanceRepository;
import com.g174.mmssystem.repository.VendorRepository;
import com.g174.mmssystem.repository.APInvoiceRepository;
import com.g174.mmssystem.repository.APPaymentRepository;
import com.g174.mmssystem.service.IService.IVendorBalanceService;
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
public class VendorBalanceServiceImpl implements IVendorBalanceService {

    private final VendorBalanceRepository vendorBalanceRepository;
    private final VendorRepository vendorRepository;
    private final APInvoiceRepository apInvoiceRepository;
    private final APPaymentRepository apPaymentRepository;

    @Override
    public VendorBalance getOrCreateBalance(Integer vendorId) {
        return vendorBalanceRepository.findByVendor_VendorId(vendorId)
                .orElseGet(() -> {
                    VendorBalance balance = new VendorBalance();
                    balance.setVendor(vendorRepository.findById(vendorId)
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vendor ID: " + vendorId)));
                    balance.setTotalInvoiced(BigDecimal.ZERO);
                    balance.setTotalPaid(BigDecimal.ZERO);
                    balance.setOutstandingBalance(BigDecimal.ZERO);
                    return vendorBalanceRepository.save(balance);
                });
    }

    @Override
    public void updateOnInvoiceCreated(Integer vendorId, BigDecimal invoiceAmount) {
        VendorBalance balance = getOrCreateBalance(vendorId);
        balance.setTotalInvoiced(balance.getTotalInvoiced().add(invoiceAmount));
        balance.recalculateOutstandingBalance();
        vendorBalanceRepository.save(balance);
        log.info("Updated vendor {} balance: +{} invoice", vendorId, invoiceAmount);
    }

    @Override
    public void updateOnInvoiceDeleted(Integer vendorId, BigDecimal invoiceAmount) {
        VendorBalance balance = getOrCreateBalance(vendorId);
        balance.setTotalInvoiced(balance.getTotalInvoiced().subtract(invoiceAmount).max(BigDecimal.ZERO));
        balance.recalculateOutstandingBalance();
        vendorBalanceRepository.save(balance);
        log.info("Updated vendor {} balance: -{} invoice", vendorId, invoiceAmount);
    }

    @Override
    public void updateOnPaymentAdded(Integer vendorId, BigDecimal paymentAmount) {
        VendorBalance balance = getOrCreateBalance(vendorId);
        balance.setTotalPaid(balance.getTotalPaid().add(paymentAmount));
        balance.recalculateOutstandingBalance();
        vendorBalanceRepository.save(balance);
        log.info("Updated vendor {} balance: +{} payment", vendorId, paymentAmount);
    }

    @Override
    public void updateOnPaymentDeleted(Integer vendorId, BigDecimal paymentAmount) {
        VendorBalance balance = getOrCreateBalance(vendorId);
        balance.setTotalPaid(balance.getTotalPaid().subtract(paymentAmount).max(BigDecimal.ZERO));
        balance.recalculateOutstandingBalance();
        vendorBalanceRepository.save(balance);
        log.info("Updated vendor {} balance: -{} payment", vendorId, paymentAmount);
    }

    @Override
    public void recalculateBalance(Integer vendorId) {
        VendorBalance balance = getOrCreateBalance(vendorId);

        // Tính tổng từ tất cả AP Invoice
        BigDecimal totalInvoiced = apInvoiceRepository.findAllActiveInvoices().stream()
                .filter(inv -> inv.getVendor().getVendorId().equals(vendorId))
                .map(inv -> inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tính tổng từ tất cả Payment của vendor
        BigDecimal totalPaid = apPaymentRepository.getTotalPaidByVendorId(vendorId);
        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }

        balance.setTotalInvoiced(totalInvoiced);
        balance.setTotalPaid(totalPaid);
        balance.recalculateOutstandingBalance();
        vendorBalanceRepository.save(balance);

        log.info("Recalculated balance for vendor {}: invoiced={}, paid={}, outstanding={}",
                vendorId, totalInvoiced, totalPaid, balance.getOutstandingBalance());
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getOutstandingBalance(Integer vendorId) {
        return vendorBalanceRepository.findByVendor_VendorId(vendorId)
                .map(VendorBalance::getOutstandingBalance)
                .orElse(BigDecimal.ZERO);
    }
}

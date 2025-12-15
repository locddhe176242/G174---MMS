package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.responseDTO.DebtTransactionResponseDTO;
import com.g174.mmssystem.service.IService.IDebtManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cho Debt Management
 * Tổng hợp công nợ từ APInvoice, APPayment, ARInvoice, ARPayment
 */
@RestController
@RequestMapping("/api/debt-transactions")
@RequiredArgsConstructor
@Slf4j
public class DebtManagementController {

    private final IDebtManagementService debtManagementService;

    /**
     * Lấy danh sách tất cả giao dịch công nợ có phân trang
     * @param pageable - Thông tin phân trang và sắp xếp
     * @return Page chứa danh sách DebtTransactionResponseDTO
     */
    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT','SALE','PURCHASE')")
    public ResponseEntity<Page<DebtTransactionResponseDTO>> getAllDebtTransactionsWithPagination(Pageable pageable) {
        log.info("REST: Fetching debt transactions with pagination - page: {}, size: {}, sort: {}",
                pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());

        Page<DebtTransactionResponseDTO> response = debtManagementService.getAllDebtTransactions(pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Tìm kiếm giao dịch công nợ có phân trang
     * @param keyword - Từ khóa tìm kiếm (mã KH/NCC, tên, nội dung giao dịch, etc.)
     * @param pageable - Thông tin phân trang và sắp xếp
     * @return Page chứa danh sách DebtTransactionResponseDTO
     */
    @GetMapping("/search/page")
    @PreAuthorize("hasAnyRole('MANAGER','ACCOUNTANT','SALE','PURCHASE')")
    public ResponseEntity<Page<DebtTransactionResponseDTO>> searchDebtTransactionsWithPagination(
            @RequestParam(required = false, defaultValue = "") String keyword,
            Pageable pageable) {
        log.info("REST: Searching debt transactions with keyword: '{}', page: {}, size: {}, sort: {}",
                keyword, pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());

        Page<DebtTransactionResponseDTO> response = debtManagementService.searchDebtTransactions(keyword, pageable);
        return ResponseEntity.ok(response);
    }
}



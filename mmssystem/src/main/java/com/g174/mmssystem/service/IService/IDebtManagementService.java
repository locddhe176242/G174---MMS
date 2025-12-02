package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.responseDTO.DebtTransactionResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface cho Debt Management
 * Tổng hợp công nợ từ APInvoice, APPayment, ARInvoice, ARPayment
 */
public interface IDebtManagementService {

    /**
     * Lấy danh sách tất cả giao dịch công nợ có phân trang
     * @param pageable - Thông tin phân trang và sắp xếp
     * @return Page chứa danh sách DebtTransactionResponseDTO
     */
    Page<DebtTransactionResponseDTO> getAllDebtTransactions(Pageable pageable);

    /**
     * Tìm kiếm giao dịch công nợ có phân trang
     * @param keyword - Từ khóa tìm kiếm (mã KH/NCC, tên, nội dung giao dịch, etc.)
     * @param pageable - Thông tin phân trang và sắp xếp
     * @return Page chứa danh sách DebtTransactionResponseDTO
     */
    Page<DebtTransactionResponseDTO> searchDebtTransactions(String keyword, Pageable pageable);
}
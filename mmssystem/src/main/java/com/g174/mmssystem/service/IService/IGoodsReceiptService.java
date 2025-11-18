package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.GoodsReceiptRequestDTO;
import com.g174.mmssystem.dto.responseDTO.GoodsReceiptResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IGoodsReceiptService {
    GoodsReceiptResponseDTO createReceipt(GoodsReceiptRequestDTO dto, Integer createdById);
    
    GoodsReceiptResponseDTO getReceiptById(Integer receiptId);
    
    List<GoodsReceiptResponseDTO> getAllReceipts();
    
    Page<GoodsReceiptResponseDTO> getAllReceipts(Pageable pageable);
    
    List<GoodsReceiptResponseDTO> searchReceipts(String keyword);
    
    Page<GoodsReceiptResponseDTO> searchReceipts(String keyword, Pageable pageable);
    
    List<GoodsReceiptResponseDTO> getReceiptsByOrderId(Integer orderId);
    
    List<GoodsReceiptResponseDTO> getReceiptsByWarehouseId(Integer warehouseId);
    
    GoodsReceiptResponseDTO updateReceipt(Integer receiptId, GoodsReceiptRequestDTO dto, Integer updatedById);
    
    GoodsReceiptResponseDTO approveReceipt(Integer receiptId, Integer approverId);
    
    GoodsReceiptResponseDTO rejectReceipt(Integer receiptId, Integer approverId, String reason);
    
    GoodsReceiptResponseDTO deleteReceipt(Integer receiptId);
    
    boolean existsByReceiptNo(String receiptNo);
    
    String generateReceiptNo();
}


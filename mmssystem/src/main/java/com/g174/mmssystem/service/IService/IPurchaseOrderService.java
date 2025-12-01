package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.PurchaseOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseOrderResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IPurchaseOrderService {
    PurchaseOrderResponseDTO createOrder(PurchaseOrderRequestDTO dto, Integer createdById);
    
    PurchaseOrderResponseDTO getOrderById(Integer orderId);
    
    List<PurchaseOrderResponseDTO> getAllOrders();
    
    Page<PurchaseOrderResponseDTO> getAllOrders(Pageable pageable);
    
    List<PurchaseOrderResponseDTO> searchOrders(String keyword);
    
    Page<PurchaseOrderResponseDTO> searchOrders(String keyword, Pageable pageable);
    
    List<PurchaseOrderResponseDTO> getOrdersByVendorId(Integer vendorId);
    
    List<PurchaseOrderResponseDTO> getOrdersByPqId(Integer pqId);
    
    PurchaseOrderResponseDTO updateOrder(Integer orderId, PurchaseOrderRequestDTO dto, Integer updatedById);
    
    PurchaseOrderResponseDTO approveOrder(Integer orderId, Integer approverId);
    
    PurchaseOrderResponseDTO rejectOrder(Integer orderId, Integer approverId, String reason);
    
    PurchaseOrderResponseDTO sendOrder(Integer orderId);
    
    PurchaseOrderResponseDTO completeOrder(Integer orderId);
    
    PurchaseOrderResponseDTO cancelOrder(Integer orderId);
    
    PurchaseOrderResponseDTO deleteOrder(Integer orderId);
    
    boolean existsByPoNo(String poNo);
    
    String generatePoNo();
}


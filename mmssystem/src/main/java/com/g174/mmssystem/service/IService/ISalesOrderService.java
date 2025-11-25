package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.SalesOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ISalesOrderService {

    SalesOrderResponseDTO createOrder(SalesOrderRequestDTO request);

    SalesOrderResponseDTO updateOrder(Integer id, SalesOrderRequestDTO request);

    SalesOrderResponseDTO getOrder(Integer id);

    Page<SalesOrderListResponseDTO> getOrders(Integer customerId, String status, String approvalStatus, String keyword, Pageable pageable);

    void deleteOrder(Integer id);

    SalesOrderResponseDTO changeStatus(Integer id, String status, String approvalStatus);

    SalesOrderResponseDTO changeApprovalStatus(Integer id, String approvalStatus);

    SalesOrderResponseDTO createFromQuotation(Integer quotationId);
}


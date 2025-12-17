package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.SalesOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesOrderResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ISalesOrderService {

    SalesOrderResponseDTO createOrder(SalesOrderRequestDTO request);

    SalesOrderResponseDTO updateOrder(Integer id, SalesOrderRequestDTO request);

    SalesOrderResponseDTO getOrder(Integer id);

    Page<SalesOrderListResponseDTO> getOrders(Integer customerId, String status, String keyword, Pageable pageable);

    List<SalesOrderListResponseDTO> getAllOrders(Integer customerId, String status, String keyword);

    void deleteOrder(Integer id);

    SalesOrderResponseDTO sendToCustomer(Integer id);

    SalesOrderResponseDTO createFromQuotation(Integer quotationId);
}

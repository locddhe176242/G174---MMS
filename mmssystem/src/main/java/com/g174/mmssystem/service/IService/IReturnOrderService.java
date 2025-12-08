package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.ReturnOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.ReturnOrderListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.ReturnOrderResponseDTO;

import java.util.List;

public interface IReturnOrderService {

    ReturnOrderResponseDTO createReturnOrder(ReturnOrderRequestDTO request);

    ReturnOrderResponseDTO updateReturnOrder(Integer id, ReturnOrderRequestDTO request);

    ReturnOrderResponseDTO getReturnOrder(Integer id);

    List<ReturnOrderListResponseDTO> getAllReturnOrders(Integer deliveryId, Integer invoiceId, String status, String keyword);

    void deleteReturnOrder(Integer id);

    ReturnOrderResponseDTO changeStatus(Integer id, String status);
}


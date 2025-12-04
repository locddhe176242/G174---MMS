package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.SalesReturnInboundOrderRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesReturnInboundOrderResponseDTO;

import java.util.List;

public interface ISalesReturnInboundOrderService {

    /**
     * Tạo Đơn nhập hàng lại (Sales Return Inbound Order) từ Đơn trả hàng.
     */
    SalesReturnInboundOrderResponseDTO createFromReturnOrder(SalesReturnInboundOrderRequestDTO request);

    /**
     * Lấy chi tiết một Đơn nhập hàng lại.
     */
    SalesReturnInboundOrderResponseDTO getById(Integer sriId);

    /**
     * Lấy danh sách tất cả Đơn nhập hàng lại (đang active).
     */
    List<SalesReturnInboundOrderResponseDTO> getAll();

    /**
     * Lấy danh sách Đơn nhập hàng lại theo một Đơn trả hàng.
     */
    List<SalesReturnInboundOrderResponseDTO> getByReturnOrder(Integer roId);
}



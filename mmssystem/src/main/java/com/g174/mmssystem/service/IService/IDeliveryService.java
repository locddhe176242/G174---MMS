package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.DeliveryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.DeliveryListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.DeliveryResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IDeliveryService {

    DeliveryResponseDTO createDelivery(DeliveryRequestDTO request);

    DeliveryResponseDTO updateDelivery(Integer id, DeliveryRequestDTO request);

    DeliveryResponseDTO getDelivery(Integer id);

    Page<DeliveryListResponseDTO> getDeliveries(Integer salesOrderId, Integer customerId, String status, String keyword, Pageable pageable);

    List<DeliveryListResponseDTO> getAllDeliveries(Integer salesOrderId, Integer customerId, String status, String keyword);

    void deleteDelivery(Integer id);

    DeliveryResponseDTO changeStatus(Integer id, String status);

    DeliveryResponseDTO createFromSalesOrder(Integer salesOrderId);
}

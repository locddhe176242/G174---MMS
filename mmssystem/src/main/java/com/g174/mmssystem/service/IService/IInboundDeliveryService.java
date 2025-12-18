package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.InboundDeliveryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.InboundDeliveryListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.InboundDeliveryResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IInboundDeliveryService {

    /**
     * Tạo Inbound Delivery từ Purchase Order
     */
    InboundDeliveryResponseDTO createInboundDelivery(InboundDeliveryRequestDTO requestDTO);

    /**
     * Tạo Inbound Delivery từ Purchase Order (auto convert từ PO)
     */
    InboundDeliveryResponseDTO createFromPurchaseOrder(Integer orderId);

    /**
     * Lấy thông tin chi tiết Inbound Delivery
     */
    InboundDeliveryResponseDTO getInboundDeliveryById(Integer inboundDeliveryId);

    /**
     * Lấy tất cả Inbound Deliveries với phân trang
     */
    Page<InboundDeliveryListResponseDTO> getAllInboundDeliveries(Pageable pageable);

    /**
     * Lấy tất cả Inbound Deliveries dạng list (không phân trang)
     */
    List<InboundDeliveryListResponseDTO> getAllInboundDeliveriesList();

    /**
     * Tìm kiếm Inbound Deliveries
     */
    Page<InboundDeliveryListResponseDTO> searchInboundDeliveries(String keyword, Pageable pageable);

    /**
     * Lấy danh sách Inbound Deliveries theo Purchase Order
     */
    List<InboundDeliveryResponseDTO> getInboundDeliveriesByOrderId(Integer orderId);

    /**
     * Lấy danh sách Inbound Deliveries theo Warehouse
     */
    List<InboundDeliveryResponseDTO> getInboundDeliveriesByWarehouseId(Integer warehouseId);

    /**
     * Lấy danh sách Inbound Deliveries theo Vendor
     */
    List<InboundDeliveryResponseDTO> getInboundDeliveriesByVendorId(Integer vendorId);

    /**
     * Cập nhật Inbound Delivery
     */
    InboundDeliveryResponseDTO updateInboundDelivery(Integer inboundDeliveryId, InboundDeliveryRequestDTO requestDTO);

    /**
     * Cập nhật trạng thái Inbound Delivery
     */
    InboundDeliveryResponseDTO updateStatus(Integer inboundDeliveryId, String status);

    /**
     * Xóa mềm Inbound Delivery
     */
    void deleteInboundDelivery(Integer inboundDeliveryId);

    /**
     * Hủy Inbound Delivery
     */
    InboundDeliveryResponseDTO cancelInboundDelivery(Integer inboundDeliveryId);

    /**
     * Generate unique Inbound Delivery number (không trùng kể cả với bản ghi đã xóa mềm)
     */
    String generateUniqueInboundDeliveryNo();
}

package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.responseDTO.WarehouseStockResponseDTO;

import java.math.BigDecimal;
import java.util.List;

public interface IWarehouseStockService {

    // Lấy danh sách stock trong một warehouse
    List<WarehouseStockResponseDTO> getStockByWarehouseId(Integer warehouseId);

    // Lấy stock của một product trong một warehouse
    WarehouseStockResponseDTO getStockByWarehouseAndProduct(Integer warehouseId, Integer productId);

    // Lấy tổng số lượng của một product trong tất cả warehouses
    BigDecimal getTotalQuantityByProductId(Integer productId);

    // Lấy số lượng của một product trong một warehouse cụ thể
    BigDecimal getQuantityByWarehouseAndProduct(Integer warehouseId, Integer productId);

    // Cập nhật số lượng stock (tăng/giảm)
    WarehouseStockResponseDTO updateStock(Integer warehouseId, Integer productId, BigDecimal quantity);

    // Tăng số lượng stock
    WarehouseStockResponseDTO increaseStock(Integer warehouseId, Integer productId, BigDecimal quantity);

    // Giảm số lượng stock
    WarehouseStockResponseDTO decreaseStock(Integer warehouseId, Integer productId, BigDecimal quantity);

    // Tạo hoặc cập nhật stock
    WarehouseStockResponseDTO createOrUpdateStock(Integer warehouseId, Integer productId, BigDecimal quantity);
}

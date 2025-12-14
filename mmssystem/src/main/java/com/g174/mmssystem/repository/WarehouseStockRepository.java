package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.WarehouseStock;
import com.g174.mmssystem.entity.WarehouseStockId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, WarehouseStockId> {

    /**
     * Tìm stock theo warehouse_id và product_id
     */
    Optional<WarehouseStock> findByWarehouseIdAndProductId(Integer warehouseId, Integer productId);

    /**
     * Lấy tất cả stock trong một warehouse
     */
    List<WarehouseStock> findByWarehouseId(Integer warehouseId);

    /**
     * Lấy tất cả stock của một product (trong tất cả warehouses)
     */
    List<WarehouseStock> findByProductId(Integer productId);

    /**
     * Tính tổng số lượng của một product trong tất cả warehouses
     */
    @Query("SELECT COALESCE(SUM(ws.quantity), 0) FROM WarehouseStock ws WHERE ws.productId = :productId")
    BigDecimal getTotalQuantityByProductId(@Param("productId") Integer productId);

    /**
     * Kiểm tra xem có stock trong warehouse không
     */
    boolean existsByWarehouseIdAndProductId(Integer warehouseId, Integer productId);

    /**
     * Đếm số lượng sản phẩm khác nhau trong warehouse
     */
    @Query("SELECT COUNT(DISTINCT ws.productId) FROM WarehouseStock ws WHERE ws.warehouseId = :warehouseId AND ws.quantity > 0")
    Long countDistinctProductsByWarehouseId(@Param("warehouseId") Integer warehouseId);

    /**
     * Tính tổng số lượng hàng trong warehouse
     */
    @Query("SELECT COALESCE(SUM(ws.quantity), 0) FROM WarehouseStock ws WHERE ws.warehouseId = :warehouseId")
    BigDecimal getTotalQuantityByWarehouseId(@Param("warehouseId") Integer warehouseId);

    /**
     * Update stock quantity (add to existing quantity)
     * If record doesn't exist, it will be handled by the service layer
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE WarehouseStock ws SET ws.quantity = ws.quantity + :quantityChange " +
           "WHERE ws.warehouseId = :warehouseId AND ws.productId = :productId")
    int updateStockQuantity(@Param("warehouseId") Integer warehouseId,
                            @Param("productId") Integer productId,
                            @Param("quantityChange") BigDecimal quantityChange);
}

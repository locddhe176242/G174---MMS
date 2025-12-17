package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.responseDTO.WarehouseStockResponseDTO;
import com.g174.mmssystem.entity.Product;
import com.g174.mmssystem.entity.Warehouse;
import com.g174.mmssystem.entity.WarehouseStock;
import com.g174.mmssystem.entity.WarehouseStockId;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.repository.ProductRepository;
import com.g174.mmssystem.repository.WarehouseRepository;
import com.g174.mmssystem.repository.WarehouseStockRepository;
import com.g174.mmssystem.service.IService.IWarehouseStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WarehouseStockServiceImpl implements IWarehouseStockService {

    private final WarehouseStockRepository warehouseStockRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseStockResponseDTO> getStockByWarehouseId(Integer warehouseId) {
        List<WarehouseStock> stocks = warehouseStockRepository.findByWarehouseIdWithProductAndCategory(warehouseId);
        return stocks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseStockResponseDTO getStockByWarehouseAndProduct(Integer warehouseId, Integer productId) {
        WarehouseStock stock = warehouseStockRepository
                .findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Stock not found for warehouse ID: " + warehouseId + " and product ID: " + productId));
        return convertToDTO(stock);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalQuantityByProductId(Integer productId) {
        BigDecimal total = warehouseStockRepository.getTotalQuantityByProductId(productId);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getQuantityByWarehouseAndProduct(Integer warehouseId, Integer productId) {
        return warehouseStockRepository
                .findByWarehouseIdAndProductId(warehouseId, productId)
                .map(WarehouseStock::getQuantity)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    public WarehouseStockResponseDTO updateStock(Integer warehouseId, Integer productId, BigDecimal quantity) {
        if (quantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }

        WarehouseStock stock = warehouseStockRepository
                .findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseGet(() -> {
                    // Tạo mới nếu chưa có
                    Warehouse warehouse = warehouseRepository.findById(warehouseId)
                            .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + warehouseId));
                    Product product = productRepository.findById(productId)
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

                    WarehouseStock newStock = new WarehouseStock();
                    newStock.setWarehouseId(warehouseId);
                    newStock.setProductId(productId);
                    newStock.setWarehouse(warehouse);
                    newStock.setProduct(product);
                    newStock.setQuantity(BigDecimal.ZERO);
                    return newStock;
                });

        stock.setQuantity(quantity);
        WarehouseStock saved = warehouseStockRepository.save(stock);
        log.info("Updated stock for warehouse ID: {} and product ID: {} to quantity: {}",
                warehouseId, productId, quantity);
        return convertToDTO(saved);
    }

    @Override
    public WarehouseStockResponseDTO increaseStock(Integer warehouseId, Integer productId, BigDecimal quantity) {
        if (quantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Quantity to increase cannot be negative");
        }

        WarehouseStock stock = warehouseStockRepository
                .findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseGet(() -> {
                    Warehouse warehouse = warehouseRepository.findById(warehouseId)
                            .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + warehouseId));
                    Product product = productRepository.findById(productId)
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

                    WarehouseStock newStock = new WarehouseStock();
                    newStock.setWarehouseId(warehouseId);
                    newStock.setProductId(productId);
                    newStock.setWarehouse(warehouse);
                    newStock.setProduct(product);
                    newStock.setQuantity(BigDecimal.ZERO);
                    return newStock;
                });

        stock.setQuantity(stock.getQuantity().add(quantity));
        WarehouseStock saved = warehouseStockRepository.save(stock);
        log.info("Increased stock for warehouse ID: {} and product ID: {} by quantity: {}",
                warehouseId, productId, quantity);
        return convertToDTO(saved);
    }

    @Override
    public WarehouseStockResponseDTO decreaseStock(Integer warehouseId, Integer productId, BigDecimal quantity) {
        if (quantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Quantity to decrease cannot be negative");
        }

        WarehouseStock stock = warehouseStockRepository
                .findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseGet(() -> {
                    // Tạo mới nếu chưa có (giống increaseStock)
                    Warehouse warehouse = warehouseRepository.findById(warehouseId)
                            .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + warehouseId));
                    Product product = productRepository.findById(productId)
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

                    WarehouseStock newStock = new WarehouseStock();
                    newStock.setWarehouseId(warehouseId);
                    newStock.setProductId(productId);
                    newStock.setWarehouse(warehouse);
                    newStock.setProduct(product);
                    newStock.setQuantity(BigDecimal.ZERO);
                    return newStock;
                });

        BigDecimal newQuantity = stock.getQuantity().subtract(quantity);
        if (newQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Không đủ số lượng trong kho. Số lượng hiện có: " + stock.getQuantity() + ", Yêu cầu: " + quantity);
        }

        stock.setQuantity(newQuantity);
        WarehouseStock saved = warehouseStockRepository.save(stock);
        log.info("Đã trừ {} sản phẩm ID {} ra khỏi kho ID {}. Số lượng còn lại: {}",
                quantity, productId, warehouseId, newQuantity);
        return convertToDTO(saved);
    }

    @Override
    public WarehouseStockResponseDTO createOrUpdateStock(Integer warehouseId, Integer productId, BigDecimal quantity) {
        return updateStock(warehouseId, productId, quantity);
    }

    private WarehouseStockResponseDTO convertToDTO(WarehouseStock stock) {
        Product product = stock.getProduct();
        return WarehouseStockResponseDTO.builder()
                .warehouseId(stock.getWarehouseId())
                .warehouseCode(stock.getWarehouse() != null ? stock.getWarehouse().getCode() : null)
                .warehouseName(stock.getWarehouse() != null ? stock.getWarehouse().getName() : null)
                .productId(stock.getProductId())
                .productSku(product != null ? product.getSku() : null)
                .productName(product != null ? product.getName() : null)
                .productUom(product != null ? product.getUom() : null)
                .productSellingPrice(product != null ? product.getSellingPrice() : null)
                .productPurchasePrice(product != null ? product.getPurchasePrice() : null)
                .productCategoryName(product != null && product.getCategory() != null ? product.getCategory().getName() : null)
                .productStatus(product != null && product.getStatus() != null ? product.getStatus().name() : null)
                .quantity(stock.getQuantity())
                .build();
    }
}

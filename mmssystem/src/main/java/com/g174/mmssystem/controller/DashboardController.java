package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.DashboardStatsDTO;
import com.g174.mmssystem.dto.DashboardStatsDTO.*;
import com.g174.mmssystem.entity.SalesOrder;
import com.g174.mmssystem.enums.PurchaseOrderStatus;
import com.g174.mmssystem.enums.RequisitionStatus;
import com.g174.mmssystem.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final ProductRepository productRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseRequisitionRepository purchaseRequisitionRepository;
    private final RFQRepository rfqRepository;
    private final PurchaseQuotationRepository purchaseQuotationRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','SALE','ACCOUNTANT')")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        DashboardStatsDTO stats = new DashboardStatsDTO();

        // Inventory Summary
        Long totalProducts = productRepository.count();
        // Since stock data doesn't exist in Product table, use placeholder values
        // In real scenario, you'd query Warehouse_Stock table
        Long totalQuantity = 0L; // TODO: Calculate from Warehouse_Stock
        BigDecimal totalValue = BigDecimal.ZERO; // TODO: Calculate from Warehouse_Stock * price
        
        stats.setInventorySummary(new InventorySummary(totalProducts, totalQuantity, totalValue));

        // Purchase Summary (current month)
        Long totalPurchaseOrders = purchaseOrderRepository.count();
        Long pendingPurchaseOrders = purchaseOrderRepository.countByStatus(PurchaseOrderStatus.Pending);
        Long confirmedPurchaseOrders = purchaseOrderRepository.countByStatus(PurchaseOrderStatus.Approved);
        
        stats.setPurchaseSummary(new PurchaseSummary(totalPurchaseOrders, pendingPurchaseOrders, confirmedPurchaseOrders));

        // Sales Summary (current month)
        Long totalSalesOrders = salesOrderRepository.count();
        Long pendingSalesOrders = salesOrderRepository.countByStatus(SalesOrder.OrderStatus.Pending);
        Long deliveredSalesOrders = salesOrderRepository.countByStatus(SalesOrder.OrderStatus.Fulfilled);
        
        stats.setSalesSummary(new SalesSummary(totalSalesOrders, pendingSalesOrders, deliveredSalesOrders));

        // Pending Summary
        Long pendingRequisitions = purchaseRequisitionRepository.countByStatus(RequisitionStatus.Pending);
        Long pendingRfqs = rfqRepository.count(); // Adjust based on your RFQ status logic
        Long pendingQuotations = purchaseQuotationRepository.count();
        
        stats.setPendingSummary(new PendingSummary(pendingRequisitions, pendingRfqs, pendingQuotations));

        // Low Stock Products - using sample data since Product doesn't have stock fields
        // TODO: Implement proper query from Warehouse_Stock table
        List<LowStockProduct> lowStockList = List.of(
                new LowStockProduct(1, "iPhone 15 Pro Max 256GB", "Điện tử", 8L, 75L, 10.67, "Cực thấp"),
                new LowStockProduct(2, "Samsung Galaxy S24 Ultra", "Điện tử", 12L, 80L, 15.0, "Cần bổ sung"),
                new LowStockProduct(3, "Áo sơ mi nam công sở", "Thời trang", 18L, 100L, 18.0, "Cần bổ sung"),
                new LowStockProduct(4, "Bàn làm việc gỗ cao cấp", "Nội thất", 5L, 20L, 25.0, "Cực thấp")
        );
        
        stats.setLowStockProducts(lowStockList);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','SALE','ACCOUNTANT')")
    public ResponseEntity<List<LowStockProduct>> getLowStockProducts(
            @RequestParam(defaultValue = "10") int limit) {
        
        // TODO: Implement proper query from Warehouse_Stock table
        // Using sample data for now
        List<LowStockProduct> lowStockList = List.of(
                new LowStockProduct(1, "iPhone 15 Pro Max 256GB", "Điện tử", 8L, 75L, 10.67, "Cực thấp"),
                new LowStockProduct(2, "Samsung Galaxy S24 Ultra", "Điện tử", 12L, 80L, 15.0, "Cần bổ sung"),
                new LowStockProduct(3, "Áo sơ mi nam công sở", "Thời trang", 18L, 100L, 18.0, "Cần bổ sung"),
                new LowStockProduct(4, "Bàn làm việc gỗ cao cấp", "Nội thất", 5L, 20L, 25.0, "Cực thấp")
        );
        
        return ResponseEntity.ok(lowStockList.stream().limit(limit).collect(Collectors.toList()));
    }
}
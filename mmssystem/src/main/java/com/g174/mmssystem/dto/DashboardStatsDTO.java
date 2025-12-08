package com.g174.mmssystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    
    // Summary cards
    private InventorySummary inventorySummary;
    private PurchaseSummary purchaseSummary;
    private SalesSummary salesSummary;
    private PendingSummary pendingSummary;
    
    // Low stock products
    private List<LowStockProduct> lowStockProducts;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventorySummary {
        private Long totalProducts;
        private Long totalQuantity;
        private BigDecimal totalValue;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseSummary {
        private Long totalOrders;
        private Long pendingOrders;
        private Long confirmedOrders;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesSummary {
        private Long totalOrders;
        private Long pendingOrders;
        private Long deliveredOrders;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingSummary {
        private Long pendingRequisitions;
        private Long pendingRfqs;
        private Long pendingQuotations;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LowStockProduct {
        private Integer productId;
        private String productName;
        private String categoryName;
        private Long currentStock;
        private Long minStock;
        private Double stockPercentage;
        private String status; // "Cực thấp", "Cần bổ sung", "Thời trang"
    }
}

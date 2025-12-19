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
    
    // Monthly import/export statistics
    private List<MonthlyImportExport> monthlyImportExport;
    
    // Weekly import/export statistics (last 4 weeks)
    private List<WeeklyImportExport> weeklyImportExport;
    
    // Daily import/export statistics (last 7 days)
    private List<DailyImportExport> dailyImportExport;
    
    // Top warehouses by revenue
    private List<WarehouseRevenue> topWarehouses;
    
    // Warehouse pending tasks (for WAREHOUSE role)
    private List<PendingDelivery> pendingDeliveries;
    private WarehouseActivity todayActivity;
    
    // Accounting data (for ACCOUNTING role)
    private List<PendingAPInvoice> pendingAPInvoices;
    private List<OverdueARInvoice> overdueARInvoices;
    private AccountingSummary accountingSummary;
    
    // Approval summary (for MANAGER role)
    private ApprovalSummary approvalSummary;
    
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
        private BigDecimal totalRevenue;
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
        private String warehouseName;
        private String warehouseCode;
        private Long currentStock;
        private Long minStock;
        private Double stockPercentage;
        private String status; // "Hết hàng", "Cực thấp", "Cần bổ sung"
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyImportExport {
        private String month; // Format: "2024-01"
        private Long importQuantity;
        private BigDecimal importValue;
        private Long exportQuantity;
        private BigDecimal exportValue;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyImportExport {
        private String week; // Format: "T1", "T2", "T3", "T4"
        private String weekLabel; // Format: "dd/MM"
        private Long importQuantity; // Số phiếu nhập kho
        private Long exportQuantity; // Số phiếu xuất kho
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyImportExport {
        private String date; // Format: "dd/MM"
        private Long importCount; // Số phiếu nhập kho
        private Long exportCount; // Số phiếu xuất kho
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WarehouseRevenue {
        private Integer warehouseId;
        private String warehouseName;
        private String warehouseCode;
        private BigDecimal totalRevenue;
        private Long totalOrders;
        private Long totalQuantity;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingDelivery {
        private Integer deliveryId;
        private String deliveryNo;
        private String salesOrderNo;
        private String customerName;
        private Integer totalItems;
        private String status;
        private String expectedDate;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WarehouseActivity {
        private Long todayGoodsReceipts;
        private Long todayGoodIssues;
        private Long pendingGoodsReceipts;
        private Long pendingGoodIssues;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingAPInvoice {
        private Integer apInvoiceId;
        private String invoiceNo;
        private String vendorName;
        private BigDecimal totalAmount;
        private BigDecimal balanceAmount;
        private String dueDate;
        private String status;
        private Integer daysUntilDue;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverdueARInvoice {
        private Integer arInvoiceId;
        private String invoiceNo;
        private String customerName;
        private BigDecimal totalAmount;
        private BigDecimal balanceAmount;
        private String dueDate;
        private String status;
        private Integer daysOverdue;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountingSummary {
        private BigDecimal totalAccountsPayable;
        private BigDecimal totalAccountsReceivable;
        private Integer pendingAPInvoicesCount;
        private Integer overdueARInvoicesCount;
        private BigDecimal upcomingPayments7Days;
        private BigDecimal overdueReceivables;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalSummary {
        private Long pendingApprovals;
        private Long pendingPurchaseQuotations;
        private Long pendingPurchaseOrders;
        private Long pendingSalesOrders;
    }
}

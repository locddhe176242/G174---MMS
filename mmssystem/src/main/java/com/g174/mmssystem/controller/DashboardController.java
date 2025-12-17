package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.DashboardStatsDTO;
import com.g174.mmssystem.dto.DashboardStatsDTO.*;
import com.g174.mmssystem.dto.NotificationDTO;
import com.g174.mmssystem.dto.NotificationDTO.*;
import com.g174.mmssystem.entity.SalesOrder;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.enums.PurchaseOrderStatus;
import com.g174.mmssystem.enums.RequisitionStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import com.g174.mmssystem.repository.APInvoiceRepository;
import com.g174.mmssystem.repository.ARInvoiceRepository;
import com.g174.mmssystem.repository.DeliveryRepository;
import com.g174.mmssystem.repository.GoodIssueRepository;
import com.g174.mmssystem.repository.GoodsReceiptRepository;
import com.g174.mmssystem.repository.InboundDeliveryRepository;
import com.g174.mmssystem.repository.ProductRepository;
import com.g174.mmssystem.repository.PurchaseOrderRepository;
import com.g174.mmssystem.repository.PurchaseQuotationRepository;
import com.g174.mmssystem.repository.PurchaseRequisitionRepository;
import com.g174.mmssystem.repository.RFQRepository;
import com.g174.mmssystem.repository.SalesOrderRepository;
import com.g174.mmssystem.repository.WarehouseRepository;
import com.g174.mmssystem.repository.WarehouseStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class DashboardController {

    private final ProductRepository productRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseRequisitionRepository purchaseRequisitionRepository;
    private final RFQRepository rfqRepository;
    private final PurchaseQuotationRepository purchaseQuotationRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final GoodIssueRepository goodIssueRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseStockRepository warehouseStockRepository;
    private final InboundDeliveryRepository inboundDeliveryRepository;
    private final DeliveryRepository deliveryRepository;
    private final APInvoiceRepository apInvoiceRepository;
    private final ARInvoiceRepository arInvoiceRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','SALE','ACCOUNTING')")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        try {
            DashboardStatsDTO stats = new DashboardStatsDTO();

            // Inventory Summary
            Long totalProducts = productRepository.count();
        
        // Calculate real stock from Warehouse_Stock table
        List<com.g174.mmssystem.entity.WarehouseStock> allStocks = warehouseStockRepository.findAll();
        
        BigDecimal totalQuantity = allStocks.stream()
            .map(com.g174.mmssystem.entity.WarehouseStock::getQuantity)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalValue = allStocks.stream()
            .filter(stock -> stock.getProduct() != null && stock.getProduct().getSellingPrice() != null)
            .map(stock -> stock.getQuantity().multiply(stock.getProduct().getSellingPrice()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        stats.setInventorySummary(new InventorySummary(totalProducts, totalQuantity.longValue(), totalValue));

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

        // Low Stock Products - get real data from Warehouse_Stock
        stats.setLowStockProducts(getLowStockProductsList(10));
        
        // Monthly Import/Export Statistics (last 6 months)
        stats.setMonthlyImportExport(getMonthlyImportExportStats());
        
        // Top Warehouses by Revenue (top 5)
        stats.setTopWarehouses(getTopWarehousesByRevenue(5));
        
        // Warehouse pending tasks
        stats.setPendingInboundDeliveries(getPendingInboundDeliveries(10));
        stats.setPendingDeliveries(getPendingDeliveries(10));
        stats.setTodayActivity(getTodayWarehouseActivity());
        
        // Accounting data
        stats.setPendingAPInvoices(getPendingAPInvoices(10));
        stats.setOverdueARInvoices(getOverdueARInvoices(10));
        stats.setAccountingSummary(getAccountingSummary());

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching dashboard stats", e);
            // Return empty stats on error
            return ResponseEntity.ok(new DashboardStatsDTO());
        }
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','SALE','ACCOUNTING')")
    public ResponseEntity<List<LowStockProduct>> getLowStockProducts(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(getLowStockProductsList(limit));
    }
    
    // Helper method to get monthly import/export statistics
    private List<MonthlyImportExport> getMonthlyImportExportStats() {
        List<MonthlyImportExport> monthlyStats = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        
        // Get data for last 6 months
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
            String monthLabel = monthStart.format(formatter);
            
            // Count imports (Goods Receipts) - sử dụng receivedDate hoặc createdAt nếu receivedDate null
            Long importCount = goodsReceiptRepository.findAllActive().stream()
                .filter(gr -> {
                    LocalDateTime dateToCheck = gr.getReceivedDate() != null ? gr.getReceivedDate() : gr.getCreatedAt();
                    return dateToCheck != null 
                        && !dateToCheck.isBefore(monthStart) 
                        && !dateToCheck.isAfter(monthEnd);
                })
                .count();
            
            // Count exports (Good Issues) - sử dụng issueDate hoặc createdAt nếu issueDate null
            Long exportCount = goodIssueRepository.findAllActive().stream()
                .filter(gi -> {
                    LocalDateTime dateToCheck = gi.getIssueDate() != null ? gi.getIssueDate() : gi.getCreatedAt();
                    return dateToCheck != null 
                        && !dateToCheck.isBefore(monthStart) 
                        && !dateToCheck.isAfter(monthEnd);
                })
                .count();
            
            // For now, use placeholder values for monetary amounts
            // In production, you would calculate actual values from items
            BigDecimal importValue = BigDecimal.valueOf(importCount * 10000000L); // 10M per receipt
            BigDecimal exportValue = BigDecimal.valueOf(exportCount * 8000000L); // 8M per issue
            
            monthlyStats.add(new MonthlyImportExport(
                monthLabel,
                importCount,
                importValue,
                exportCount,
                exportValue
            ));
        }
        
        return monthlyStats;
    }
    
    // Helper method to get top warehouses by revenue
    private List<WarehouseRevenue> getTopWarehousesByRevenue(int limit) {
        List<WarehouseRevenue> warehouseRevenues = new ArrayList<>();
        
        // Get all active warehouses
        List<com.g174.mmssystem.entity.Warehouse> warehouses = warehouseRepository.findAllActive();
        
        for (com.g174.mmssystem.entity.Warehouse warehouse : warehouses) {
            // Count total issues from this warehouse
            Long totalOrders = goodIssueRepository.findAllActive().stream()
                .filter(gi -> gi.getWarehouse() != null 
                    && gi.getWarehouse().getWarehouseId().equals(warehouse.getWarehouseId()))
                .count();
            
            // For now, use placeholder values
            // In production, you would calculate from actual sales order values
            BigDecimal totalRevenue = BigDecimal.valueOf(totalOrders * 15000000L); // 15M per order
            Long totalQuantity = totalOrders * 50; // 50 items per order avg
            
            warehouseRevenues.add(new WarehouseRevenue(
                warehouse.getWarehouseId(),
                warehouse.getName(),
                warehouse.getCode(),
                totalRevenue,
                totalOrders,
                totalQuantity
            ));
        }
        
        // Sort by revenue descending and limit
        return warehouseRevenues.stream()
            .sorted((w1, w2) -> w2.getTotalRevenue().compareTo(w1.getTotalRevenue()))
            .limit(limit)
            .collect(Collectors.toList());
    }
    
    // Helper method to get low stock products from Warehouse_Stock
    private List<LowStockProduct> getLowStockProductsList(int limit) {
        List<LowStockProduct> lowStockList = new ArrayList<>();
        
        // Get all warehouse stock entries
        List<com.g174.mmssystem.entity.WarehouseStock> allStocks = warehouseStockRepository.findAll();
        
        // Define minimum stock threshold (you can make this configurable)
        final BigDecimal MIN_STOCK_THRESHOLD = new BigDecimal("100"); // Minimum stock level
        
        for (com.g174.mmssystem.entity.WarehouseStock stock : allStocks) {
            if (stock.getProduct() != null && stock.getProduct().getDeletedAt() == null) {
                BigDecimal currentQuantity = stock.getQuantity();
                
                // Only include products with stock below threshold
                if (currentQuantity.compareTo(MIN_STOCK_THRESHOLD) < 0) {
                    Long currentStock = currentQuantity.longValue();
                    Long minStock = MIN_STOCK_THRESHOLD.longValue();
                    Double stockPercentage = (currentStock.doubleValue() / minStock.doubleValue()) * 100;
                    
                    String status;
                    if (stockPercentage < 30) {
                        status = "Cực thấp";
                    } else if (stockPercentage < 50) {
                        status = "Cần bổ sung";
                    } else {
                        status = "Thấp";
                    }
                    
                    String categoryName = stock.getProduct().getCategory() != null 
                        ? stock.getProduct().getCategory().getName() 
                        : "Chưa phân loại";
                    
                    lowStockList.add(new LowStockProduct(
                        stock.getProduct().getProductId(),
                        stock.getProduct().getName(),
                        categoryName,
                        currentStock,
                        minStock,
                        stockPercentage,
                        status
                    ));
                }
            }
        }
        
        // Sort by stock percentage (lowest first) and limit
        return lowStockList.stream()
            .sorted((p1, p2) -> Double.compare(p1.getStockPercentage(), p2.getStockPercentage()))
            .limit(limit)
            .collect(Collectors.toList());
    }
    
    // Helper method to get pending inbound deliveries (chờ nhập kho)
    private List<PendingInboundDelivery> getPendingInboundDeliveries(int limit) {
        List<PendingInboundDelivery> pendingList = new ArrayList<>();
        
        // Sử dụng query với JOIN FETCH để tránh lazy loading
        List<com.g174.mmssystem.entity.InboundDelivery> inboundDeliveries = 
            inboundDeliveryRepository.findPendingInboundDeliveriesWithDetails().stream()
                .limit(limit)
                .collect(Collectors.toList());
        
        for (com.g174.mmssystem.entity.InboundDelivery id : inboundDeliveries) {
            String vendorName = "N/A";
            String purchaseOrderNo = "N/A";
            
            if (id.getVendor() != null) {
                vendorName = id.getVendor().getName();
            }
            if (id.getPurchaseOrder() != null) {
                purchaseOrderNo = id.getPurchaseOrder().getPoNo();
            }
            
            pendingList.add(new PendingInboundDelivery(
                id.getInboundDeliveryId(),
                id.getInboundDeliveryNo(),
                purchaseOrderNo,
                vendorName,
                id.getItems() != null ? id.getItems().size() : 0,
                id.getStatus() != null ? id.getStatus().name() : "Unknown",
                id.getPlannedDate() != null ? id.getPlannedDate().toString() : null
            ));
        }
        
        return pendingList;
    }
    
    // Helper method to get pending deliveries (chờ xuất kho)
    private List<PendingDelivery> getPendingDeliveries(int limit) {
        List<PendingDelivery> pendingList = new ArrayList<>();
        
        // Sử dụng query với JOIN FETCH để tránh lazy loading
        List<com.g174.mmssystem.entity.Delivery> deliveries = 
            deliveryRepository.findPendingDeliveriesWithDetails().stream()
                .limit(limit)
                .collect(Collectors.toList());
        
        for (com.g174.mmssystem.entity.Delivery d : deliveries) {
            String customerName = "N/A";
            String salesOrderNo = "N/A";
            
            if (d.getSalesOrder() != null) {
                salesOrderNo = d.getSalesOrder().getSoNo();
                if (d.getSalesOrder().getCustomer() != null) {
                    com.g174.mmssystem.entity.Customer customer = d.getSalesOrder().getCustomer();
                    customerName = customer.getFirstName() + " " + customer.getLastName();
                }
            }
            
            pendingList.add(new PendingDelivery(
                d.getDeliveryId(),
                d.getDeliveryNo(),
                salesOrderNo,
                customerName,
                d.getItems() != null ? d.getItems().size() : 0,
                d.getStatus() != null ? d.getStatus().name() : "Unknown",
                d.getPlannedDate() != null ? d.getPlannedDate().toString() : null
            ));
        }
        
        return pendingList;
    }
    
    // Helper method to get today's warehouse activity
    private WarehouseActivity getTodayWarehouseActivity() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        
        // Count today's goods receipts
        Long todayReceipts = goodsReceiptRepository.findAllActive().stream()
            .filter(gr -> gr.getCreatedAt() != null &&
                !gr.getCreatedAt().isBefore(startOfDay) &&
                !gr.getCreatedAt().isAfter(endOfDay))
            .count();
        
        // Count today's good issues
        Long todayIssues = goodIssueRepository.findAllActive().stream()
            .filter(gi -> gi.getCreatedAt() != null &&
                !gi.getCreatedAt().isBefore(startOfDay) &&
                !gi.getCreatedAt().isAfter(endOfDay))
            .count();
        
        // Count pending goods receipts (Pending status)
        Long pendingReceipts = goodsReceiptRepository.findAllActive().stream()
            .filter(gr -> gr.getStatus() == com.g174.mmssystem.entity.GoodsReceipt.GoodsReceiptStatus.Pending)
            .count();
        
        // Count pending good issues (Draft or Pending status)
        Long pendingIssues = goodIssueRepository.findAllActive().stream()
            .filter(gi -> gi.getStatus() == com.g174.mmssystem.entity.GoodIssue.GoodIssueStatus.Draft ||
                gi.getStatus() == com.g174.mmssystem.entity.GoodIssue.GoodIssueStatus.Pending)
            .count();
        
        return new WarehouseActivity(todayReceipts, todayIssues, pendingReceipts, pendingIssues);
    }
    
    // Helper method to get pending AP invoices (Accounts Payable)
    private List<PendingAPInvoice> getPendingAPInvoices(int limit) {
        List<PendingAPInvoice> pendingList = new ArrayList<>();
        
        // Get all unpaid and partially paid AP invoices
        List<com.g174.mmssystem.entity.APInvoice> apInvoices = apInvoiceRepository.findAllActive().stream()
            .filter(invoice -> invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Unpaid ||
                invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Partially_Paid)
            .sorted((a, b) -> {
                if (a.getDueDate() == null) return 1;
                if (b.getDueDate() == null) return -1;
                return a.getDueDate().compareTo(b.getDueDate());
            })
            .limit(limit)
            .collect(Collectors.toList());
        
        LocalDateTime now = LocalDateTime.now();
        for (com.g174.mmssystem.entity.APInvoice invoice : apInvoices) {
            Integer daysUntilDue = null;
            if (invoice.getDueDate() != null) {
                daysUntilDue = (int) java.time.temporal.ChronoUnit.DAYS.between(
                    now.toLocalDate(), 
                    invoice.getDueDate()
                );
            }
            
            pendingList.add(new PendingAPInvoice(
                invoice.getApInvoiceId(),
                invoice.getInvoiceNo(),
                invoice.getVendor() != null ? invoice.getVendor().getName() : "Unknown",
                invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO,
                invoice.getBalanceAmount() != null ? invoice.getBalanceAmount() : BigDecimal.ZERO,
                invoice.getDueDate() != null ? invoice.getDueDate().toString() : null,
                invoice.getStatus() != null ? invoice.getStatus().name() : "Unknown",
                daysUntilDue
            ));
        }
        
        return pendingList;
    }
    
    // Helper method to get overdue AR invoices (Accounts Receivable)
    private List<OverdueARInvoice> getOverdueARInvoices(int limit) {
        List<OverdueARInvoice> overdueList = new ArrayList<>();
        
        // Get overdue AR invoices
        LocalDateTime now = LocalDateTime.now();
        List<com.g174.mmssystem.entity.ARInvoice> arInvoices = arInvoiceRepository.findAllActiveInvoices().stream()
            .filter(invoice -> invoice.getDueDate() != null &&
                invoice.getDueDate().isBefore(now.toLocalDate()) &&
                (invoice.getStatus() == com.g174.mmssystem.entity.ARInvoice.InvoiceStatus.Unpaid ||
                 invoice.getStatus() == com.g174.mmssystem.entity.ARInvoice.InvoiceStatus.PartiallyPaid))
            .sorted((a, b) -> a.getDueDate().compareTo(b.getDueDate()))
            .limit(limit)
            .collect(Collectors.toList());
        
        for (com.g174.mmssystem.entity.ARInvoice invoice : arInvoices) {
            Integer daysOverdue = null;
            if (invoice.getDueDate() != null) {
                daysOverdue = (int) java.time.temporal.ChronoUnit.DAYS.between(
                    invoice.getDueDate(),
                    now.toLocalDate()
                );
            }
            
            String customerName = "Unknown";
            if (invoice.getCustomer() != null) {
                customerName = invoice.getCustomer().getFirstName() + " " + invoice.getCustomer().getLastName();
            }
            
            overdueList.add(new OverdueARInvoice(
                invoice.getArInvoiceId(),
                invoice.getInvoiceNo(),
                customerName,
                invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO,
                invoice.getBalanceAmount() != null ? invoice.getBalanceAmount() : BigDecimal.ZERO,
                invoice.getDueDate() != null ? invoice.getDueDate().toString() : null,
                invoice.getStatus() != null ? invoice.getStatus().name() : "Unknown",
                daysOverdue
            ));
        }
        
        return overdueList;
    }
    
    // Helper method to get accounting summary
    private AccountingSummary getAccountingSummary() {
        // Calculate total accounts payable (unpaid + partially paid)
        BigDecimal totalAP = apInvoiceRepository.findAllActive().stream()
            .filter(invoice -> invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Unpaid ||
                invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Partially_Paid)
            .map(invoice -> invoice.getBalanceAmount() != null ? invoice.getBalanceAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calculate total accounts receivable (unpaid + partially paid)
        BigDecimal totalAR = arInvoiceRepository.findAllActiveInvoices().stream()
            .filter(invoice -> invoice.getStatus() == com.g174.mmssystem.entity.ARInvoice.InvoiceStatus.Unpaid ||
                invoice.getStatus() == com.g174.mmssystem.entity.ARInvoice.InvoiceStatus.PartiallyPaid)
            .map(invoice -> invoice.getBalanceAmount() != null ? invoice.getBalanceAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Count pending AP invoices
        Integer pendingAPCount = (int) apInvoiceRepository.findAllActive().stream()
            .filter(invoice -> invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Unpaid ||
                invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Partially_Paid)
            .count();
        
        // Count overdue AR invoices
        LocalDateTime now = LocalDateTime.now();
        Integer overdueARCount = (int) arInvoiceRepository.findAllActiveInvoices().stream()
            .filter(invoice -> invoice.getDueDate() != null &&
                invoice.getDueDate().isBefore(now.toLocalDate()) &&
                (invoice.getStatus() == com.g174.mmssystem.entity.ARInvoice.InvoiceStatus.Unpaid ||
                 invoice.getStatus() == com.g174.mmssystem.entity.ARInvoice.InvoiceStatus.PartiallyPaid))
            .count();
        
        // Calculate upcoming payments (next 7 days)
        LocalDateTime sevenDaysLater = now.plusDays(7);
        BigDecimal upcomingPayments = apInvoiceRepository.findAllActive().stream()
            .filter(invoice -> invoice.getDueDate() != null &&
                !invoice.getDueDate().isBefore(now.toLocalDate()) &&
                !invoice.getDueDate().isAfter(sevenDaysLater.toLocalDate()) &&
                (invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Unpaid ||
                 invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Partially_Paid))
            .map(invoice -> invoice.getBalanceAmount() != null ? invoice.getBalanceAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calculate overdue receivables
        BigDecimal overdueReceivables = arInvoiceRepository.findAllActiveInvoices().stream()
            .filter(invoice -> invoice.getDueDate() != null &&
                invoice.getDueDate().isBefore(now.toLocalDate()) &&
                (invoice.getStatus() == com.g174.mmssystem.entity.ARInvoice.InvoiceStatus.Unpaid ||
                 invoice.getStatus() == com.g174.mmssystem.entity.ARInvoice.InvoiceStatus.PartiallyPaid))
            .map(invoice -> invoice.getBalanceAmount() != null ? invoice.getBalanceAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return new AccountingSummary(
            totalAP,
            totalAR,
            pendingAPCount,
            overdueARCount,
            upcomingPayments,
            overdueReceivables
        );
    }
    
    @GetMapping("/notifications")
    @PreAuthorize("hasAnyRole('MANAGER','PURCHASE','WAREHOUSE','SALE','ACCOUNTING')")
    public ResponseEntity<NotificationDTO> getNotifications(Authentication authentication) {
        try {
            List<NotificationItem> notifications = new ArrayList<>();
            
            // Get user roles
            List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
            
            // WAREHOUSE notifications
            if (roles.contains("ROLE_WAREHOUSE")) {
                notifications.addAll(getWarehouseNotifications());
            }
            
            // ACCOUNTING notifications
            if (roles.contains("ROLE_ACCOUNTING")) {
                notifications.addAll(getAccountingNotifications());
            }
            
            // MANAGER notifications
            if (roles.contains("ROLE_MANAGER")) {
                notifications.addAll(getManagerNotifications());
            }
            
            // PURCHASE notifications
            if (roles.contains("ROLE_PURCHASE")) {
                notifications.addAll(getPurchaseNotifications());
            }
            
            // SALE notifications
            if (roles.contains("ROLE_SALE")) {
                notifications.addAll(getSaleNotifications());
            }
            
            // Sort by priority and timestamp
            notifications.sort((n1, n2) -> {
                int priorityCompare = getPriorityValue(n2.getPriority()) - getPriorityValue(n1.getPriority());
                if (priorityCompare != 0) return priorityCompare;
                return n2.getTimestamp().compareTo(n1.getTimestamp());
            });
            
            // Count unread
            int unreadCount = (int) notifications.stream().filter(n -> !n.getIsRead()).count();
            
            return ResponseEntity.ok(new NotificationDTO(notifications, unreadCount));
        } catch (Exception e) {
            log.error("Error fetching notifications", e);
            return ResponseEntity.ok(new NotificationDTO(new ArrayList<>(), 0));
        }
    }
    
    private int getPriorityValue(String priority) {
        switch (priority) {
            case "high": return 3;
            case "medium": return 2;
            case "low": return 1;
            default: return 0;
        }
    }
    
    private List<NotificationItem> getWarehouseNotifications() {
        List<NotificationItem> notifications = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        // Pending inbound deliveries
        Long pendingInbound = inboundDeliveryRepository.findAll().stream()
            .filter(id -> id.getDeletedAt() == null &&
                id.getStatus() == com.g174.mmssystem.entity.InboundDelivery.InboundDeliveryStatus.Pending)
            .count();
        
        if (pendingInbound > 0) {
            notifications.add(new NotificationItem(
                "warehouse-inbound-pending",
                "warning",
                "📦",
                "Hàng chờ nhập kho",
                pendingInbound + " đơn hàng chờ nhập kho từ nhà cung cấp",
                "/purchase/inbound-deliveries",
                now,
                false,
                "high"
            ));
        }
        
        // Pending deliveries
        Long pendingDelivery = deliveryRepository.findAll().stream()
            .filter(d -> d.getDeletedAt() == null &&
                (d.getStatus() == com.g174.mmssystem.entity.Delivery.DeliveryStatus.Draft ||
                 d.getStatus() == com.g174.mmssystem.entity.Delivery.DeliveryStatus.Picked))
            .count();
        
        if (pendingDelivery > 0) {
            notifications.add(new NotificationItem(
                "warehouse-delivery-pending",
                "warning",
                "🚚",
                "Hàng chờ xuất kho",
                pendingDelivery + " đơn hàng chờ xuất kho cho khách hàng",
                "/sales/deliveries",
                now,
                false,
                "high"
            ));
        }
        
        // Low stock alerts
        List<com.g174.mmssystem.entity.WarehouseStock> lowStocks = warehouseStockRepository.findAll().stream()
            .filter(stock -> stock.getProduct() != null && 
                           stock.getProduct().getDeletedAt() == null &&
                           stock.getQuantity().compareTo(new BigDecimal("100")) < 0)
            .collect(Collectors.toList());
        
        if (!lowStocks.isEmpty()) {
            notifications.add(new NotificationItem(
                "warehouse-lowstock",
                "error",
                "⚠️",
                "Cảnh báo hàng sắp hết",
                lowStocks.size() + " sản phẩm ở mức tồn kho thấp",
                "/warehouse",
                now,
                false,
                "medium"
            ));
        }
        
        // Today's activity
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0);
        Long todayReceipts = goodsReceiptRepository.findAllActive().stream()
            .filter(gr -> gr.getCreatedAt() != null &&
                !gr.getCreatedAt().isBefore(startOfDay))
            .count();
        
        Long todayIssues = goodIssueRepository.findAllActive().stream()
            .filter(gi -> gi.getCreatedAt() != null &&
                !gi.getCreatedAt().isBefore(startOfDay))
            .count();
        
        if (todayReceipts > 0 || todayIssues > 0) {
            notifications.add(new NotificationItem(
                "warehouse-activity-today",
                "info",
                "✅",
                "Hoạt động hôm nay",
                "Đã nhập " + todayReceipts + " phiếu, xuất " + todayIssues + " phiếu",
                "/dashboard",
                now,
                true,
                "low"
            ));
        }
        
        return notifications;
    }
    
    private List<NotificationItem> getAccountingNotifications() {
        List<NotificationItem> notifications = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        // Overdue AP invoices
        Long overdueAP = apInvoiceRepository.findAllActive().stream()
            .filter(invoice -> invoice.getDueDate() != null &&
                invoice.getDueDate().isBefore(now.toLocalDate()) &&
                (invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Unpaid ||
                 invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Partially_Paid))
            .count();
        
        if (overdueAP > 0) {
            notifications.add(new NotificationItem(
                "accounting-ap-overdue",
                "error",
                "💰",
                "Hóa đơn phải trả quá hạn",
                overdueAP + " hóa đơn phải trả đã quá hạn thanh toán",
                "/purchase/ap-invoices",
                now,
                false,
                "high"
            ));
        }
        
        // Overdue AR invoices
        Long overdueAR = arInvoiceRepository.findAllActiveInvoices().stream()
            .filter(invoice -> invoice.getDueDate() != null &&
                invoice.getDueDate().isBefore(now.toLocalDate()) &&
                (invoice.getStatus() == com.g174.mmssystem.entity.ARInvoice.InvoiceStatus.Unpaid ||
                 invoice.getStatus() == com.g174.mmssystem.entity.ARInvoice.InvoiceStatus.PartiallyPaid))
            .count();
        
        if (overdueAR > 0) {
            notifications.add(new NotificationItem(
                "accounting-ar-overdue",
                "error",
                "💵",
                "Công nợ khách hàng quá hạn",
                overdueAR + " khách hàng có công nợ quá hạn",
                "/sales/invoices",
                now,
                false,
                "high"
            ));
        }
        
        // Upcoming payments (next 7 days)
        LocalDateTime sevenDaysLater = now.plusDays(7);
        Long upcomingPayments = apInvoiceRepository.findAllActive().stream()
            .filter(invoice -> invoice.getDueDate() != null &&
                !invoice.getDueDate().isBefore(now.toLocalDate()) &&
                !invoice.getDueDate().isAfter(sevenDaysLater.toLocalDate()) &&
                (invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Unpaid ||
                 invoice.getStatus() == com.g174.mmssystem.entity.APInvoice.APInvoiceStatus.Partially_Paid))
            .count();
        
        if (upcomingPayments > 0) {
            notifications.add(new NotificationItem(
                "accounting-upcoming-payments",
                "warning",
                "📅",
                "Thanh toán sắp đến hạn",
                upcomingPayments + " hóa đơn cần thanh toán trong 7 ngày tới",
                "/purchase/ap-invoices",
                now,
                false,
                "medium"
            ));
        }
        
        return notifications;
    }
    
    private List<NotificationItem> getManagerNotifications() {
        List<NotificationItem> notifications = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        // Pending PO approvals
        Long pendingPO = purchaseOrderRepository.findAll().stream()
            .filter(po -> po.getDeletedAt() == null &&
                po.getStatus() == PurchaseOrderStatus.Pending)
            .count();
        
        if (pendingPO > 0) {
            notifications.add(new NotificationItem(
                "manager-po-approval",
                "warning",
                "📋",
                "Purchase Orders chờ phê duyệt",
                pendingPO + " Purchase Orders cần phê duyệt",
                "/purchase/purchase-orders",
                now,
                false,
                "high"
            ));
        }
        
        // Pending SO approvals
        Long pendingSO = salesOrderRepository.findAll().stream()
            .filter(so -> so.getDeletedAt() == null &&
                so.getStatus() == SalesOrder.OrderStatus.Pending)
            .count();
        
        if (pendingSO > 0) {
            notifications.add(new NotificationItem(
                "manager-so-approval",
                "warning",
                "📝",
                "Sales Orders chờ xác nhận",
                pendingSO + " Sales Orders cần xác nhận",
                "/sales/sales-orders",
                now,
                false,
                "high"
            ));
        }
        
        // Critical low stock
        Long criticalStock = warehouseStockRepository.findAll().stream()
            .filter(stock -> stock.getProduct() != null && 
                           stock.getProduct().getDeletedAt() == null &&
                           stock.getQuantity().compareTo(new BigDecimal("50")) < 0)
            .count();
        
        if (criticalStock > 0) {
            notifications.add(new NotificationItem(
                "manager-critical-stock",
                "error",
                "📊",
                "Cảnh báo tồn kho cực thấp",
                criticalStock + " sản phẩm ở mức tồn kho cực thấp",
                "/warehouse",
                now,
                false,
                "high"
            ));
        }
        
        return notifications;
    }
    
    private List<NotificationItem> getPurchaseNotifications() {
        List<NotificationItem> notifications = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        // Pending requisitions
        Long pendingRequisitions = purchaseRequisitionRepository.findAll().stream()
            .filter(pr -> pr.getDeletedAt() == null &&
                pr.getStatus() == RequisitionStatus.Pending)
            .count();
        
        if (pendingRequisitions > 0) {
            notifications.add(new NotificationItem(
                "purchase-requisition-pending",
                "warning",
                "🛒",
                "Yêu cầu mua hàng chờ xử lý",
                pendingRequisitions + " Purchase Requisitions cần xử lý",
                "/purchase/purchase-requisitions",
                now,
                false,
                "high"
            ));
        }
        
        // Pending RFQs
        Long pendingRFQs = rfqRepository.count();
        if (pendingRFQs > 0) {
            notifications.add(new NotificationItem(
                "purchase-rfq-pending",
                "info",
                "📞",
                "Request for Quotations",
                pendingRFQs + " RFQs đang chờ báo giá từ nhà cung cấp",
                "/purchase/rfqs",
                now,
                false,
                "medium"
            ));
        }
        
        // Pending quotations
        Long pendingQuotations = purchaseQuotationRepository.count();
        if (pendingQuotations > 0) {
            notifications.add(new NotificationItem(
                "purchase-quotation-pending",
                "info",
                "📝",
                "Báo giá từ nhà cung cấp",
                pendingQuotations + " quotations cần xem xét",
                "/purchase/purchase-quotations",
                now,
                false,
                "medium"
            ));
        }
        
        return notifications;
    }
    
    private List<NotificationItem> getSaleNotifications() {
        List<NotificationItem> notifications = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        // New pending orders
        Long pendingOrders = salesOrderRepository.findAll().stream()
            .filter(so -> so.getDeletedAt() == null &&
                so.getStatus() == SalesOrder.OrderStatus.Pending)
            .count();
        
        if (pendingOrders > 0) {
            notifications.add(new NotificationItem(
                "sale-pending-orders",
                "warning",
                "🎯",
                "Đơn hàng mới",
                pendingOrders + " đơn hàng mới cần xử lý",
                "/sales/sales-orders",
                now,
                false,
                "high"
            ));
        }
        
        // Pending quotations (need follow up)
        Long pendingQuotations = salesOrderRepository.findAll().stream()
            .filter(so -> so.getDeletedAt() == null &&
                so.getSalesQuotation() != null)
            .count();
        
        if (pendingQuotations > 0) {
            notifications.add(new NotificationItem(
                "sale-quotations-followup",
                "info",
                "📞",
                "Quotations cần theo dõi",
                "Có quotations chưa nhận phản hồi từ khách hàng",
                "/sales/quotations",
                now,
                false,
                "medium"
            ));
        }
        
        return notifications;
    }
}


package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.DeliveryItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.DeliveryRequestDTO;
import com.g174.mmssystem.dto.responseDTO.DeliveryItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.DeliveryListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.DeliveryResponseDTO;
import com.g174.mmssystem.entity.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class DeliveryMapper {

    public Delivery toEntity(DeliveryRequestDTO dto, SalesOrder salesOrder, Warehouse warehouse, User currentUser) {
        Delivery delivery = new Delivery();
        delivery.setSalesOrder(salesOrder);
        delivery.setWarehouse(warehouse);
        delivery.setPlannedDate(dto.getPlannedDate() != null ? 
                dto.getPlannedDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC) : Instant.now());
        delivery.setActualDate(dto.getActualDate() != null ? 
                dto.getActualDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC) : null);
        delivery.setShippingAddress(dto.getShippingAddress());
        delivery.setCarrierName(dto.getCarrierName());
        delivery.setDriverName(dto.getDriverName());
        delivery.setDriverPhone(dto.getDriverPhone());
        delivery.setTrackingCode(dto.getTrackingCode());
        delivery.setNotes(dto.getNotes());
        delivery.setCreatedBy(currentUser);
        delivery.setUpdatedBy(currentUser);
        return delivery;
    }

    public void updateEntity(Delivery delivery, DeliveryRequestDTO dto, Warehouse warehouse, User currentUser) {
        delivery.setWarehouse(warehouse);
        if (dto.getPlannedDate() != null) {
            delivery.setPlannedDate(dto.getPlannedDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
        }
        if (dto.getActualDate() != null) {
            delivery.setActualDate(dto.getActualDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
        }
        delivery.setShippingAddress(dto.getShippingAddress());
        delivery.setCarrierName(dto.getCarrierName());
        delivery.setDriverName(dto.getDriverName());
        delivery.setDriverPhone(dto.getDriverPhone());
        delivery.setTrackingCode(dto.getTrackingCode());
        delivery.setNotes(dto.getNotes());
        delivery.setUpdatedBy(currentUser);
    }

    public DeliveryItem toItemEntity(Delivery delivery, DeliveryItemRequestDTO dto, 
                                     SalesOrderItem salesOrderItem, Product product, Warehouse warehouse) {
        DeliveryItem item = new DeliveryItem();
        item.setDelivery(delivery);
        item.setSalesOrderItem(salesOrderItem);
        item.setProduct(product);
        item.setWarehouse(warehouse);
        item.setOrderedQty(salesOrderItem.getQuantity());
        item.setPlannedQty(dto.getPlannedQty());
        item.setDeliveredQty(dto.getDeliveredQty() != null ? dto.getDeliveredQty() : java.math.BigDecimal.ZERO);
        if (product != null) {
            item.setUom(product.getUom());
        } else {
            item.setUom(salesOrderItem.getUom());
        }
        item.setNote(dto.getNote());
        return item;
    }

    public DeliveryResponseDTO toResponse(Delivery delivery, List<DeliveryItem> items) {
        SalesOrder salesOrder = delivery.getSalesOrder();
        Customer customer = salesOrder != null ? salesOrder.getCustomer() : null;
        Warehouse warehouse = delivery.getWarehouse();
        
        return DeliveryResponseDTO.builder()
                .deliveryId(delivery.getDeliveryId())
                .deliveryNo(delivery.getDeliveryNo())
                .status(delivery.getStatus())
                .salesOrderId(salesOrder != null ? salesOrder.getSoId() : null)
                .salesOrderNo(salesOrder != null ? salesOrder.getSoNo() : null)
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(getCustomerName(customer))
                .warehouseId(warehouse != null ? warehouse.getWarehouseId() : null)
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .plannedDate(delivery.getPlannedDate())
                .actualDate(delivery.getActualDate())
                .shippingAddress(delivery.getShippingAddress())
                .carrierName(delivery.getCarrierName())
                .driverName(delivery.getDriverName())
                .driverPhone(delivery.getDriverPhone())
                .trackingCode(delivery.getTrackingCode())
                .notes(delivery.getNotes())
                .createdAt(delivery.getCreatedAt())
                .createdBy(delivery.getCreatedBy() != null ? delivery.getCreatedBy().getEmail() : null)
                .updatedAt(delivery.getUpdatedAt())
                .updatedBy(delivery.getUpdatedBy() != null ? delivery.getUpdatedBy().getEmail() : null)
                .items(items.stream().map(this::toItemResponse).collect(Collectors.toList()))
                .build();
    }

    public DeliveryListResponseDTO toListResponse(Delivery delivery) {
        SalesOrder salesOrder = delivery.getSalesOrder();
        Customer customer = salesOrder != null ? salesOrder.getCustomer() : null;
        Warehouse warehouse = delivery.getWarehouse();
        
        return DeliveryListResponseDTO.builder()
                .deliveryId(delivery.getDeliveryId())
                .deliveryNo(delivery.getDeliveryNo())
                .status(delivery.getStatus())
                .salesOrderId(salesOrder != null ? salesOrder.getSoId() : null)
                .salesOrderNo(salesOrder != null ? salesOrder.getSoNo() : null)
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(getCustomerName(customer))
                .warehouseId(warehouse != null ? warehouse.getWarehouseId() : null)
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .plannedDate(delivery.getPlannedDate())
                .trackingCode(delivery.getTrackingCode())
                .build();
    }

    private String getCustomerName(Customer customer) {
        if (customer == null) {
            return null;
        }
        return customer.getFirstName() + " " + customer.getLastName();
    }

    private DeliveryItemResponseDTO toItemResponse(DeliveryItem item) {
        Product product = item.getProduct();
        Warehouse warehouse = item.getWarehouse();
        SalesOrderItem salesOrderItem = item.getSalesOrderItem();
        
        return DeliveryItemResponseDTO.builder()
                .deliveryItemId(item.getDiId())
                .salesOrderItemId(salesOrderItem != null ? salesOrderItem.getSoiId() : null)
                .productId(product != null ? product.getProductId() : null)
                .productSku(product != null ? product.getSku() : null)
                .productName(product != null ? product.getName() : null)
                .warehouseId(warehouse != null ? warehouse.getWarehouseId() : null)
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .orderedQty(item.getOrderedQty())
                .plannedQty(item.getPlannedQty())
                .deliveredQty(item.getDeliveredQty())
                .uom(item.getUom())
                .note(item.getNote())
                .build();
    }

}


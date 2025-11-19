package com.g174.mmssystem.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class WarehouseStockId implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private Integer warehouseId;
    private Integer productId;
}


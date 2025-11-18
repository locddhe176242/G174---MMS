package com.g174.mmssystem.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class RFQVendorId implements Serializable {
    private Integer rfqId;
    private Integer vendorId;
}


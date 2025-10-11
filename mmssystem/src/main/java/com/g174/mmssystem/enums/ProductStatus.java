package com.g174.mmssystem.enums;

public enum ProductStatus {
    IN_STOCK("In Stock"),
    OUT_OF_STOCK("Out of Stock"),
    DISCONTINUED("Discontinued");

    private final String label;

    ProductStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
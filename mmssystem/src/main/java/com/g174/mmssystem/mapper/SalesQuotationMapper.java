package com.g174.mmssystem.mapper;

import com.g174.mmssystem.dto.requestDTO.SalesQuotationItemRequestDTO;
import com.g174.mmssystem.dto.requestDTO.SalesQuotationRequestDTO;
import com.g174.mmssystem.dto.responseDTO.SalesQuotationItemResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesQuotationListResponseDTO;
import com.g174.mmssystem.dto.responseDTO.SalesQuotationResponseDTO;
import com.g174.mmssystem.entity.Customer;
import com.g174.mmssystem.entity.Product;
import com.g174.mmssystem.entity.SalesQuotation;
import com.g174.mmssystem.entity.SalesQuotationItem;
import com.g174.mmssystem.entity.User;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class SalesQuotationMapper {

    public SalesQuotation toEntity(SalesQuotationRequestDTO dto, Customer customer, User currentUser) {
        SalesQuotation quotation = new SalesQuotation();
        quotation.setCustomer(customer);
        quotation.setQuotationDate(dto.getQuotationDate() != null
                ? dto.getQuotationDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC)
                : Instant.now());
        quotation.setPaymentTerms(dto.getPaymentTerms());
        quotation.setDeliveryTerms(dto.getDeliveryTerms());
        quotation.setHeaderDiscountPercent(defaultBigDecimal(dto.getHeaderDiscountPercent()));
        quotation.setNotes(dto.getNotes());
        quotation.setCreatedBy(currentUser);
        quotation.setUpdatedBy(currentUser);
        return quotation;
    }

    public void updateEntity(SalesQuotation quotation, SalesQuotationRequestDTO dto, Customer customer,
            User currentUser) {
        quotation.setCustomer(customer);
        if (dto.getQuotationDate() != null) {
            quotation.setQuotationDate(dto.getQuotationDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
        }
        quotation.setPaymentTerms(dto.getPaymentTerms());
        quotation.setDeliveryTerms(dto.getDeliveryTerms());
        quotation.setHeaderDiscountPercent(defaultBigDecimal(dto.getHeaderDiscountPercent()));
        quotation.setNotes(dto.getNotes());
        quotation.setUpdatedBy(currentUser);
    }

    public SalesQuotationItem toItemEntity(SalesQuotation quotation, SalesQuotationItemRequestDTO dto,
            Product product) {
        SalesQuotationItem item = new SalesQuotationItem();
        item.setSalesQuotation(quotation);
        item.setProduct(product);
        item.setProductCode(dto.getProductCode());
        item.setProductName(dto.getProductName());
        if (product != null) {
            item.setProductCode(product.getSku());
            item.setProductName(product.getName());
            item.setUom(product.getUom());
        } else {
            item.setUom(dto.getUom());
        }
        item.setQuantity(defaultBigDecimal(dto.getQuantity(), BigDecimal.ONE));
        item.setUnitPrice(defaultBigDecimal(dto.getUnitPrice()));
        item.setTaxRate(defaultBigDecimal(dto.getTaxRate()));
        item.setNote(dto.getNote());
        return item;
    }

    public SalesQuotationResponseDTO toResponseDTO(SalesQuotation quotation, List<SalesQuotationItem> items) {
        User createdBy = quotation.getCreatedBy();
        User updatedBy = quotation.getUpdatedBy();
        return SalesQuotationResponseDTO.builder()
                .quotationId(quotation.getSqId())
                .quotationNo(quotation.getQuotationNo())
                .status(quotation.getStatus())
                .customerId(quotation.getCustomer() != null ? quotation.getCustomer().getCustomerId() : null)
                .customerName(quotation.getCustomer() != null
                        ? quotation.getCustomer().getFirstName() + " " + quotation.getCustomer().getLastName()
                        : null)
                .customerCode(quotation.getCustomer() != null ? quotation.getCustomer().getCustomerCode() : null)
                .quotationDate(quotation.getQuotationDate())
                .validUntil(quotation.getValidUntil())
                .paymentTerms(quotation.getPaymentTerms())
                .deliveryTerms(quotation.getDeliveryTerms())
                .headerDiscountPercent(quotation.getHeaderDiscountPercent())
                .headerDiscountAmount(quotation.getHeaderDiscountAmount())
                .subtotal(quotation.getSubtotal())
                .taxAmount(quotation.getTaxAmount())
                .totalAmount(quotation.getTotalAmount())
                .notes(quotation.getNotes())
                .createdAt(quotation.getCreatedAt())
                .createdById(createdBy != null ? createdBy.getId() : null)
                .createdBy(createdBy != null ? createdBy.getEmail() : null)
                .createdByDisplay(buildUserDisplay(createdBy))
                .updatedAt(quotation.getUpdatedAt())
                .updatedById(updatedBy != null ? updatedBy.getId() : null)
                .updatedBy(updatedBy != null ? updatedBy.getEmail() : null)
                .updatedByDisplay(buildUserDisplay(updatedBy))
                .items(items.stream().map(this::toItemResponse).collect(Collectors.toList()))
                .build();
    }

    public SalesQuotationListResponseDTO toListResponseDTO(SalesQuotation quotation) {
        return SalesQuotationListResponseDTO.builder()
                .quotationId(quotation.getSqId())
                .quotationNo(quotation.getQuotationNo())
                .status(quotation.getStatus())
                .customerId(quotation.getCustomer() != null ? quotation.getCustomer().getCustomerId() : null)
                .customerName(quotation.getCustomer() != null
                        ? quotation.getCustomer().getFirstName() + " " + quotation.getCustomer().getLastName()
                        : null)
                .quotationDate(quotation.getQuotationDate())
                .validUntil(quotation.getValidUntil())
                .totalAmount(quotation.getTotalAmount())
                .createdAt(quotation.getCreatedAt())
                .updatedAt(quotation.getUpdatedAt())
                .createdByDisplay(buildUserDisplay(quotation.getCreatedBy()))
                .updatedByDisplay(buildUserDisplay(quotation.getUpdatedBy()))
                .build();
    }

    private SalesQuotationItemResponseDTO toItemResponse(SalesQuotationItem item) {
        Product product = item.getProduct();
        return SalesQuotationItemResponseDTO.builder()
                .sqiId(item.getSqiId())
                .productId(product != null ? product.getProductId() : null)
                .productSku(product != null ? product.getSku() : null)
                .productCode(item.getProductCode())
                .productName(item.getProductName())
                .uom(item.getUom())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountAmount(item.getDiscountAmount())
                .taxRate(item.getTaxRate())
                .taxAmount(item.getTaxAmount())
                .lineTotal(item.getLineTotal())
                .note(item.getNote())
                .build();
    }

    private BigDecimal defaultBigDecimal(BigDecimal value) {
        return defaultBigDecimal(value, BigDecimal.ZERO);
    }

    private BigDecimal defaultBigDecimal(BigDecimal value, BigDecimal defaultValue) {
        return value != null ? value : defaultValue;
    }

    private String buildUserDisplay(User user) {
        if (user == null) {
            return null;
        }
        String fullName = null;
        if (user.getProfile() != null) {
            String joinedName = Stream.of(user.getProfile().getFirstName(), user.getProfile().getLastName())
                    .filter(StringUtils::hasText)
                    .collect(Collectors.joining(" "));
            if (StringUtils.hasText(joinedName)) {
                fullName = joinedName.trim();
            }
        }
        if (StringUtils.hasText(fullName)) {
            return fullName;
        }
        if (StringUtils.hasText(user.getEmployeeCode())) {
            return user.getEmployeeCode();
        }
        return user.getEmail();
    }
}
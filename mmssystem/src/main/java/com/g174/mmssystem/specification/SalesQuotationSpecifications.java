package com.g174.mmssystem.specification;

import com.g174.mmssystem.entity.SalesQuotation;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;

public final class SalesQuotationSpecifications {

    private SalesQuotationSpecifications() {
    }

    public static Specification<SalesQuotation> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<SalesQuotation> hasCustomer(Integer customerId) {
        return (root, query, cb) -> customerId == null
                ? null
                : cb.equal(root.join("customer", JoinType.LEFT).get("customerId"), customerId);
    }

    public static Specification<SalesQuotation> hasStatus(SalesQuotation.QuotationStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<SalesQuotation> keywordLike(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return null;
            }
            String like = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("quotationNo")), like),
                    cb.like(cb.lower(root.join("customer", JoinType.LEFT).get("firstName")), like),
                    cb.like(cb.lower(root.join("customer", JoinType.LEFT).get("lastName")), like)
            );
        };
    }

    public static Specification<SalesQuotation> createdAfter(Instant from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    public static Specification<SalesQuotation> createdBefore(Instant to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("createdAt"), to);
    }
}


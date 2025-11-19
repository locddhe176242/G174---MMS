package com.g174.mmssystem.specification;

import com.g174.mmssystem.entity.SalesOrder;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;

public final class SalesOrderSpecifications {

    private SalesOrderSpecifications() {
    }

    public static Specification<SalesOrder> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<SalesOrder> hasCustomer(Integer customerId) {
        return (root, query, cb) -> customerId == null
                ? null
                : cb.equal(root.join("customer", JoinType.LEFT).get("customerId"), customerId);
    }

    public static Specification<SalesOrder> hasStatus(SalesOrder.OrderStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<SalesOrder> hasApprovalStatus(SalesOrder.ApprovalStatus approvalStatus) {
        return (root, query, cb) -> approvalStatus == null ? null : cb.equal(root.get("approvalStatus"), approvalStatus);
    }

    public static Specification<SalesOrder> keywordLike(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) {
                return null;
            }
            String like = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("soNo")), like),
                    cb.like(cb.lower(root.join("customer", JoinType.LEFT).get("firstName")), like),
                    cb.like(cb.lower(root.join("customer", JoinType.LEFT).get("lastName")), like)
            );
        };
    }

    public static Specification<SalesOrder> createdAfter(Instant from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    public static Specification<SalesOrder> createdBefore(Instant to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("createdAt"), to);
    }
}


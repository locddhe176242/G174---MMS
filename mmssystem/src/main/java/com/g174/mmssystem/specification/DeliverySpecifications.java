package com.g174.mmssystem.specification;

import com.g174.mmssystem.entity.Delivery;
import com.g174.mmssystem.entity.SalesOrder;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;

public class DeliverySpecifications {

    private DeliverySpecifications() {
    }

    public static Specification<Delivery> notDeleted() {
        return (root, query, builder) -> builder.isNull(root.get("deletedAt"));
    }

    public static Specification<Delivery> hasStatus(Delivery.DeliveryStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, builder) -> builder.equal(root.get("status"), status);
    }

    public static Specification<Delivery> hasOrder(Integer salesOrderId) {
        if (salesOrderId == null) {
            return null;
        }
        return (root, query, builder) -> builder.equal(root.get("salesOrder").get("soId"), salesOrderId);
    }

    public static Specification<Delivery> hasCustomer(Integer customerId) {
        if (customerId == null) {
            return null;
        }
        return (root, query, builder) -> {
            Join<Delivery, SalesOrder> orderJoin = root.join("salesOrder");
            return builder.equal(orderJoin.get("customer").get("customerId"), customerId);
        };
    }

    public static Specification<Delivery> keywordLike(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }
        String likePattern = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, builder) -> builder.or(
                builder.like(builder.lower(root.get("deliveryNo")), likePattern),
                builder.like(builder.lower(root.get("trackingCode")), likePattern)
        );
    }

    public static Specification<Delivery> plannedFrom(Instant from) {
        if (from == null) {
            return null;
        }
        return (root, query, builder) -> builder.greaterThanOrEqualTo(root.get("plannedDate"), from);
    }

    public static Specification<Delivery> plannedTo(Instant to) {
        if (to == null) {
            return null;
        }
        return (root, query, builder) -> builder.lessThanOrEqualTo(root.get("plannedDate"), to);
    }
}


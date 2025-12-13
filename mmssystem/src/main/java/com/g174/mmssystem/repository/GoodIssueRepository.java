package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.GoodIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoodIssueRepository extends JpaRepository<GoodIssue, Integer> {
    
    Optional<GoodIssue> findByIssueNo(String issueNo);
    
    boolean existsByIssueNo(String issueNo);

    @Query("SELECT gi FROM GoodIssue gi WHERE gi.deletedAt IS NULL")
    List<GoodIssue> findAllActive();

    @Query("SELECT gi FROM GoodIssue gi WHERE gi.deletedAt IS NULL")
    Page<GoodIssue> findAllActive(Pageable pageable);

    @Query("SELECT DISTINCT gi FROM GoodIssue gi " +
           "LEFT JOIN FETCH gi.delivery d " +
           "LEFT JOIN FETCH gi.warehouse w " +
           "LEFT JOIN FETCH gi.createdBy cb " +
           "LEFT JOIN FETCH cb.profile " +
           "WHERE gi.deletedAt IS NULL")
    List<GoodIssue> findAllActiveWithRelations();

    @Query("SELECT DISTINCT gi FROM GoodIssue gi " +
           "LEFT JOIN FETCH gi.delivery d " +
           "LEFT JOIN FETCH gi.warehouse w " +
           "LEFT JOIN FETCH gi.createdBy cb " +
           "LEFT JOIN FETCH cb.profile " +
           "WHERE gi.deletedAt IS NULL " +
           "ORDER BY gi.createdAt DESC")
    Page<GoodIssue> findAllActiveWithRelations(Pageable pageable);

    @Query("SELECT gi FROM GoodIssue gi WHERE " +
           "(LOWER(gi.issueNo) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "gi.deletedAt IS NULL")
    List<GoodIssue> searchIssues(@Param("keyword") String keyword);

    @Query("SELECT gi FROM GoodIssue gi WHERE " +
           "(LOWER(gi.issueNo) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "gi.deletedAt IS NULL")
    Page<GoodIssue> searchIssues(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT gi FROM GoodIssue gi WHERE gi.delivery.deliveryId = :deliveryId AND gi.deletedAt IS NULL")
    List<GoodIssue> findByDeliveryId(@Param("deliveryId") Integer deliveryId);

    @Query("SELECT gi FROM GoodIssue gi WHERE gi.warehouse.warehouseId = :warehouseId AND gi.deletedAt IS NULL")
    List<GoodIssue> findByWarehouseId(@Param("warehouseId") Integer warehouseId);

    @Query("SELECT gi FROM GoodIssue gi " +
           "LEFT JOIN FETCH gi.delivery d " +
           "LEFT JOIN FETCH d.salesOrder so " +
           "LEFT JOIN FETCH so.customer " +
           "LEFT JOIN FETCH gi.warehouse " +
           "LEFT JOIN FETCH gi.createdBy cb " +
           "LEFT JOIN FETCH cb.profile " +
           "LEFT JOIN FETCH gi.approvedBy ab " +
           "LEFT JOIN FETCH ab.profile " +
           "WHERE gi.issueId = :id AND gi.deletedAt IS NULL")
    Optional<GoodIssue> findByIdWithRelations(@Param("id") Integer id);
    
    @Query("SELECT DISTINCT gi FROM GoodIssue gi " +
           "LEFT JOIN FETCH gi.items i " +
           "LEFT JOIN FETCH i.product " +
           "LEFT JOIN FETCH i.deliveryItem " +
           "WHERE gi.issueId = :id AND gi.deletedAt IS NULL")
    Optional<GoodIssue> findByIdWithItems(@Param("id") Integer id);

    @Query(value = "SELECT * FROM Good_Issues WHERE issue_no LIKE CONCAT(:prefix, '%') AND deleted_at IS NULL ORDER BY issue_no DESC LIMIT 1", nativeQuery = true)
    Optional<GoodIssue> findTopByIssueNoStartingWithOrderByIssueNoDesc(@Param("prefix") String prefix);
}


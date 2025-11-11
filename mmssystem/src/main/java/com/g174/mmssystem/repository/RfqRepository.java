package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Rfq;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RfqRepository extends JpaRepository<Rfq, Integer> {

    // Kiểm tra trùng số RFQ (chỉ tính bản ghi chưa bị xóa mềm)
    boolean existsByRfqNoAndDeletedAtIsNull(String rfqNo);

    // Lấy danh sách RFQ đang hoạt động (chưa xóa mềm)
    @Query("SELECT r FROM Rfq r WHERE r.deletedAt IS NULL")
    Page<Rfq> findAllActive(Pageable pageable);

    // Tìm kiếm theo rfqNo/status/notes (không lấy bản ghi đã xóa mềm)
    @Query("""
            SELECT r FROM Rfq r
            WHERE r.deletedAt IS NULL AND (
                 LOWER(r.rfqNo) LIKE LOWER(CONCAT('%', :keyword, '%'))
              OR LOWER(r.status) LIKE LOWER(CONCAT('%', :keyword, '%'))
              OR LOWER(COALESCE(r.notes, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            """)
    Page<Rfq> searchActive(@Param("keyword") String keyword, Pageable pageable);
}



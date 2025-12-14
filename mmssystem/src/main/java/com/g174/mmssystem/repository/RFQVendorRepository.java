package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.RFQVendor;
import com.g174.mmssystem.entity.RFQVendorId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RFQVendorRepository extends JpaRepository<RFQVendor, RFQVendorId> {
    
    @Query("SELECT rv FROM RFQVendor rv WHERE rv.rfqId = :rfqId")
    List<RFQVendor> findByRfqId(@Param("rfqId") Integer rfqId);

    @Query("SELECT rv FROM RFQVendor rv WHERE rv.vendorId = :vendorId")
    List<RFQVendor> findByVendorId(@Param("vendorId") Integer vendorId);

    @Query("SELECT rv FROM RFQVendor rv WHERE rv.rfqId = :rfqId AND rv.vendorId = :vendorId")
    Optional<RFQVendor> findByRfqIdAndVendorId(@Param("rfqId") Integer rfqId, @Param("vendorId") Integer vendorId);

    boolean existsByRfqIdAndVendorId(Integer rfqId, Integer vendorId);

    @Query("SELECT rv FROM RFQVendor rv " +
           "LEFT JOIN FETCH rv.vendor v " +
           "WHERE rv.rfqId = :rfqId")
    List<RFQVendor> findByRfqIdWithVendor(@Param("rfqId") Integer rfqId);
}


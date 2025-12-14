package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.VendorBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorBalanceRepository extends JpaRepository<VendorBalance, Integer> {

    Optional<VendorBalance> findByVendor_VendorId(Integer vendorId);

    @Query("SELECT vb FROM VendorBalance vb WHERE vb.vendor.vendorId = :vendorId")
    Optional<VendorBalance> findBalanceByVendorId(@Param("vendorId") Integer vendorId);
}

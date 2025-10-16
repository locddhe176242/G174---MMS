package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Integer> {

    Optional<Vendor> findByVendorCode(String vendorCode);


    boolean existsByVendorCodeAndDeletedAtIsNull(String vendorCode);

    @Query("SELECT v FROM Vendor v WHERE v.deletedAt IS NULL")
    List<Vendor> findAllActiveVendors();

    @Query("SELECT v FROM Vendor v WHERE v.deletedAt IS NULL")
    Page<Vendor> findAllActiveVendors(Pageable pageable);

    @Query("SELECT v FROM Vendor v WHERE " +
            "(LOWER(v.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(v.vendorCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "v.deletedAt IS NULL")
    List<Vendor> searchVendors(@Param("keyword") String keyword);

    @Query("SELECT v FROM Vendor v WHERE " +
            "(LOWER(v.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(v.vendorCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "v.deletedAt IS NULL")
    Page<Vendor> searchVendors(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT v FROM Vendor v WHERE v.address.addressId = :addressId AND v.deletedAt IS NULL")
    List<Vendor> findByAddressId(@Param("addressId") Integer addressId);

    @Query("SELECT v FROM Vendor v WHERE v.contact.contactId = :contactId AND v.deletedAt IS NULL")
    List<Vendor> findByContactId(@Param("contactId") Integer contactId);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_code, 4) AS UNSIGNED)), 0) " +
            "FROM vendors " +
            "WHERE vendor_code REGEXP '^NCC[0-9]+$' " +
            "FOR UPDATE",
            nativeQuery = true)
    Integer getMaxVendorCodeNumber();

    // Thêm method kiểm tra duplicate với retry
    @Query("SELECT COUNT(v) > 0 FROM Vendor v WHERE v.vendorCode = :vendorCode")
    boolean existsByVendorCode(@Param("vendorCode") String vendorCode);
}
package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    @Query("SELECT c FROM Customer c WHERE c.deletedAt IS NULL")
    List<Customer> findAllActiveCustomers();

    @Query("SELECT c FROM Customer c WHERE c.deletedAt IS NULL")
    Page<Customer> findAllActiveCustomers(Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE " +
            "(LOWER(c.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "c.deletedAt IS NULL")
    List<Customer> searchCustomers(@Param("keyword") String keyword);

    @Query("SELECT c FROM Customer c WHERE " +
            "(LOWER(c.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "c.deletedAt IS NULL")
    Page<Customer> searchCustomers(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE c.address.addressId = :addressId AND c.deletedAt IS NULL")
    List<Customer> findByAddressId(@Param("addressId") Integer addressId);

    @Query("SELECT c FROM Customer c WHERE c.contact.contactId = :contactId AND c.deletedAt IS NULL")
    List<Customer> findByContactId(@Param("contactId") Integer contactId);
}
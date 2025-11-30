package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.CustomerBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerBalanceRepository extends JpaRepository<CustomerBalance, Integer> {

    Optional<CustomerBalance> findByCustomer_CustomerId(Integer customerId);

    @Query("SELECT cb FROM CustomerBalance cb WHERE cb.customer.customerId = :customerId")
    Optional<CustomerBalance> findBalanceByCustomerId(@Param("customerId") Integer customerId);
}


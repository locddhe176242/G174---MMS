package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Warehouse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Integer> {

    Optional<Warehouse> findByCodeAndDeletedAtIsNull(String code);

    boolean existsByCodeAndDeletedAtIsNull(String code);

    List<Warehouse> findAll();
    Page<Warehouse> findAll(Pageable pageable);

    List<Warehouse> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCaseOrLocationContainingIgnoreCaseAndDeletedAtIsNull(
            String name, String code, String location);

    Page<Warehouse> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCaseOrLocationContainingIgnoreCaseAndDeletedAtIsNull(
            String name, String code, String location, Pageable pageable);
}

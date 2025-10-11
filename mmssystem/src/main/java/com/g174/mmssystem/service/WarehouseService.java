package com.g174.mmssystem.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.g174.mmssystem.dto.responseDTO.*;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.Warehouse;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.repository.WarehouseRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class WarehouseService {

    private final WarehouseRepository repository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().equals("anonymousUser")) {
            return null;
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với email: " + auth.getName()));
    }

    public Warehouse addWarehouse(Warehouse warehouse) {
        if (repository.existsByCode(warehouse.getCode())) {
            throw new IllegalArgumentException("Warehouse code already exists");
        }
        User currentUser = getCurrentUser();

        warehouse.setCreatedAt(LocalDateTime.now());
        warehouse.setUpdatedAt(LocalDateTime.now());
        warehouse.setStatus(Warehouse.Status.Active);
        warehouse.setCreatedBy(currentUser);
        warehouse.setUpdatedBy(currentUser);

        return repository.save(warehouse);
    }

    @Transactional(readOnly = true)
    public List<WarehouseResponseDTO> getAllWarehouses() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public WarehouseResponseDTO getWarehouseDetail(Long id) {
        Warehouse w = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found with ID: " + id));
        return toResponse(w);
    }

    public Warehouse updateWarehouse(Long id, Warehouse updated) {
        Warehouse existing = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found with ID: " + id));

        if (!existing.getCode().equals(updated.getCode())
                && repository.existsByCode(updated.getCode())) {
            throw new IllegalArgumentException("Warehouse code already exists");
        }

        User currentUser = getCurrentUser();

        existing.setCode(updated.getCode());
        existing.setName(updated.getName());
        existing.setLocation(updated.getLocation());
        existing.setStatus(updated.getStatus());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(currentUser);

        return repository.save(existing);
    }

    public Warehouse deactivateWarehouse(Long id) {
        User currentUser = getCurrentUser();
        Warehouse warehouse = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found with ID: " + id));

        warehouse.setStatus(Warehouse.Status.Inactive);
        warehouse.setDeletedAt(LocalDateTime.now());
        warehouse.setUpdatedBy(currentUser);
        return repository.save(warehouse);
    }

    private WarehouseResponseDTO toResponse(Warehouse w) {
        return new WarehouseResponseDTO(
                w.getWarehouseId(),
                w.getCode(),
                w.getName(),
                w.getLocation(),
                w.getStatus(),
                w.getCreatedAt(),
                w.getUpdatedAt(),
                w.getDeletedAt(),
                w.getCreatedBy() != null ? w.getCreatedBy().getUsername() : null,
                w.getUpdatedBy() != null ? w.getUpdatedBy().getUsername() : null
        );
    }
}

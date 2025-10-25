package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.WarehouseRequestDTO;
import com.g174.mmssystem.dto.responseDTO.WarehouseResponseDTO;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.Warehouse;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.repository.WarehouseRepository;
import com.g174.mmssystem.service.IService.IWarehouseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WarehouseServiceImpl implements IWarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;

    @Override
    public WarehouseResponseDTO createWarehouse(WarehouseRequestDTO dto, Integer createdById) {
        log.info("Creating new warehouse: {} - Code: {}", dto.getName(), dto.getCode());

        if (warehouseRepository.existsByCodeAndDeletedAtIsNull(dto.getCode())) {
            throw new DuplicateResourceException("Warehouse code already exists: " + dto.getCode());
        }

        Warehouse warehouse = new Warehouse();
        warehouse.setCode(dto.getCode());
        warehouse.setName(dto.getName());
        warehouse.setLocation(dto.getLocation());
        warehouse.setStatus(Warehouse.Status.valueOf(dto.getStatus() == null ? "Active" : dto.getStatus()));


        User creator = resolveUser(createdById);
        warehouse.setCreatedBy(creator);

        Warehouse saved = warehouseRepository.save(warehouse);
        log.info("Warehouse created successfully with ID: {}", saved.getWarehouseId());
        return convertToResponseDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponseDTO getWarehouseById(Integer id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));
        return convertToResponseDTO(warehouse);
    }


    @Override
    @Transactional(readOnly = true)
    public WarehouseResponseDTO getWarehouseByCode(String code) {
        Warehouse warehouse = warehouseRepository.findByCodeAndDeletedAtIsNull(code)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with code: " + code));
        return convertToResponseDTO(warehouse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponseDTO> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseResponseDTO> getAllWarehouses(Pageable pageable) {
        return warehouseRepository.findAll(pageable)
                .map(this::convertToResponseDTO);
    }


    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponseDTO> searchWarehouses(String keyword) {
        if (keyword == null || keyword.trim().isEmpty())
            return getAllWarehouses();

        String key = keyword.trim();
        return warehouseRepository
                .findByNameContainingIgnoreCaseOrCodeContainingIgnoreCaseOrLocationContainingIgnoreCaseAndDeletedAtIsNull(key, key, key)
                .stream().map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseResponseDTO> searchWarehouses(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty())
            return getAllWarehouses(pageable);

        String key = keyword.trim();
        return warehouseRepository
                .findByNameContainingIgnoreCaseOrCodeContainingIgnoreCaseOrLocationContainingIgnoreCaseAndDeletedAtIsNull(key, key, key, pageable)
                .map(this::convertToResponseDTO);
    }

    @Override
    public WarehouseResponseDTO updateWarehouse(Integer id, WarehouseRequestDTO dto, Integer updatedById) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));

        if (warehouse.getStatus() == Warehouse.Status.Inactive) {
            throw new IllegalStateException("Không thể cập nhật kho đã bị khóa (Inactive).");
        }

        if (!warehouse.getCode().equals(dto.getCode()) &&
                warehouseRepository.existsByCodeAndDeletedAtIsNull(dto.getCode())) {
            throw new DuplicateResourceException("Warehouse code already exists: " + dto.getCode());
        }
        warehouse.setCode(dto.getCode());
        warehouse.setName(dto.getName());
        warehouse.setLocation(dto.getLocation());
        warehouse.setStatus(Warehouse.Status.valueOf(dto.getStatus() == null ? "Active" : dto.getStatus()));

        User updater = resolveUser(updatedById);
        warehouse.setUpdatedBy(updater);

        Warehouse updated = warehouseRepository.save(warehouse);
        log.info("Warehouse updated successfully with ID: {}", updated.getWarehouseId());
        return convertToResponseDTO(updated);
    }


    @Override
    public WarehouseResponseDTO deactivateWarehouse(Integer id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .filter(w -> w.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));

        warehouse.setStatus(Warehouse.Status.Inactive);
        warehouse.setDeletedAt(Instant.now());

        User updater = resolveUser(null);
        warehouse.setUpdatedBy(updater);

        Warehouse saved = warehouseRepository.save(warehouse);
        log.info("Warehouse deactivated successfully with ID: {}", id);

        return convertToResponseDTO(saved);
    }

    @Override
    public WarehouseResponseDTO restoreWarehouse(Integer id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));

        warehouse.setStatus(Warehouse.Status.Active);
        warehouse.setDeletedAt(null);

        User updater = resolveUser(null);
        warehouse.setUpdatedBy(updater);

        Warehouse saved = warehouseRepository.save(warehouse);
        log.info("Warehouse restored successfully with ID: {}", id);

        return convertToResponseDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByCode(String code) {
        return warehouseRepository.existsByCodeAndDeletedAtIsNull(code);
    }

    private WarehouseResponseDTO convertToResponseDTO(Warehouse w) {
        WarehouseResponseDTO dto = new WarehouseResponseDTO();
        dto.setWarehouseId(w.getWarehouseId());
        dto.setCode(w.getCode());
        dto.setName(w.getName());
        dto.setLocation(w.getLocation());
        dto.setStatus(w.getStatus().name());
        dto.setCreatedAt(w.getCreatedAt());
        dto.setUpdatedAt(w.getUpdatedAt());
        dto.setDeletedAt(w.getDeletedAt());

        if (w.getCreatedBy() != null) {
            WarehouseResponseDTO.UserInfo created = new WarehouseResponseDTO.UserInfo();
            created.setUserId(w.getCreatedBy().getId());
            created.setUsername(w.getCreatedBy().getUsername());
            created.setEmail(w.getCreatedBy().getEmail());
            dto.setCreatedBy(created);
        }

        if (w.getUpdatedBy() != null) {
            WarehouseResponseDTO.UserInfo updated = new WarehouseResponseDTO.UserInfo();
            updated.setUserId(w.getUpdatedBy().getId());
            updated.setUsername(w.getUpdatedBy().getUsername());
            updated.setEmail(w.getUpdatedBy().getEmail());
            dto.setUpdatedBy(updated);
        }

        return dto;
    }

    private User resolveUser(Integer userId) {
        try {
            if (userId != null) {
                return userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
            } else {
                // fallback user mặc định (admin id = 1)
                return userRepository.findById(1)
                        .orElseThrow(() -> new ResourceNotFoundException("Default admin user not found (ID=1)"));
            }
        } catch (Exception ex) {
            log.warn("⚠️ Could not resolve user: {}", ex.getMessage());
            return null;
        }
    }

    @Override
    public WarehouseResponseDTO deleteWarehouse(Integer warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + warehouseId));

        warehouseRepository.delete(warehouse);
        log.info("Warehouse deleted permanently with ID: {}", warehouseId);
        return convertToResponseDTO(warehouse);
    }

}

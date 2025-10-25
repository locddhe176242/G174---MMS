package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.WarehouseRequestDTO;
import com.g174.mmssystem.dto.responseDTO.WarehouseResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IWarehouseService {

    WarehouseResponseDTO createWarehouse(WarehouseRequestDTO warehouseRequestDTO, Integer createdById);

    WarehouseResponseDTO getWarehouseById(Integer warehouseId);

    WarehouseResponseDTO getWarehouseByCode(String code);

    List<WarehouseResponseDTO> getAllWarehouses();

    Page<WarehouseResponseDTO> getAllWarehouses(Pageable pageable);

    List<WarehouseResponseDTO> searchWarehouses(String keyword);

    Page<WarehouseResponseDTO> searchWarehouses(String keyword, Pageable pageable);

    WarehouseResponseDTO updateWarehouse(Integer warehouseId, WarehouseRequestDTO warehouseRequestDTO, Integer updatedById);

    WarehouseResponseDTO deactivateWarehouse(Integer warehouseId);

    WarehouseResponseDTO restoreWarehouse(Integer warehouseId);

    WarehouseResponseDTO deleteWarehouse(Integer warehouseId);


    boolean existsByCode(String code);
}

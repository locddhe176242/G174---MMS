package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IPurchaseRequisitionService {
    PurchaseRequisitionResponseDTO createRequisition(PurchaseRequisitionRequestDTO dto, Integer requesterId);

    PurchaseRequisitionResponseDTO getRequisitionById(Integer requisitionId);

    List<PurchaseRequisitionResponseDTO> getAllRequisitions();

    Page<PurchaseRequisitionResponseDTO> getAllRequisitions(Pageable pageable);

    List<PurchaseRequisitionResponseDTO> searchRequisitions(String keyword);

    Page<PurchaseRequisitionResponseDTO> searchRequisitions(String keyword, Pageable pageable);

    PurchaseRequisitionResponseDTO updateRequisition(Integer requisitionId, PurchaseRequisitionRequestDTO dto, Integer updatedById);

    PurchaseRequisitionResponseDTO approveRequisition(Integer requisitionId, Integer approverId);

    PurchaseRequisitionResponseDTO rejectRequisition(Integer requisitionId, Integer approverId, String reason);

    PurchaseRequisitionResponseDTO closeRequisition(Integer requisitionId);

    PurchaseRequisitionResponseDTO restoreRequisition(Integer requisitionId);

    PurchaseRequisitionResponseDTO deleteRequisition(Integer requisitionId);

    boolean existsByRequisitionNo(String requisitionNo);
    
    String generateRequisitionNo();
}

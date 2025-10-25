package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IPurchaseRequisitionService {

    String generateNextRequisitionNumber();

    PurchaseRequisitionResponseDTO createPurchaseRequisition(PurchaseRequisitionRequestDTO requestDTO);

    PurchaseRequisitionResponseDTO updatePurchaseRequisition(Integer id, PurchaseRequisitionRequestDTO requestDTO);

    PurchaseRequisitionResponseDTO getPurchaseRequisitionById(Integer id);
    PurchaseRequisitionResponseDTO getPurchaseRequisitionByNumber(String requisitionNo);

    Page<PurchaseRequisitionResponseDTO> getAllPurchaseRequisitions(Pageable pageable);

    Page<PurchaseRequisitionResponseDTO> searchPurchaseRequisitions(String keyword, Pageable pageable);

    Page<PurchaseRequisitionResponseDTO> getPurchaseRequisitionsByStatus(String status, Pageable pageable);

    Page<PurchaseRequisitionResponseDTO> getPurchaseRequisitionsByRequester(Integer requesterId, Pageable pageable);

    Page<PurchaseRequisitionResponseDTO> getPurchaseRequisitionsByApprover(Integer approverId, Pageable pageable);

    void deletePurchaseRequisition(Integer id);

    boolean existsByRequisitionNumber(String requisitionNo);
}
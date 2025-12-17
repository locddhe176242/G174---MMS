package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.GoodIssueRequestDTO;
import com.g174.mmssystem.dto.responseDTO.GoodIssueResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IGoodIssueService {
    GoodIssueResponseDTO createIssue(GoodIssueRequestDTO dto, Integer createdById);

    GoodIssueResponseDTO createIssueFromDelivery(Integer deliveryId, GoodIssueRequestDTO dto, Integer createdById);

    GoodIssueResponseDTO getIssueById(Integer issueId);

    List<GoodIssueResponseDTO> getAllIssues();

    Page<GoodIssueResponseDTO> getAllIssues(Pageable pageable);

    List<GoodIssueResponseDTO> searchIssues(String keyword);

    Page<GoodIssueResponseDTO> searchIssues(String keyword, Pageable pageable);

    List<GoodIssueResponseDTO> getIssuesByDeliveryId(Integer deliveryId);

    List<GoodIssueResponseDTO> getIssuesByWarehouseId(Integer warehouseId);

    GoodIssueResponseDTO updateIssue(Integer issueId, GoodIssueRequestDTO dto, Integer updatedById);

    GoodIssueResponseDTO submitForApproval(Integer issueId, Integer submittedById);

    GoodIssueResponseDTO deleteIssue(Integer issueId);

    boolean existsByIssueNo(String issueNo);

    String generateIssueNo();
}

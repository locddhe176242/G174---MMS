package com.g174.mmssystem.controller;

import com.g174.mmssystem.dto.requestDTO.PurchaseRequisitionRequestDTO;
import com.g174.mmssystem.dto.responseDTO.PurchaseRequisitionResponseDTO;
import com.g174.mmssystem.service.IService.IPurchaseRequisitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-requisitions")
@RequiredArgsConstructor
@Slf4j
public class PurchaseRequisitionController {

    private final IPurchaseRequisitionService purchaseRequisitionService;

    @GetMapping("/generate-number")
    public ResponseEntity<Map<String, Object>> generateRequisitionNumber() {
        log.info("API: Generate requisition number");

        try {
            String requisitionNo = purchaseRequisitionService.generateNextRequisitionNumber();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Generated requisition number successfully");
            response.put("requisition_no", requisitionNo);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating requisition number: ", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error generating requisition number: " + e.getMessage());

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createPurchaseRequisition(@Valid @RequestBody PurchaseRequisitionRequestDTO requestDTO) {
        log.info("API: Create purchase requisition");

        try {
            PurchaseRequisitionResponseDTO responseDTO = purchaseRequisitionService.createPurchaseRequisition(requestDTO);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Purchase requisition created successfully");
            response.put("data", responseDTO);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating purchase requisition: ", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error creating purchase requisition: " + e.getMessage());

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updatePurchaseRequisition(
            @PathVariable Integer id,
            @Valid @RequestBody PurchaseRequisitionRequestDTO requestDTO) {
        log.info("API: Update purchase requisition with ID: {}", id);

        try {
            PurchaseRequisitionResponseDTO responseDTO = purchaseRequisitionService.updatePurchaseRequisition(id, requestDTO);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Purchase requisition updated successfully");
            response.put("data", responseDTO);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating purchase requisition: ", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error updating purchase requisition: " + e.getMessage());

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPurchaseRequisitionById(@PathVariable Integer id) {
        log.info("API: Get purchase requisition by ID: {}", id);

        try {
            PurchaseRequisitionResponseDTO responseDTO = purchaseRequisitionService.getPurchaseRequisitionById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Purchase requisition retrieved successfully");
            response.put("data", responseDTO);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting purchase requisition: ", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error getting purchase requisition: " + e.getMessage());

            return ResponseEntity.internalServerError().body(response);
        }
    }
}
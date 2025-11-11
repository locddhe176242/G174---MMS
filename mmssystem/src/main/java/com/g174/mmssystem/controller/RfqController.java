package com.g174.mmssystem.controller;

import com.g174.mmssystem.annotation.LogActivity;
import com.g174.mmssystem.dto.requestDTO.RfqRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RfqResponseDTO;
import com.g174.mmssystem.service.IService.IRfqService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase/rfqs")
public class RfqController {

    private final IRfqService rfqService;

    public RfqController(IRfqService rfqService) {
        this.rfqService = rfqService;
    }

    // Lấy danh sách RFQ có phân trang
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Page<RfqResponseDTO>> getRfqs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort
    ) {
        return ResponseEntity.ok(rfqService.getRfqs(page, size, sort));
    }

    // Tìm kiếm RFQ theo keyword (rfqNo/status/notes) + phân trang
    @GetMapping("/search")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Page<RfqResponseDTO>> searchRfqs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort
    ) {
        return ResponseEntity.ok(rfqService.searchRfqs(keyword, page, size, sort));
    }

    // Lấy chi tiết một RFQ theo id
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<RfqResponseDTO> getRfq(@PathVariable Integer id) {
        return ResponseEntity.ok(rfqService.getRfq(id));
    }

    // Sinh số RFQ tự động (client có thể gọi để điền sẵn)
    @GetMapping("/generate-number")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<String> generateNumber() {
        return ResponseEntity.ok(rfqService.generateNumber());
    }

    // Tạo mới RFQ
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "CREATE_RFQ",
            activityType = "RFQ_MANAGEMENT",
            description = "Tạo RFQ mới: #{#request.rfqNo ?: 'auto'}"
    )
    public ResponseEntity<RfqResponseDTO> createRfq(@Valid @RequestBody RfqRequestDTO request) {
        return ResponseEntity.ok(rfqService.createRfq(request));
    }

    // Cập nhật RFQ
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "UPDATE_RFQ",
            activityType = "RFQ_MANAGEMENT",
            description = "Cập nhật RFQ: #{#id}",
            entityId = "#id"
    )
    public ResponseEntity<RfqResponseDTO> updateRfq(@PathVariable Integer id, @Valid @RequestBody RfqRequestDTO request) {
        return ResponseEntity.ok(rfqService.updateRfq(id, request));
    }

    // Xóa mềm RFQ (đánh dấu deleted_at)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @LogActivity(
            action = "DELETE_RFQ",
            activityType = "RFQ_MANAGEMENT",
            description = "Xóa RFQ: #{#id}",
            entityId = "#id"
    )
    public ResponseEntity<Void> deleteRfq(@PathVariable Integer id) {
        rfqService.deleteRfq(id);
        return ResponseEntity.noContent().build();
    }
}



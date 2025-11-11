package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.RfqRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RfqResponseDTO;
import com.g174.mmssystem.entity.Rfq;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.Vendor;
import com.g174.mmssystem.mapper.RfqMapper;
import com.g174.mmssystem.repository.RfqRepository;
import com.g174.mmssystem.repository.UserRepository;
import com.g174.mmssystem.repository.VendorRepository;
import com.g174.mmssystem.service.IService.IRfqService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class RfqServiceImpl implements IRfqService {

    // Service thực thi nghiệp vụ RFQ:
    // - Kiểm tra dữ liệu đầu vào (ngày tháng, trùng số RFQ)
    // - Ánh xạ DTO <-> Entity
    // - Soft delete
    // - Phân trang, tìm kiếm
    private final RfqRepository rfqRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final RfqMapper rfqMapper;

    public RfqServiceImpl(RfqRepository rfqRepository,
                          VendorRepository vendorRepository,
                          UserRepository userRepository,
                          RfqMapper rfqMapper) {
        this.rfqRepository = rfqRepository;
        this.vendorRepository = vendorRepository;
        this.userRepository = userRepository;
        this.rfqMapper = rfqMapper;
    }

    // Lấy danh sách RFQ (phân trang + sắp xếp)
    @Override
    public Page<RfqResponseDTO> getRfqs(int page, int size, String sort) {
        Pageable pageable = buildPageRequest(page, size, sort);
        Page<Rfq> result = rfqRepository.findAllActive(pageable);
        return result.map(rfqMapper::toResponseDTO);
    }

    // Tìm kiếm RFQ theo keyword (rfqNo/status/notes) kèm phân trang
    @Override
    public Page<RfqResponseDTO> searchRfqs(String keyword, int page, int size, String sort) {
        Pageable pageable = buildPageRequest(page, size, sort);
        if (keyword == null || keyword.isBlank()) {
            return getRfqs(page, size, sort);
        }
        Page<Rfq> result = rfqRepository.searchActive(keyword.trim(), pageable);
        return result.map(rfqMapper::toResponseDTO);
    }

    // Lấy chi tiết RFQ theo id (không trả về nếu đã bị xóa mềm)
    @Override
    public RfqResponseDTO getRfq(Integer id) {
        Rfq rfq = rfqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy RFQ với ID: " + id));
        if (rfq.getDeletedAt() != null) {
            throw new RuntimeException("RFQ đã bị xóa");
        }
        return rfqMapper.toResponseDTO(rfq);
    }

    // Tạo mới RFQ (validate ngày, check trùng số RFQ, ánh xạ và lưu)
    @Override
    @Transactional
    public RfqResponseDTO createRfq(RfqRequestDTO request) {
        // Validate ngày: dueDate phải sau hoặc bằng issueDate
        validateDates(request.getIssueDate(), request.getDueDate());

        // Nếu client gửi rfqNo thì kiểm tra trùng (có soft delete)
        if (request.getRfqNo() != null && rfqRepository.existsByRfqNoAndDeletedAtIsNull(request.getRfqNo())) {
            throw new RuntimeException("Số RFQ đã tồn tại: " + request.getRfqNo());
        }

        // Người tạo lấy từ context đăng nhập
        User creator = getCurrentUser();
        // Load danh sách vendor từ IDs (nếu có)
        Set<Vendor> vendors = loadVendors(request.getSelectedVendorIds());

        Rfq rfq = rfqMapper.toEntity(request, creator, vendors);
        Rfq saved = rfqRepository.save(rfq);
        return rfqMapper.toResponseDTO(saved);
    }

    // Cập nhật RFQ (validate ngày, check trùng rfqNo nếu đổi, ghi đè items)
    @Override
    @Transactional
    public RfqResponseDTO updateRfq(Integer id, RfqRequestDTO request) {
        validateDates(request.getIssueDate(), request.getDueDate());

        Rfq rfq = rfqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy RFQ với ID: " + id));
        if (rfq.getDeletedAt() != null) {
            throw new RuntimeException("Không thể cập nhật RFQ đã bị xóa");
        }

        // Nếu đổi rfqNo thì kiểm tra trùng
        if (request.getRfqNo() != null
                && !request.getRfqNo().equals(rfq.getRfqNo())
                && rfqRepository.existsByRfqNoAndDeletedAtIsNull(request.getRfqNo())) {
            throw new RuntimeException("Số RFQ đã tồn tại: " + request.getRfqNo());
        }

        Set<Vendor> vendors = loadVendors(request.getSelectedVendorIds());
        rfqMapper.updateEntityFromDTO(rfq, request, vendors);
        Rfq updated = rfqRepository.save(rfq);
        return rfqMapper.toResponseDTO(updated);
    }

    // Xóa mềm RFQ (set deletedAt)
    @Override
    @Transactional
    public void deleteRfq(Integer id) {
        Rfq rfq = rfqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy RFQ với ID: " + id));
        if (rfq.getDeletedAt() != null) {
            throw new RuntimeException("RFQ đã bị xóa");
        }
        // Xóa mềm (đánh dấu thời điểm xóa)
        rfq.setDeletedAt(LocalDateTime.now());
        rfqRepository.save(rfq);
    }

    // Sinh số RFQ dạng RFQ-YYMMDD-XXXX (đơn giản)
    @Override
    public String generateNumber() {
        // Sinh số đơn giản: RFQ-YYMMDD-XXXX
        String datePart = java.time.format.DateTimeFormatter.ofPattern("yyMMdd").format(LocalDate.now());
        String rand = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "RFQ-" + datePart + "-" + rand;
    }

    private Pageable buildPageRequest(int page, int size, String sort) {
        if (sort == null || sort.isBlank()) {
            return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        String[] parts = sort.split(",");
        String field = parts[0];
        Sort.Direction dir = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1])) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(dir, field));
        }

    private void validateDates(LocalDate issue, LocalDate due) {
        if (issue != null && due != null && due.isBefore(issue)) {
            throw new RuntimeException("Hạn phản hồi phải sau Ngày phát hành");
        }
    }

    private Set<Vendor> loadVendors(List<Integer> vendorIds) {
        if (vendorIds == null || vendorIds.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(vendorRepository.findAllById(vendorIds));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));
    }

}



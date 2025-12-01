package com.g174.mmssystem.service.IService;
import com.g174.mmssystem.dto.requestDTO.VendorRequestDTO;
import com.g174.mmssystem.dto.responseDTO.VendorResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Map;
public interface IVendorService {
    VendorResponseDTO createVendor(VendorRequestDTO vendorRequestDTO);
    VendorResponseDTO getVendorById(Integer vendorId);
    VendorResponseDTO getVendorByCode(String vendorCode);
    List<VendorResponseDTO> getAllVendors();
    Page<VendorResponseDTO> getAllVendors(Pageable pageable);
    List<VendorResponseDTO> searchVendors(String keyword);
    Page<VendorResponseDTO> searchVendors(String keyword, Pageable pageable);
    VendorResponseDTO updateVendor(Integer vendorId, VendorRequestDTO vendorRequestDTO);
    void deleteVendor(Integer vendorId);
    void restoreVendor(Integer vendorId);
    boolean existsByVendorCode(String vendorCode);
    String generateNextVendorCode();
    Map<String, Object> getVendorBalance(Integer vendorId);
    Map<String, Object> getVendorDocuments(Integer vendorId);
}
package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.RfqRequestDTO;
import com.g174.mmssystem.dto.responseDTO.RfqResponseDTO;
import org.springframework.data.domain.Page;

public interface IRfqService {
    Page<RfqResponseDTO> getRfqs(int page, int size, String sort);
    Page<RfqResponseDTO> searchRfqs(String keyword, int page, int size, String sort);
    RfqResponseDTO getRfq(Integer id);
    RfqResponseDTO createRfq(RfqRequestDTO request);
    RfqResponseDTO updateRfq(Integer id, RfqRequestDTO request);
    void deleteRfq(Integer id);
    String generateNumber();
}



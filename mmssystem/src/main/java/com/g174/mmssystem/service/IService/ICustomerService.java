package com.g174.mmssystem.service.IService;

import com.g174.mmssystem.dto.requestDTO.CustomerRequestDTO;
import com.g174.mmssystem.dto.responseDTO.CustomerResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.g174.mmssystem.dto.responseDTO.CustomerDetailResponseDTO;
import com.g174.mmssystem.dto.requestDTO.CustomerFormRequestDTO;

import java.util.List;

public interface ICustomerService {
    String generateNextCustomerCode();
    CustomerResponseDTO createCustomer(CustomerRequestDTO customerRequestDTO);
    CustomerResponseDTO getCustomerById(Integer customerId);
    List<CustomerResponseDTO> getAllCustomers();
    Page<CustomerResponseDTO> getAllCustomers(Pageable pageable);
    List<CustomerResponseDTO> searchCustomers(String keyword);
    Page<CustomerResponseDTO> searchCustomers(String keyword, Pageable pageable);
    CustomerResponseDTO updateCustomer(Integer customerId, CustomerRequestDTO customerRequestDTO);
    void deleteCustomer(Integer customerId);
    void restoreCustomer(Integer customerId);
    CustomerDetailResponseDTO getCustomerDetailById(Integer customerId);
    CustomerResponseDTO updateCustomerForm(Integer customerId, CustomerFormRequestDTO customerFormRequestDTO);
    boolean existsByCustomerCode(String customerCode);
    CustomerResponseDTO getCustomerByCode(String customerCode);
}
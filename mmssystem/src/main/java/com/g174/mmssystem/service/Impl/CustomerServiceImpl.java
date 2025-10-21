package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.AddressDTO;
import com.g174.mmssystem.dto.requestDTO.ContactDTO;
import com.g174.mmssystem.dto.requestDTO.CustomerFormRequestDTO;
import com.g174.mmssystem.dto.requestDTO.CustomerRequestDTO;
import com.g174.mmssystem.dto.responseDTO.CustomerDetailResponseDTO;
import com.g174.mmssystem.dto.responseDTO.CustomerResponseDTO;
import com.g174.mmssystem.dto.responseDTO.TransactionSummaryDTO;
import com.g174.mmssystem.dto.responseDTO.TransactionSummaryProjection;
import com.g174.mmssystem.entity.*;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.repository.*;
import com.g174.mmssystem.service.IService.ICustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CustomerServiceImpl implements ICustomerService {

    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final ContactRepository contactRepository;
    private final SalesQuotationRepository salesQuotationRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ARInvoiceRepository arInvoiceRepository;

    @Override
    @Transactional
    public String generateNextCustomerCode() {
        log.info("Generating next customer code");

        // Lấy max number từ tất cả customers (kể cả đã xóa)
        Integer maxNumber = customerRepository.getMaxCustomerCodeNumber();
        int nextNumber = (maxNumber == null ? 0 : maxNumber) + 1;

        String customerCode = String.format("KH%03d", nextNumber);

        // Kiểm tra xem code có tồn tại trong active customers không
        while (customerRepository.existsByCustomerCodeAndDeletedAtIsNull(customerCode)) {
            nextNumber++;
            customerCode = String.format("KH%03d", nextNumber);
        }

        log.info("Generated customer code: {}", customerCode);
        return customerCode;
    }

    @Override
    public CustomerResponseDTO createCustomer(CustomerRequestDTO customerRequestDTO) {
        log.info("Creating new customer: {} {} with code: {}",
                customerRequestDTO.getFirstName(), customerRequestDTO.getLastName(), customerRequestDTO.getCustomerCode());

        // Auto generate code nếu chưa có
        if (customerRequestDTO.getCustomerCode() == null || customerRequestDTO.getCustomerCode().isEmpty()) {
            String generatedCode = generateNextCustomerCode();
            customerRequestDTO.setCustomerCode(generatedCode);
            log.info("Auto-generated customer code: {}", generatedCode);
        }

        // Kiểm tra duplicate với retry logic
        String customerCode = customerRequestDTO.getCustomerCode();
        int retryCount = 0;
        int maxRetries = 10;

        while (customerRepository.existsByCustomerCode(customerCode) && retryCount < maxRetries) {
            retryCount++;
            customerCode = generateNextCustomerCode();
            log.warn("Customer code {} already exists, retrying with: {}", customerRequestDTO.getCustomerCode(), customerCode);
        }

        if (retryCount >= maxRetries) {
            throw new DuplicateResourceException("Unable to generate unique customer code after " + maxRetries + " attempts");
        }

        customerRequestDTO.setCustomerCode(customerCode);

        Customer customer = new Customer();
        customer.setFirstName(customerRequestDTO.getFirstName());
        customer.setLastName(customerRequestDTO.getLastName());
        customer.setCustomerCode(customerRequestDTO.getCustomerCode());
        customer.setNote(customerRequestDTO.getNote());

        if (customerRequestDTO.getAddress() != null) {
            Address address = createAddress(customerRequestDTO.getAddress());
            customer.setAddress(address);
        }

        if (customerRequestDTO.getContact() != null) {
            Contact contact = createContact(customerRequestDTO.getContact());
            customer.setContact(contact);
        }

        Customer savedCustomer = customerRepository.save(customer);
        log.info("Customer created successfully with ID: {}", savedCustomer.getCustomerId());

        return convertToResponseDTO(savedCustomer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponseDTO getCustomerById(Integer customerId) {
        log.info("Fetching customer with ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        if (customer.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Customer not found with ID: " + customerId);
        }

        return convertToResponseDTO(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponseDTO getCustomerByCode(String customerCode) {
        log.info("Fetching customer with code: {}", customerCode);

        Customer customer = customerRepository.findByCustomerCode(customerCode)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with code: " + customerCode));

        if (customer.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Customer not found with code: " + customerCode);
        }

        return convertToResponseDTO(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponseDTO> getAllCustomers() {
        log.info("Fetching all active customers");

        List<Customer> customers = customerRepository.findAllActiveCustomers();
        return customers.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponseDTO> getAllCustomers(Pageable pageable) {
        log.info("Fetching all active customers with pagination");

        Page<Customer> customers = customerRepository.findAllActiveCustomers(pageable);
        return customers.map(this::convertToResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponseDTO> searchCustomers(String keyword) {
        log.info("Searching customers with keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            log.warn("Search keyword is empty, returning all active customers");
            return getAllCustomers();
        }

        List<Customer> customers = customerRepository.searchCustomers(keyword.trim());
        return customers.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponseDTO> searchCustomers(String keyword, Pageable pageable) {
        log.info("Searching customers with keyword: {} and pagination", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            log.warn("Search keyword is empty, returning all active customers");
            return getAllCustomers(pageable);
        }

        Page<Customer> customers = customerRepository.searchCustomers(keyword.trim(), pageable);
        return customers.map(this::convertToResponseDTO);
    }

    @Override
    public CustomerResponseDTO updateCustomer(Integer customerId, CustomerRequestDTO customerRequestDTO) {
        log.info("Updating customer with ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        if (customer.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Customer not found with ID: " + customerId);
        }

        if (!customer.getCustomerCode().equals(customerRequestDTO.getCustomerCode()) &&
                customerRepository.existsByCustomerCodeAndDeletedAtIsNull(customerRequestDTO.getCustomerCode())) {
            throw new DuplicateResourceException("Customer code already exists: " + customerRequestDTO.getCustomerCode());
        }

        customer.setFirstName(customerRequestDTO.getFirstName());
        customer.setLastName(customerRequestDTO.getLastName());
        customer.setCustomerCode(customerRequestDTO.getCustomerCode());
        customer.setNote(customerRequestDTO.getNote());

        if (customerRequestDTO.getAddress() != null) {
            if (customer.getAddress() != null) {
                updateAddressFields(customer.getAddress(), customerRequestDTO.getAddress());
                log.debug("Updated existing address ID: {}", customer.getAddress().getAddressId());
            } else {
                Address address = createAddress(customerRequestDTO.getAddress());
                customer.setAddress(address);
                log.debug("Created new address ID: {}", address.getAddressId());
            }
        }

        if (customerRequestDTO.getContact() != null) {
            if (customer.getContact() != null) {
                updateContactFields(customer.getContact(), customerRequestDTO.getContact());
                log.debug("Updated existing contact ID: {}", customer.getContact().getContactId());
            } else {
                Contact contact = createContact(customerRequestDTO.getContact());
                customer.setContact(contact);
                log.debug("Created new contact ID: {}", contact.getContactId());
            }
        }

        Customer updatedCustomer = customerRepository.save(customer);
        log.info("Customer updated successfully with ID: {}", updatedCustomer.getCustomerId());

        return convertToResponseDTO(updatedCustomer);
    }

    @Override
    public void deleteCustomer(Integer customerId) {
        log.info("Soft deleting customer with ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        if (customer.getDeletedAt() != null) {
            log.warn("Customer with ID {} is already deleted", customerId);
            throw new ResourceNotFoundException("Customer not found with ID: " + customerId);
        }

        customer.setDeletedAt(Instant.now());
        customerRepository.save(customer);
        log.info("Customer soft deleted successfully with ID: {}", customerId);
    }

    @Override
    public void restoreCustomer(Integer customerId) {
        log.info("Restoring customer with ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        if (customer.getDeletedAt() == null) {
            log.warn("Customer with ID {} is not deleted, no need to restore", customerId);
        }

        customer.setDeletedAt(null);
        customerRepository.save(customer);
        log.info("Customer restored successfully with ID: {}", customerId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByCustomerCode(String customerCode) {
        return customerRepository.existsByCustomerCodeAndDeletedAtIsNull(customerCode);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDetailResponseDTO getCustomerDetailById(Integer customerId) {
        log.info("Fetching customer detail with ID: {}", customerId);

        Customer customer = customerRepository.findByIdWithDetails(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        if (customer.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Customer not found with ID: " + customerId);
        }

        // Get transaction summary
        TransactionSummaryProjection summary = customerRepository.getTransactionSummary(customerId);

        CustomerDetailResponseDTO detailDTO = new CustomerDetailResponseDTO();
        detailDTO.setCustomerId(customer.getCustomerId());
        detailDTO.setFirstName(customer.getFirstName());
        detailDTO.setLastName(customer.getLastName());
        detailDTO.setCustomerCode(customer.getCustomerCode());
        detailDTO.setNote(customer.getNote());
        detailDTO.setCreatedAt(customer.getCreatedAt());
        detailDTO.setUpdatedAt(customer.getUpdatedAt());

        // Set address
        if (customer.getAddress() != null) {
            CustomerDetailResponseDTO.AddressInfo addressInfo = new CustomerDetailResponseDTO.AddressInfo();
            addressInfo.setAddressId(customer.getAddress().getAddressId());
            addressInfo.setStreet(customer.getAddress().getStreet());
            addressInfo.setProvinceCode(customer.getAddress().getProvinceCode());
            addressInfo.setProvinceName(customer.getAddress().getProvinceName());
            addressInfo.setDistrictCode(customer.getAddress().getDistrictCode());
            addressInfo.setDistrictName(customer.getAddress().getDistrictName());
            addressInfo.setWardCode(customer.getAddress().getWardCode());
            addressInfo.setWardName(customer.getAddress().getWardName());
            addressInfo.setCountry(customer.getAddress().getCountry());
            detailDTO.setAddress(addressInfo);
        }

// Set contact
        if (customer.getContact() != null) {
            CustomerDetailResponseDTO.ContactInfo contactInfo = new CustomerDetailResponseDTO.ContactInfo();
            contactInfo.setContactId(customer.getContact().getContactId());
            contactInfo.setPhone(customer.getContact().getPhone());
            contactInfo.setEmail(customer.getContact().getEmail());
            contactInfo.setWebsite(customer.getContact().getWebsite());
            detailDTO.setContact(contactInfo);
        }

        // Set transaction summary
        if (summary != null) {
            TransactionSummaryDTO summaryDTO = new TransactionSummaryDTO();
            summaryDTO.setTotalQuotations(summary.getTotalQuotations());
            summaryDTO.setTotalQuotationAmount(summary.getTotalQuotationAmount() != null ? summary.getTotalQuotationAmount() : BigDecimal.ZERO);
            summaryDTO.setActiveQuotations(summary.getActiveQuotations());
            summaryDTO.setConvertedQuotations(summary.getConvertedQuotations());
            summaryDTO.setTotalOrders(summary.getTotalOrders());
            summaryDTO.setTotalOrderAmount(summary.getTotalOrderAmount() != null ? summary.getTotalOrderAmount() : BigDecimal.ZERO);
            summaryDTO.setPendingOrders(summary.getPendingOrders());
            summaryDTO.setApprovedOrders(summary.getApprovedOrders());
            summaryDTO.setFulfilledOrders(summary.getFulfilledOrders());
            summaryDTO.setTotalInvoices(summary.getTotalInvoices());
            summaryDTO.setTotalInvoiceAmount(summary.getTotalInvoiceAmount() != null ? summary.getTotalInvoiceAmount() : BigDecimal.ZERO);
            summaryDTO.setTotalPaidAmount(summary.getTotalPaidAmount() != null ? summary.getTotalPaidAmount() : BigDecimal.ZERO);
            summaryDTO.setTotalOutstandingAmount(summary.getTotalOutstandingAmount() != null ? summary.getTotalOutstandingAmount() : BigDecimal.ZERO);
            summaryDTO.setUnpaidInvoices(summary.getUnpaidInvoices());
            summaryDTO.setPaidInvoices(summary.getPaidInvoices());
            summaryDTO.setLastQuotationDate(summary.getLastQuotationDate());
            summaryDTO.setLastOrderDate(summary.getLastOrderDate());
            summaryDTO.setLastInvoiceDate(summary.getLastInvoiceDate());
            detailDTO.setTransactionSummary(summaryDTO);
        }

        return detailDTO;
    }

    @Override
    public CustomerResponseDTO updateCustomerForm(Integer customerId, CustomerFormRequestDTO customerFormRequestDTO) {
        log.info("Updating customer form with ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        if (customer.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Customer not found with ID: " + customerId);
        }

        customer.setFirstName(customerFormRequestDTO.getFirstName());
        customer.setLastName(customerFormRequestDTO.getLastName());
        customer.setNote(customerFormRequestDTO.getNote());

        if (customerFormRequestDTO.getAddress() != null) {
            if (customer.getAddress() != null) {
                updateAddressFields(customer.getAddress(), customerFormRequestDTO.getAddress());
                log.debug("Updated existing address ID: {}", customer.getAddress().getAddressId());
            } else {
                Address address = createAddress(customerFormRequestDTO.getAddress());
                customer.setAddress(address);
                log.debug("Created new address ID: {}", address.getAddressId());
            }
        }

        if (customerFormRequestDTO.getContact() != null) {
            if (customer.getContact() != null) {
                updateContactFields(customer.getContact(), customerFormRequestDTO.getContact());
                log.debug("Updated existing contact ID: {}", customer.getContact().getContactId());
            } else {
                Contact contact = createContact(customerFormRequestDTO.getContact());
                customer.setContact(contact);
                log.debug("Created new contact ID: {}", contact.getContactId());
            }
        }

        Customer updatedCustomer = customerRepository.save(customer);
        log.info("Customer form updated successfully with ID: {}", updatedCustomer.getCustomerId());

        return convertToResponseDTO(updatedCustomer);
    }

    private Address createAddress(AddressDTO addressDTO) {
        log.info("=== CREATING ADDRESS ===");
        log.info("AddressDTO received: {}", addressDTO);

        Address address = new Address();
        address.setStreet(addressDTO.getStreet());
        address.setProvinceCode(addressDTO.getProvinceCode());
        address.setProvinceName(addressDTO.getProvinceName());
        address.setDistrictCode(addressDTO.getDistrictCode());
        address.setDistrictName(addressDTO.getDistrictName());
        address.setWardCode(addressDTO.getWardCode());
        address.setWardName(addressDTO.getWardName());
        address.setCountry(addressDTO.getCountry());

        log.info("Address before save:");
        log.info("  street: {}", address.getStreet());
        log.info("  provinceCode: {}", address.getProvinceCode());
        log.info("  provinceName: {}", address.getProvinceName());
        log.info("  districtCode: {}", address.getDistrictCode());
        log.info("  districtName: {}", address.getDistrictName());
        log.info("  wardCode: {}", address.getWardCode());
        log.info("  wardName: {}", address.getWardName());
        log.info("  country: {}", address.getCountry());

        Address savedAddress = addressRepository.save(address);

        log.info("Address after save:");
        log.info("  addressId: {}", savedAddress.getAddressId());
        log.info("  street: {}", savedAddress.getStreet());
        log.info("  provinceCode: {}", savedAddress.getProvinceCode());
        log.info("  provinceName: {}", savedAddress.getProvinceName());
        log.info("  districtCode: {}", savedAddress.getDistrictCode());
        log.info("  districtName: {}", savedAddress.getDistrictName());
        log.info("  wardCode: {}", savedAddress.getWardCode());
        log.info("  wardName: {}", savedAddress.getWardName());
        log.info("  country: {}", savedAddress.getCountry());

        return savedAddress;
    }

    private void updateAddressFields(Address address, AddressDTO addressDTO) {
        address.setStreet(addressDTO.getStreet());
        address.setProvinceCode(addressDTO.getProvinceCode());
        address.setProvinceName(addressDTO.getProvinceName());
        address.setDistrictCode(addressDTO.getDistrictCode());
        address.setDistrictName(addressDTO.getDistrictName());
        address.setWardCode(addressDTO.getWardCode());
        address.setWardName(addressDTO.getWardName());
        address.setCountry(addressDTO.getCountry());
    }

    private Contact createContact(ContactDTO contactDTO) {
        Contact contact = new Contact();
        contact.setPhone(contactDTO.getPhone());
        contact.setEmail(contactDTO.getEmail());
        contact.setWebsite(contactDTO.getWebsite());
        return contactRepository.save(contact);
    }

    private void updateContactFields(Contact contact, ContactDTO contactDTO) {
        contact.setPhone(contactDTO.getPhone());
        contact.setEmail(contactDTO.getEmail());
        contact.setWebsite(contactDTO.getWebsite());
    }

    private CustomerResponseDTO convertToResponseDTO(Customer customer) {
        CustomerResponseDTO responseDTO = new CustomerResponseDTO();
        responseDTO.setCustomerId(customer.getCustomerId());
        responseDTO.setFirstName(customer.getFirstName());
        responseDTO.setLastName(customer.getLastName());
        responseDTO.setCustomerCode(customer.getCustomerCode());
        responseDTO.setNote(customer.getNote());
        responseDTO.setCreatedAt(customer.getCreatedAt());
        responseDTO.setUpdatedAt(customer.getUpdatedAt());

        if (customer.getAddress() != null) {
            CustomerResponseDTO.AddressInfo addressInfo = new CustomerResponseDTO.AddressInfo();
            addressInfo.setAddressId(customer.getAddress().getAddressId());
            addressInfo.setStreet(customer.getAddress().getStreet());
            addressInfo.setProvinceCode(customer.getAddress().getProvinceCode());
            addressInfo.setProvinceName(customer.getAddress().getProvinceName());
            addressInfo.setDistrictCode(customer.getAddress().getDistrictCode());
            addressInfo.setDistrictName(customer.getAddress().getDistrictName());
            addressInfo.setWardCode(customer.getAddress().getWardCode());
            addressInfo.setWardName(customer.getAddress().getWardName());
            addressInfo.setCountry(customer.getAddress().getCountry());
            responseDTO.setAddress(addressInfo);
        }

        if (customer.getContact() != null) {
            CustomerResponseDTO.ContactInfo contactInfo = new CustomerResponseDTO.ContactInfo();
            contactInfo.setContactId(customer.getContact().getContactId());
            contactInfo.setPhone(customer.getContact().getPhone());
            contactInfo.setEmail(customer.getContact().getEmail());
            contactInfo.setWebsite(customer.getContact().getWebsite());
            responseDTO.setContact(contactInfo);
        }

        return responseDTO;
    }
}
package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.AddressDTO;
import com.g174.mmssystem.dto.requestDTO.ContactDTO;
import com.g174.mmssystem.dto.requestDTO.CustomerRequestDTO;
import com.g174.mmssystem.dto.responseDTO.CustomerResponseDTO;
import com.g174.mmssystem.entity.Address;
import com.g174.mmssystem.entity.Contact;
import com.g174.mmssystem.entity.Customer;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.repository.AddressRepository;
import com.g174.mmssystem.repository.ContactRepository;
import com.g174.mmssystem.repository.CustomerRepository;
import com.g174.mmssystem.service.IService.ICustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    public CustomerResponseDTO createCustomer(CustomerRequestDTO customerRequestDTO) {
        log.info("Creating new customer: {} {}", customerRequestDTO.getFirstName(), customerRequestDTO.getLastName());

        Customer customer = new Customer();
        customer.setFirstName(customerRequestDTO.getFirstName());
        customer.setLastName(customerRequestDTO.getLastName());
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

        customer.setFirstName(customerRequestDTO.getFirstName());
        customer.setLastName(customerRequestDTO.getLastName());
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

    private Address createAddress(AddressDTO addressDTO) {
        Address address = new Address();
        address.setStreet(addressDTO.getStreet());
        address.setProvinceCode(addressDTO.getProvinceCode());
        address.setProvinceName(addressDTO.getProvinceName());
        address.setDistrictCode(addressDTO.getDistrictCode());
        address.setDistrictName(addressDTO.getDistrictName());
        address.setWardCode(addressDTO.getWardCode());
        address.setWardName(addressDTO.getWardName());
        address.setCountry(addressDTO.getCountry());
        return addressRepository.save(address);
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
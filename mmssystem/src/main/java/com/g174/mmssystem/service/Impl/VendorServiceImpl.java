package com.g174.mmssystem.service.Impl;

import com.g174.mmssystem.dto.requestDTO.AddressDTO;
import com.g174.mmssystem.dto.requestDTO.ContactDTO;
import com.g174.mmssystem.dto.requestDTO.VendorRequestDTO;
import com.g174.mmssystem.dto.responseDTO.VendorResponseDTO;
import com.g174.mmssystem.entity.Address;
import com.g174.mmssystem.entity.Contact;
import com.g174.mmssystem.entity.Vendor;
import com.g174.mmssystem.exception.DuplicateResourceException;
import com.g174.mmssystem.exception.ResourceNotFoundException;
import com.g174.mmssystem.repository.AddressRepository;
import com.g174.mmssystem.repository.ContactRepository;
import com.g174.mmssystem.repository.VendorRepository;
import com.g174.mmssystem.service.IService.IVendorService;
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
public class VendorServiceImpl implements IVendorService {

    private final VendorRepository vendorRepository;
    private final AddressRepository addressRepository;
    private final ContactRepository contactRepository;

    @Override
    @Transactional
    public String generateNextVendorCode() {
        log.info("Generating next vendor code");

        // Lấy max number từ tất cả vendors (kể cả đã xóa)
        Integer maxNumber = vendorRepository.getMaxVendorCodeNumber();
        int nextNumber = (maxNumber == null ? 0 : maxNumber) + 1;

        String vendorCode = String.format("NCC%03d", nextNumber);

        // Kiểm tra xem code có tồn tại trong active vendors không
        while (vendorRepository.existsByVendorCodeAndDeletedAtIsNull(vendorCode)) {
            nextNumber++;
            vendorCode = String.format("NCC%03d", nextNumber);
        }

        log.info("Generated vendor code: {}", vendorCode);
        return vendorCode;
    }

    @Override
    public VendorResponseDTO createVendor(VendorRequestDTO vendorRequestDTO) {
        log.info("Creating new vendor: {} with code: {}",
                vendorRequestDTO.getName(), vendorRequestDTO.getVendorCode());

        // Auto generate code nếu chưa có
        if (vendorRequestDTO.getVendorCode() == null || vendorRequestDTO.getVendorCode().isEmpty()) {
            String generatedCode = generateNextVendorCode();
            vendorRequestDTO.setVendorCode(generatedCode);
            log.info("Auto-generated vendor code: {}", generatedCode);
        }

        // Kiểm tra duplicate với retry logic
        String vendorCode = vendorRequestDTO.getVendorCode();
        int retryCount = 0;
        int maxRetries = 10;

        while (vendorRepository.existsByVendorCode(vendorCode) && retryCount < maxRetries) {
            retryCount++;
            vendorCode = generateNextVendorCode();
            log.warn("Vendor code {} already exists, retrying with: {}", vendorRequestDTO.getVendorCode(), vendorCode);
        }

        if (retryCount >= maxRetries) {
            throw new DuplicateResourceException("Unable to generate unique vendor code after " + maxRetries + " attempts");
        }

        vendorRequestDTO.setVendorCode(vendorCode);

        Vendor vendor = new Vendor();
        vendor.setName(vendorRequestDTO.getName());
        vendor.setVendorCode(vendorRequestDTO.getVendorCode());
        vendor.setNote(vendorRequestDTO.getNote());

        if (vendorRequestDTO.getAddress() != null) {
            Address address = createAddress(vendorRequestDTO.getAddress());
            vendor.setAddress(address);
        }

        if (vendorRequestDTO.getContact() != null) {
            Contact contact = createContact(vendorRequestDTO.getContact());
            vendor.setContact(contact);
        }

        Vendor savedVendor = vendorRepository.save(vendor);
        log.info("Vendor created successfully with ID: {}", savedVendor.getVendorId());

        return convertToResponseDTO(savedVendor);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorResponseDTO getVendorById(Integer vendorId) {
        log.info("Fetching vendor with ID: {}", vendorId);

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + vendorId));

        if (vendor.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Vendor not found with ID: " + vendorId);
        }

        return convertToResponseDTO(vendor);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorResponseDTO getVendorByCode(String vendorCode) {
        log.info("Fetching vendor with code: {}", vendorCode);

        Vendor vendor = vendorRepository.findByVendorCode(vendorCode)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with code: " + vendorCode));

        if (vendor.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Vendor not found with code: " + vendorCode);
        }

        return convertToResponseDTO(vendor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorResponseDTO> getAllVendors() {
        log.info("Fetching all active vendors");

        List<Vendor> vendors = vendorRepository.findAllActiveVendors();
        return vendors.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorResponseDTO> getAllVendors(Pageable pageable) {
        log.info("Fetching all active vendors with pagination");

        Page<Vendor> vendors = vendorRepository.findAllActiveVendors(pageable);
        return vendors.map(this::convertToResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorResponseDTO> searchVendors(String keyword) {
        log.info("Searching vendors with keyword: {}", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            log.warn("Search keyword is empty, returning all active vendors");
            return getAllVendors();
        }

        List<Vendor> vendors = vendorRepository.searchVendors(keyword.trim());
        return vendors.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorResponseDTO> searchVendors(String keyword, Pageable pageable) {
        log.info("Searching vendors with keyword: {} and pagination", keyword);

        if (keyword == null || keyword.trim().isEmpty()) {
            log.warn("Search keyword is empty, returning all active vendors");
            return getAllVendors(pageable);
        }

        Page<Vendor> vendors = vendorRepository.searchVendors(keyword.trim(), pageable);
        return vendors.map(this::convertToResponseDTO);
    }

    @Override
    public VendorResponseDTO updateVendor(Integer vendorId, VendorRequestDTO vendorRequestDTO) {
        log.info("Updating vendor with ID: {}", vendorId);

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + vendorId));

        if (vendor.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Vendor not found with ID: " + vendorId);
        }

        if (!vendor.getVendorCode().equals(vendorRequestDTO.getVendorCode()) &&
                vendorRepository.existsByVendorCodeAndDeletedAtIsNull(vendorRequestDTO.getVendorCode())) {
            throw new DuplicateResourceException("Vendor code already exists: " + vendorRequestDTO.getVendorCode());
        }

        vendor.setName(vendorRequestDTO.getName());
        vendor.setVendorCode(vendorRequestDTO.getVendorCode());
        vendor.setNote(vendorRequestDTO.getNote());

        if (vendorRequestDTO.getAddress() != null) {
            if (vendor.getAddress() != null) {
                updateAddressFields(vendor.getAddress(), vendorRequestDTO.getAddress());
                log.debug("Updated existing address ID: {}", vendor.getAddress().getAddressId());
            } else {
                Address address = createAddress(vendorRequestDTO.getAddress());
                vendor.setAddress(address);
                log.debug("Created new address ID: {}", address.getAddressId());
            }
        }

        if (vendorRequestDTO.getContact() != null) {
            if (vendor.getContact() != null) {
                updateContactFields(vendor.getContact(), vendorRequestDTO.getContact());
                log.debug("Updated existing contact ID: {}", vendor.getContact().getContactId());
            } else {
                Contact contact = createContact(vendorRequestDTO.getContact());
                vendor.setContact(contact);
                log.debug("Created new contact ID: {}", contact.getContactId());
            }
        }

        Vendor updatedVendor = vendorRepository.save(vendor);
        log.info("Vendor updated successfully with ID: {}", updatedVendor.getVendorId());

        return convertToResponseDTO(updatedVendor);
    }

    @Override
    public void deleteVendor(Integer vendorId) {
        log.info("Soft deleting vendor with ID: {}", vendorId);

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + vendorId));

        if (vendor.getDeletedAt() != null) {
            log.warn("Vendor with ID {} is already deleted", vendorId);
            throw new ResourceNotFoundException("Vendor not found with ID: " + vendorId);
        }

        vendor.setDeletedAt(Instant.now());
        vendorRepository.save(vendor);
        log.info("Vendor soft deleted successfully with ID: {}", vendorId);
    }

    @Override
    public void restoreVendor(Integer vendorId) {
        log.info("Restoring vendor with ID: {}", vendorId);

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + vendorId));

        if (vendor.getDeletedAt() == null) {
            log.warn("Vendor with ID {} is not deleted, no need to restore", vendorId);
        }

        vendor.setDeletedAt(null);
        vendorRepository.save(vendor);
        log.info("Vendor restored successfully with ID: {}", vendorId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByVendorCode(String vendorCode) {
        return vendorRepository.existsByVendorCodeAndDeletedAtIsNull(vendorCode);
    }

    private Address createAddress(AddressDTO addressDTO) {
        log.info("=== CREATING ADDRESS ===");
        log.info("AddressDTO received: {}", addressDTO);

        Address address = new Address();
        address.setStreet(addressDTO.getStreet());
        address.setProvinceCode(addressDTO.getProvinceCode());
        address.setProvinceName(addressDTO.getProvinceName());
        address.setWardCode(addressDTO.getWardCode());
        address.setWardName(addressDTO.getWardName());
        address.setCountry(addressDTO.getCountry());

        log.info("Address before save:");
        log.info("  street: {}", address.getStreet());
        log.info("  provinceCode: {}", address.getProvinceCode());
        log.info("  provinceName: {}", address.getProvinceName());
        log.info("  wardCode: {}", address.getWardCode());
        log.info("  wardName: {}", address.getWardName());
        log.info("  country: {}", address.getCountry());

        Address savedAddress = addressRepository.save(address);

        log.info("Address after save:");
        log.info("  addressId: {}", savedAddress.getAddressId());
        log.info("  street: {}", savedAddress.getStreet());
        log.info("  provinceCode: {}", savedAddress.getProvinceCode());
        log.info("  provinceName: {}", savedAddress.getProvinceName());
        log.info("  wardCode: {}", savedAddress.getWardCode());
        log.info("  wardName: {}", savedAddress.getWardName());
        log.info("  country: {}", savedAddress.getCountry());

        return savedAddress;
    }

    private void updateAddressFields(Address address, AddressDTO addressDTO) {
        address.setStreet(addressDTO.getStreet());
        address.setProvinceCode(addressDTO.getProvinceCode());
        address.setProvinceName(addressDTO.getProvinceName());
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

    private VendorResponseDTO convertToResponseDTO(Vendor vendor) {
        VendorResponseDTO responseDTO = new VendorResponseDTO();
        responseDTO.setVendorId(vendor.getVendorId());
        responseDTO.setName(vendor.getName());
        responseDTO.setVendorCode(vendor.getVendorCode());
        responseDTO.setNote(vendor.getNote());
        responseDTO.setCreatedAt(vendor.getCreatedAt());
        responseDTO.setUpdatedAt(vendor.getUpdatedAt());

        if (vendor.getAddress() != null) {
            VendorResponseDTO.AddressInfo addressInfo = new VendorResponseDTO.AddressInfo();
            addressInfo.setAddressId(vendor.getAddress().getAddressId());
            addressInfo.setStreet(vendor.getAddress().getStreet());
            addressInfo.setProvinceCode(vendor.getAddress().getProvinceCode());
            addressInfo.setProvinceName(vendor.getAddress().getProvinceName());
            addressInfo.setWardCode(vendor.getAddress().getWardCode());
            addressInfo.setWardName(vendor.getAddress().getWardName());
            addressInfo.setCountry(vendor.getAddress().getCountry());
            responseDTO.setAddress(addressInfo);
        }

        if (vendor.getContact() != null) {
            VendorResponseDTO.ContactInfo contactInfo = new VendorResponseDTO.ContactInfo();
            contactInfo.setContactId(vendor.getContact().getContactId());
            contactInfo.setPhone(vendor.getContact().getPhone());
            contactInfo.setEmail(vendor.getContact().getEmail());
            contactInfo.setWebsite(vendor.getContact().getWebsite());
            responseDTO.setContact(contactInfo);
        }

        return responseDTO;
    }
}
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
        address.setCity(addressDTO.getCity());
        address.setCountry(addressDTO.getCountry());
        return addressRepository.save(address);
    }

    private void updateAddressFields(Address address, AddressDTO addressDTO) {
        address.setStreet(addressDTO.getStreet());
        address.setCity(addressDTO.getCity());
        address.setCountry(addressDTO.getCountry());
    }

    // ============ HELPER METHODS FOR CONTACT ============
    private Contact createContact(ContactDTO contactDTO) {
        Contact contact = new Contact();
        contact.setPhone(contactDTO.getPhone());
        contact.setEmail(contactDTO.getEmail());
        return contactRepository.save(contact);
    }

    private void updateContactFields(Contact contact, ContactDTO contactDTO) {
        contact.setPhone(contactDTO.getPhone());
        contact.setEmail(contactDTO.getEmail());
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
            addressInfo.setCity(customer.getAddress().getCity());
            addressInfo.setCountry(customer.getAddress().getCountry());
            responseDTO.setAddress(addressInfo);
        }

        if (customer.getContact() != null) {
            CustomerResponseDTO.ContactInfo contactInfo = new CustomerResponseDTO.ContactInfo();
            contactInfo.setContactId(customer.getContact().getContactId());
            contactInfo.setPhone(customer.getContact().getPhone());
            contactInfo.setEmail(customer.getContact().getEmail());
            responseDTO.setContact(contactInfo);
        }

        return responseDTO;
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDetailResponseDTO getCustomerDetailById(Integer customerId) {
        log.info("Fetching customer detail with ID: {}", customerId);

        // Use optimized query with JOIN FETCH
        Customer customer = customerRepository.findByIdWithDetails(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        CustomerDetailResponseDTO responseDTO = new CustomerDetailResponseDTO();
        responseDTO.setCustomerId(customer.getCustomerId());
        responseDTO.setFirstName(customer.getFirstName());
        responseDTO.setLastName(customer.getLastName());
        responseDTO.setNote(customer.getNote());
        responseDTO.setCreatedAt(customer.getCreatedAt());
        responseDTO.setUpdatedAt(customer.getUpdatedAt());

        // Set address info (already fetched)
        if (customer.getAddress() != null) {
            CustomerDetailResponseDTO.AddressInfo addressInfo = new CustomerDetailResponseDTO.AddressInfo();
            addressInfo.setAddressId(customer.getAddress().getAddressId());
            addressInfo.setStreet(customer.getAddress().getStreet());
            addressInfo.setCity(customer.getAddress().getCity());
            addressInfo.setCountry(customer.getAddress().getCountry());
            responseDTO.setAddress(addressInfo);
        }

        // Set contact info (already fetched)
        if (customer.getContact() != null) {
            CustomerDetailResponseDTO.ContactInfo contactInfo = new CustomerDetailResponseDTO.ContactInfo();
            contactInfo.setContactId(customer.getContact().getContactId());
            contactInfo.setPhone(customer.getContact().getPhone());
            contactInfo.setEmail(customer.getContact().getEmail());
            responseDTO.setContact(contactInfo);
        }

        // Get transaction summary using single optimized query
        TransactionSummaryProjection summaryProjection = customerRepository.getTransactionSummary(customerId);
        TransactionSummaryDTO transactionSummary = convertToTransactionSummaryDTO(summaryProjection);
        responseDTO.setTransactionSummary(transactionSummary);

        // Get recent transactions using optimized queries
        List<CustomerDetailResponseDTO.QuotationSummaryDTO> recentQuotations = getRecentQuotationsOptimized(customerId);
        responseDTO.setRecentQuotations(recentQuotations);

        List<CustomerDetailResponseDTO.OrderSummaryDTO> recentOrders = getRecentOrdersOptimized(customerId);
        responseDTO.setRecentOrders(recentOrders);

        List<CustomerDetailResponseDTO.InvoiceSummaryDTO> recentInvoices = getRecentInvoicesOptimized(customerId);
        responseDTO.setRecentInvoices(recentInvoices);

        return responseDTO;
    }

    private List<CustomerDetailResponseDTO.QuotationSummaryDTO> getRecentQuotationsOptimized(Integer customerId) {
        log.debug("Getting recent quotations for customer ID: {}", customerId);

        List<SalesQuotation> quotations = salesQuotationRepository.findByCustomerIdOrderByDateDesc(customerId);

        return quotations.stream()
                .limit(5) // Database already sorted, just limit
                .map(this::convertToQuotationSummaryDTO)
                .collect(Collectors.toList());
    }

    private List<CustomerDetailResponseDTO.OrderSummaryDTO> getRecentOrdersOptimized(Integer customerId) {
        log.debug("Getting recent orders for customer ID: {}", customerId);

        List<SalesOrder> orders = salesOrderRepository.findByCustomerIdOrderByDateDesc(customerId);

        return orders.stream()
                .limit(5) // Database already sorted, just limit
                .map(this::convertToOrderSummaryDTO)
                .collect(Collectors.toList());
    }

    private List<CustomerDetailResponseDTO.InvoiceSummaryDTO> getRecentInvoicesOptimized(Integer customerId) {
        log.debug("Getting recent invoices for customer ID: {}", customerId);

        List<ARInvoice> invoices = arInvoiceRepository.findByCustomerIdOrderByDateDesc(customerId);

        return invoices.stream()
                .limit(5) // Database already sorted, just limit
                .map(this::convertToInvoiceSummaryDTO)
                .collect(Collectors.toList());
    }

    // Convert projection to DTO
    private TransactionSummaryDTO convertToTransactionSummaryDTO(TransactionSummaryProjection projection) {
        TransactionSummaryDTO summary = new TransactionSummaryDTO();
        summary.setCustomerId(projection.getTotalQuotations() != null ? 1 : 0); // Will be set properly
        summary.setTotalQuotations(projection.getTotalQuotations() != null ? projection.getTotalQuotations() : 0L);
        summary.setTotalQuotationAmount(projection.getTotalQuotationAmount() != null ? projection.getTotalQuotationAmount() : BigDecimal.ZERO);
        summary.setActiveQuotations(projection.getActiveQuotations() != null ? projection.getActiveQuotations() : 0L);
        summary.setConvertedQuotations(projection.getConvertedQuotations() != null ? projection.getConvertedQuotations() : 0L);
        summary.setTotalOrders(projection.getTotalOrders() != null ? projection.getTotalOrders() : 0L);
        summary.setTotalOrderAmount(projection.getTotalOrderAmount() != null ? projection.getTotalOrderAmount() : BigDecimal.ZERO);
        summary.setPendingOrders(projection.getPendingOrders() != null ? projection.getPendingOrders() : 0L);
        summary.setApprovedOrders(projection.getApprovedOrders() != null ? projection.getApprovedOrders() : 0L);
        summary.setFulfilledOrders(projection.getFulfilledOrders() != null ? projection.getFulfilledOrders() : 0L);
        summary.setTotalInvoices(projection.getTotalInvoices() != null ? projection.getTotalInvoices() : 0L);
        summary.setTotalInvoiceAmount(projection.getTotalInvoiceAmount() != null ? projection.getTotalInvoiceAmount() : BigDecimal.ZERO);
        summary.setTotalPaidAmount(projection.getTotalPaidAmount() != null ? projection.getTotalPaidAmount() : BigDecimal.ZERO);
        summary.setTotalOutstandingAmount(projection.getTotalOutstandingAmount() != null ? projection.getTotalOutstandingAmount() : BigDecimal.ZERO);
        summary.setUnpaidInvoices(projection.getUnpaidInvoices() != null ? projection.getUnpaidInvoices() : 0L);
        summary.setPaidInvoices(projection.getPaidInvoices() != null ? projection.getPaidInvoices() : 0L);
        summary.setLastQuotationDate(projection.getLastQuotationDate());
        summary.setLastOrderDate(projection.getLastOrderDate());
        summary.setLastInvoiceDate(projection.getLastInvoiceDate());
        return summary;
    }


    @Override
    public CustomerResponseDTO updateCustomerForm(Integer customerId, CustomerFormRequestDTO customerFormRequestDTO) {
        log.info("Updating customer form with ID: {}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        if (customer.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Customer not found with ID: " + customerId);
        }

        // Update basic fields
        customer.setFirstName(customerFormRequestDTO.getFirstName());
        customer.setLastName(customerFormRequestDTO.getLastName());
        customer.setNote(customerFormRequestDTO.getNote());

        // Handle address update with clear semantics
        handleAddressUpdate(customer, customerFormRequestDTO.getAddress());

        // Handle contact update with clear semantics
        handleContactUpdate(customer, customerFormRequestDTO.getContact());

        Customer updatedCustomer = customerRepository.save(customer);
        log.info("Customer form updated successfully with ID: {}", updatedCustomer.getCustomerId());

        return convertToResponseDTO(updatedCustomer);
    }

    private void handleAddressUpdate(Customer customer, AddressDTO addressDTO) {
        if (addressDTO == null) {
            // Explicitly remove address
            if (customer.getAddress() != null) {
                log.debug("Removing address for customer ID: {}", customer.getCustomerId());
                customer.setAddress(null);
            }
        } else if (isAddressEmpty(addressDTO)) {
            // Address DTO is empty, remove existing address
            if (customer.getAddress() != null) {
                log.debug("Removing empty address for customer ID: {}", customer.getCustomerId());
                customer.setAddress(null);
            }
        } else {
            // Update or create address
            if (customer.getAddress() != null) {
                updateAddressFields(customer.getAddress(), addressDTO);
                log.debug("Updated existing address ID: {}", customer.getAddress().getAddressId());
            } else {
                Address address = createAddress(addressDTO);
                customer.setAddress(address);
                log.debug("Created new address ID: {}", address.getAddressId());
            }
        }
    }

    private void handleContactUpdate(Customer customer, ContactDTO contactDTO) {
        if (contactDTO == null) {
            // Explicitly remove contact
            if (customer.getContact() != null) {
                log.debug("Removing contact for customer ID: {}", customer.getCustomerId());
                customer.setContact(null);
            }
        } else if (isContactEmpty(contactDTO)) {
            // Contact DTO is empty, remove existing contact
            if (customer.getContact() != null) {
                log.debug("Removing empty contact for customer ID: {}", customer.getCustomerId());
                customer.setContact(null);
            }
        } else {
            // Update or create contact
            if (customer.getContact() != null) {
                updateContactFields(customer.getContact(), contactDTO);
                log.debug("Updated existing contact ID: {}", customer.getContact().getContactId());
            } else {
                Contact contact = createContact(contactDTO);
                customer.setContact(contact);
                log.debug("Created new contact ID: {}", contact.getContactId());
            }
        }
    }

    private boolean isAddressEmpty(AddressDTO addressDTO) {
        return (addressDTO.getStreet() == null || addressDTO.getStreet().trim().isEmpty()) &&
                (addressDTO.getCity() == null || addressDTO.getCity().trim().isEmpty()) &&
                (addressDTO.getCountry() == null || addressDTO.getCountry().trim().isEmpty());
    }

    private boolean isContactEmpty(ContactDTO contactDTO) {
        return (contactDTO.getPhone() == null || contactDTO.getPhone().trim().isEmpty()) &&
                (contactDTO.getEmail() == null || contactDTO.getEmail().trim().isEmpty());
    }


    private TransactionSummaryDTO getTransactionSummary(Integer customerId) {
        log.debug("Calculating transaction summary for customer ID: {}", customerId);

        TransactionSummaryDTO summary = new TransactionSummaryDTO();
        summary.setCustomerId(customerId);

        // Get quotations summary
        List<SalesQuotation> quotations = salesQuotationRepository.findByCustomerIdAndNotDeleted(customerId);
        summary.setTotalQuotations((long) quotations.size());
        summary.setTotalQuotationAmount(
                quotations.stream()
                        .map(SalesQuotation::getTotalAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        summary.setActiveQuotations(
                quotations.stream()
                        .filter(q -> q.getStatus() == SalesQuotation.QuotationStatus.Active)
                        .count()
        );
        summary.setConvertedQuotations(
                quotations.stream()
                        .filter(q -> q.getStatus() == SalesQuotation.QuotationStatus.Converted)
                        .count()
        );

        // Get orders summary
        List<SalesOrder> orders = salesOrderRepository.findByCustomerIdAndNotDeleted(customerId);
        summary.setTotalOrders((long) orders.size());
        summary.setTotalOrderAmount(
                orders.stream()
                        .map(SalesOrder::getTotalAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        summary.setPendingOrders(
                orders.stream()
                        .filter(o -> o.getStatus() == SalesOrder.OrderStatus.Pending)
                        .count()
        );
        summary.setApprovedOrders(
                orders.stream()
                        .filter(o -> o.getStatus() == SalesOrder.OrderStatus.Approved)
                        .count()
        );
        summary.setFulfilledOrders(
                orders.stream()
                        .filter(o -> o.getStatus() == SalesOrder.OrderStatus.Fulfilled)
                        .count()
        );

        // Get invoices summary
        List<ARInvoice> invoices = arInvoiceRepository.findByCustomerIdAndNotDeleted(customerId);
        summary.setTotalInvoices((long) invoices.size());
        summary.setTotalInvoiceAmount(
                invoices.stream()
                        .map(ARInvoice::getTotalAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        summary.setTotalPaidAmount(
                invoices.stream()
                        .map(invoice -> invoice.getTotalAmount().subtract(invoice.getBalanceAmount()))
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        summary.setTotalOutstandingAmount(
                invoices.stream()
                        .map(ARInvoice::getBalanceAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        summary.setUnpaidInvoices(
                invoices.stream()
                        .filter(i -> i.getStatus() == ARInvoice.InvoiceStatus.Unpaid)
                        .count()
        );
        summary.setPaidInvoices(
                invoices.stream()
                        .filter(i -> i.getStatus() == ARInvoice.InvoiceStatus.Paid)
                        .count()
        );

        // Get recent activity dates
        quotations.stream()
                .map(SalesQuotation::getQuotationDate)
                .max(Instant::compareTo)
                .ifPresent(summary::setLastQuotationDate);

        orders.stream()
                .map(SalesOrder::getOrderDate)
                .max(Instant::compareTo)
                .ifPresent(summary::setLastOrderDate);

        invoices.stream()
                .map(ARInvoice::getCreatedAt)
                .max(Instant::compareTo)
                .ifPresent(summary::setLastInvoiceDate);

        return summary;
    }

    private List<CustomerDetailResponseDTO.QuotationSummaryDTO> getRecentQuotations(Integer customerId) {
        log.debug("Getting recent quotations for customer ID: {}", customerId);

        List<SalesQuotation> quotations = salesQuotationRepository.findByCustomerIdAndNotDeleted(customerId);

        return quotations.stream()
                .sorted((q1, q2) -> q2.getQuotationDate().compareTo(q1.getQuotationDate()))
                .limit(5)
                .map(this::convertToQuotationSummaryDTO)
                .collect(Collectors.toList());
    }

    private List<CustomerDetailResponseDTO.OrderSummaryDTO> getRecentOrders(Integer customerId) {
        log.debug("Getting recent orders for customer ID: {}", customerId);

        List<SalesOrder> orders = salesOrderRepository.findByCustomerIdAndNotDeleted(customerId);

        return orders.stream()
                .sorted((o1, o2) -> o2.getOrderDate().compareTo(o1.getOrderDate()))
                .limit(5)
                .map(this::convertToOrderSummaryDTO)
                .collect(Collectors.toList());
    }

    private List<CustomerDetailResponseDTO.InvoiceSummaryDTO> getRecentInvoices(Integer customerId) {
        log.debug("Getting recent invoices for customer ID: {}", customerId);

        List<ARInvoice> invoices = arInvoiceRepository.findByCustomerIdAndNotDeleted(customerId);

        return invoices.stream()
                .sorted((i1, i2) -> i2.getCreatedAt().compareTo(i1.getCreatedAt()))
                .limit(5)
                .map(this::convertToInvoiceSummaryDTO)
                .collect(Collectors.toList());
    }

    private CustomerDetailResponseDTO.QuotationSummaryDTO convertToQuotationSummaryDTO(SalesQuotation quotation) {
        CustomerDetailResponseDTO.QuotationSummaryDTO dto = new CustomerDetailResponseDTO.QuotationSummaryDTO();
        dto.setSqId(quotation.getSqId());
        dto.setQuotationNo(quotation.getQuotationNo());
        dto.setQuotationDate(quotation.getQuotationDate());
        dto.setStatus(quotation.getStatus().name());
        dto.setTotalAmount(quotation.getTotalAmount());
        return dto;
    }

    private CustomerDetailResponseDTO.OrderSummaryDTO convertToOrderSummaryDTO(SalesOrder order) {
        CustomerDetailResponseDTO.OrderSummaryDTO dto = new CustomerDetailResponseDTO.OrderSummaryDTO();
        dto.setSoId(order.getSoId());
        dto.setSoNo(order.getSoNo());
        dto.setOrderDate(order.getOrderDate());
        dto.setStatus(order.getStatus().name());
        dto.setApprovalStatus(order.getApprovalStatus().name());
        dto.setTotalAmount(order.getTotalAmount());
        return dto;
    }

    private CustomerDetailResponseDTO.InvoiceSummaryDTO convertToInvoiceSummaryDTO(ARInvoice invoice) {
        CustomerDetailResponseDTO.InvoiceSummaryDTO dto = new CustomerDetailResponseDTO.InvoiceSummaryDTO();
        dto.setArInvoiceId(invoice.getArInvoiceId());
        dto.setInvoiceNo(invoice.getInvoiceNo());
        dto.setInvoiceDate(invoice.getInvoiceDate() != null ? invoice.getInvoiceDate().toString() : null);
        dto.setDueDate(invoice.getDueDate() != null ? invoice.getDueDate().toString() : null);
        dto.setStatus(invoice.getStatus().name());
        dto.setTotalAmount(invoice.getTotalAmount());
        dto.setBalanceAmount(invoice.getBalanceAmount());
        return dto;
    }



}
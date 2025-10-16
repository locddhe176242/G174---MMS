package com.g174.mmssystem.dto.responseDTO;

import lombok.Data;
import java.time.Instant;

@Data
public class CustomerResponseDTO {
    private Integer customerId;
    private String firstName;
    private String lastName;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;
    private AddressInfo address;
    private ContactInfo contact;

    @Data
    public static class AddressInfo {
        private Integer addressId;
        private String street;
        private String provinceCode;
        private String provinceName;
        private String districtCode;
        private String districtName;
        private String wardCode;
        private String wardName;
        private String country;
    }

    @Data
    public static class ContactInfo {
        private Integer contactId;
        private String phone;
        private String email;
        private String website;
    }
}
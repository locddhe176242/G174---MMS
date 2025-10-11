package com.g174.mmssystem.dto.responseDTO;
import lombok.Data;
import java.time.Instant;
@Data
public class VendorResponseDTO {
    private Integer vendorId;
    private String name;
    private String vendorCode;
    private AddressInfo address;
    private ContactInfo contact;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    public static class AddressInfo {
        private Integer addressId;
        private String street;
        private String city;
        private String country;
    }

    @Data
    public static class ContactInfo {
        private Integer contactId;
        private String phone;
        private String email;
    }
}
package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddressDTO {
    @Size(max = 255)
    private String street;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String country;
}

package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddressDTO {
    @Size(max = 255)
    private String street;

    private String provinceCode;
    private String provinceName;
    private String districtCode;
    private String districtName;
    private String wardCode;
    private String wardName;

    @Size(max = 100)
    private String country;

    @Size(max = 20)
    private String postalCode;
}
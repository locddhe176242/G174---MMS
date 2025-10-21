package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactDTO {
    private String phone;

    @Size(max = 100)
    
    private String email;

    @Size(max = 255)
    private String website;
}
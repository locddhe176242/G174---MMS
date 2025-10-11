package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactDTO {
    @Size(max = 50)
    private String phone;

    @Size(max = 100)
    @Email
    private String email;
}
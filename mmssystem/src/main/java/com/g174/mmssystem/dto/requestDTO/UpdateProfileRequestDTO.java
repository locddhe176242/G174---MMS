package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDTO {
    
    @NotBlank(message = "First name is required")
    @Size(min = 1, max = 255, message = "First name must be between 1 and 255 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(min = 1, max = 255, message = "Last name must be between 1 and 255 characters")
    private String lastName;
    
    @Pattern(regexp = "^(Male|Female|Other)$", message = "Gender must be Male, Female, or Other")
    private String gender;
    
    private LocalDate dob;
    
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must be 10-15 digits")
    private String phoneNumber;
    
    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;
}


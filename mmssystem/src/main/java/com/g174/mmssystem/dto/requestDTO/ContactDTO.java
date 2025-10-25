package com.g174.mmssystem.dto.requestDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactDTO {
    @Size(max = 50)
    private String phone;

    @Size(max = 100)
    @Email(message = "Email không đúng định dạng (vd: example@gmail.com)")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            message = "Email không hợp lệ")
    private String email;

    @Size(max = 255)
    private String website;
}
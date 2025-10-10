package com.g174.mmssystem.dto.requestDTO;

import com.g174.mmssystem.entity.UserProfile.Gender;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRequestDTO {
    private Integer profileId;

    private Integer userId;

    @Size(max = 255, message = "Họ tối đa 255 ký tự")
    private String firstName;

    @Size(max = 255, message = "Tên tối đa 255 ký tự")
    private String lastName;

    private Gender gender;

    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    private LocalDate dob;

    @Size(max = 50, message = "Số điện thoại tối đa 50 ký tự")
    @Pattern(regexp = "^[0-9+()-]*$", message = "Số điện thoại chỉ được chứa số và các ký tự +()-")
    private String phoneNumber;

    private String address;
}
package com.g174.mmssystem.dto.responseDTO;

import com.g174.mmssystem.entity.UserProfile.Gender;
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
public class UserProfileResponseDTO {
    private Integer profileId;
    private Integer userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private Gender gender;
    private LocalDate dob;
    private String phoneNumber;
    private String address;
}
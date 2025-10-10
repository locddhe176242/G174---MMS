package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.UserProfile;
import com.g174.mmssystem.entity.UserProfile.Gender;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {
    Optional<UserProfile> findByUserId(Integer userId);

    boolean existsByUserId(Integer userId);
}
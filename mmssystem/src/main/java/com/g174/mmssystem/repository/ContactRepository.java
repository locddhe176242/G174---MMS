package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Integer> {
    Optional<Contact> findByEmail(String email);
    Optional<Contact> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
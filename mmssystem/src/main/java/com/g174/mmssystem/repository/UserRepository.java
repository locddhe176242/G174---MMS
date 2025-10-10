package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Department;
import com.g174.mmssystem.entity.User;
import com.g174.mmssystem.entity.User.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeCode(String employeeCode);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByEmployeeCode(String employeeCode);

    boolean existsByEmailAndDeletedAtIsNull(String email);
    boolean existsByEmployeeCodeAndDeletedAtIsNull(String employeeCode);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile p WHERE " +
            "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchUsers(@Param("keyword") String keyword);

    Page<User> findByDepartmentId(Integer departmentId, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.status = :status AND u.deletedAt IS NULL")
    List<User> findByStatusAndNotDeleted(@Param("status") UserStatus status);
}
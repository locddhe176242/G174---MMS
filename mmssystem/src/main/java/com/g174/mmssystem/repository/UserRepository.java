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
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeCode(String employeeCode);

    boolean existsByEmail(String email);
    boolean existsByEmployeeCode(String employeeCode);

    boolean existsByEmailAndDeletedAtIsNull(String email);
    boolean existsByEmployeeCodeAndDeletedAtIsNull(String employeeCode);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL")
    List<User> findAllActive();

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL")
    Page<User> findAllActive(Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NOT NULL")
    List<User> findAllDeleted();

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NOT NULL")
    Page<User> findAllDeleted(Pageable pageable);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile p WHERE u.deletedAt IS NULL AND " +
            "(LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.employeeCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<User> searchActiveUsers(@Param("keyword") String keyword);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile p WHERE u.deletedAt IS NULL AND " +
            "(LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.employeeCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchActiveUsers(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile p WHERE u.deletedAt IS NULL AND " +
            "(LOWER(p.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.employeeCode) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<User> searchUsers(@Param("keyword") String keyword);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile p WHERE u.deletedAt IS NOT NULL AND " +
            "(LOWER(p.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.employeeCode) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<User> searchDeletedUsers(@Param("keyword") String keyword);

    @Query("SELECT u FROM User u WHERE u.department.id = :departmentId AND u.deletedAt IS NULL")
    Page<User> findByDepartmentId(@Param("departmentId") Integer departmentId, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.status = :status AND u.deletedAt IS NULL")
    List<User> findByStatusAndNotDeleted(@Param("status") UserStatus status);
}
package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByRoleName(String roleName);

    boolean existsByRoleName(String roleName);

    @Query("SELECT r FROM Role r JOIN UserRole ur ON r.id = ur.id.roleId WHERE ur.id.userId = :userId")
    List<Role> findRolesByUserId(@Param("userId") Integer userId);

    @Query("SELECT COUNT(ur) > 0 FROM UserRole ur WHERE ur.id.userId = :userId AND ur.id.roleId = :roleId")
    boolean userHasRole(@Param("userId") Integer userId, @Param("roleId") Integer roleId);

}
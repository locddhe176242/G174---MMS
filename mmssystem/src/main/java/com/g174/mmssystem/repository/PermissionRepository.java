package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Integer> {

    Optional<Permission> findByPermissionKey(String permissionKey);

    List<Permission> findByResource(String resource);

    @Query("""
        SELECT p FROM Permission p
        JOIN RolePermission rp ON p.permissionId = rp.permissionId
        WHERE rp.roleId = :roleId
    """)
    List<Permission> findPermissionsByRoleId(@Param("roleId") Integer roleId);

    @Query("""
        SELECT p FROM Permission p
        JOIN RolePermission rp ON p.permissionId = rp.permissionId
        JOIN Role r ON rp.roleId = r.id
        WHERE r.roleName = :roleName
    """)
    List<Permission> findPermissionsByRoleName(@Param("roleName") String roleName);

    @Query("""
        SELECT p FROM Permission p
        WHERE p.permissionKey IN :permissionKeys
    """)
    List<Permission> findByPermissionKeyIn(@Param("permissionKeys") List<String> permissionKeys);
}
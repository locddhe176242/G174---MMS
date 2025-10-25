package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.MenuItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Integer> {

    Optional<MenuItem> findByMenuKey(String menuKey);

    List<MenuItem> findAllByOrderByDisplayOrderAsc();
    
    Page<MenuItem> findAllByOrderByDisplayOrderAsc(Pageable pageable);

    @Query("""
        SELECT m FROM MenuItem m
        JOIN RoleMenu rm ON m.menuId = rm.menuId
        WHERE rm.roleId = :roleId
        ORDER BY m.displayOrder ASC
    """)
    List<MenuItem> findMenusByRoleId(@Param("roleId") Integer roleId);

    @Query("""
        SELECT m FROM MenuItem m
        JOIN RoleMenu rm ON m.menuId = rm.menuId
        JOIN Role r ON rm.roleId = r.id
        WHERE r.roleName = :roleName
        ORDER BY m.displayOrder ASC
    """)
    List<MenuItem> findMenusByRoleName(@Param("roleName") String roleName);
}
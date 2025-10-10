package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.UserRole;
import com.g174.mmssystem.entity.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {

    List<UserRole> findByIdUserId(Integer userId);

    Optional<UserRole> findByIdUserIdAndIdRoleId(Integer userId, Integer roleId);

    boolean existsByIdUserIdAndIdRoleId(Integer userId, Integer roleId);

    @Modifying
    @Query("DELETE FROM UserRole ur WHERE ur.id.userId = :userId")
    int deleteAllByUserId(@Param("userId") Integer userId);

    @Modifying
    int deleteByIdUserIdAndIdRoleId(Integer userId, Integer roleId);

    @Query("SELECT ur.id.roleId FROM UserRole ur WHERE ur.id.userId = :userId")
    List<Integer> findRoleIdsByUserId(@Param("userId") Integer userId);

}
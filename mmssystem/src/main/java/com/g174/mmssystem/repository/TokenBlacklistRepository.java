package com.g174.mmssystem.repository;

import com.g174.mmssystem.entity.TokenBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface TokenBlacklistRepository extends JpaRepository<TokenBlacklist, Integer> {
    
    boolean existsByToken(String token);
    
    @Modifying
    @Query("DELETE FROM TokenBlacklist t WHERE t.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") Instant now);
    
    @Modifying
    @Query("DELETE FROM TokenBlacklist t WHERE t.userId = :userId")
    void deleteByUserId(@Param("userId") Integer userId);
}


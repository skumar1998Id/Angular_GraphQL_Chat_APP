package com.techforu.chatapp.repository;

import com.techforu.chatapp.model.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {
    
    // Find all users blocked by a specific user
    @Query("SELECT bu FROM BlockedUser bu WHERE bu.blockerId = :blockerId")
    List<BlockedUser> findByBlockerId(@Param("blockerId") Long blockerId);
    
    // Find all users who have blocked a specific user
    @Query("SELECT bu FROM BlockedUser bu WHERE bu.blockedId = :blockedId")
    List<BlockedUser> findByBlockedId(@Param("blockedId") Long blockedId);
    
    // Check if user A has blocked user B
    @Query("SELECT bu FROM BlockedUser bu WHERE bu.blockerId = :blockerId AND bu.blockedId = :blockedId")
    Optional<BlockedUser> findByBlockerIdAndBlockedId(@Param("blockerId") Long blockerId, @Param("blockedId") Long blockedId);
    
    // Check if either user has blocked the other (mutual check)
    @Query("SELECT bu FROM BlockedUser bu WHERE (bu.blockerId = :userId1 AND bu.blockedId = :userId2) OR (bu.blockerId = :userId2 AND bu.blockedId = :userId1)")
    List<BlockedUser> findMutualBlocks(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    // Get list of blocked user IDs for a specific blocker
    @Query("SELECT bu.blockedId FROM BlockedUser bu WHERE bu.blockerId = :blockerId")
    List<Long> findBlockedUserIds(@Param("blockerId") Long blockerId);
    
    // Delete block relationship
    void deleteByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
    
    // Check if user is blocked
    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
}

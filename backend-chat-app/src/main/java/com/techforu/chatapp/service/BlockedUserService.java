package com.techforu.chatapp.service;

import com.techforu.chatapp.model.BlockedUser;
import com.techforu.chatapp.model.User;
import com.techforu.chatapp.repository.BlockedUserRepository;
import com.techforu.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BlockedUserService {
    
    private final BlockedUserRepository blockedUserRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public BlockedUserService(BlockedUserRepository blockedUserRepository, UserRepository userRepository) {
        this.blockedUserRepository = blockedUserRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Block a user
     */
    public BlockedUser blockUser(Long blockerId, Long blockedId, String reason) {
        // Check if already blocked
        if (isUserBlocked(blockerId, blockedId)) {
            throw new RuntimeException("User is already blocked");
        }
        
        // Check if trying to block self
        if (blockerId.equals(blockedId)) {
            throw new RuntimeException("Cannot block yourself");
        }
        
        // Verify both users exist
        if (!userRepository.existsById(blockerId) || !userRepository.existsById(blockedId)) {
            throw new RuntimeException("One or both users do not exist");
        }
        
        BlockedUser blockedUser = new BlockedUser(blockerId, blockedId, reason);
        return blockedUserRepository.save(blockedUser);
    }
    
    /**
     * Unblock a user
     */
    public void unblockUser(Long blockerId, Long blockedId) {
        if (!isUserBlocked(blockerId, blockedId)) {
            throw new RuntimeException("User is not blocked");
        }
        
        blockedUserRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
    }
    
    /**
     * Check if user A has blocked user B
     */
    public boolean isUserBlocked(Long blockerId, Long blockedId) {
        return blockedUserRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId);
    }
    
    /**
     * Check if either user has blocked the other
     */
    public boolean isEitherUserBlocked(Long userId1, Long userId2) {
        List<BlockedUser> mutualBlocks = blockedUserRepository.findMutualBlocks(userId1, userId2);
        return !mutualBlocks.isEmpty();
    }
    
    /**
     * Get all users blocked by a specific user
     */
    public List<User> getBlockedUsers(Long blockerId) {
        List<Long> blockedUserIds = blockedUserRepository.findBlockedUserIds(blockerId);
        return userRepository.findAllById(blockedUserIds);
    }
    
    /**
     * Get all blocked user relationships for a user
     */
    public List<BlockedUser> getBlockedUserRelationships(Long blockerId) {
        return blockedUserRepository.findByBlockerId(blockerId);
    }
    
    /**
     * Get users who have blocked a specific user
     */
    public List<User> getUsersWhoBlockedUser(Long blockedId) {
        List<BlockedUser> blockers = blockedUserRepository.findByBlockedId(blockedId);
        List<Long> blockerIds = blockers.stream()
                .map(BlockedUser::getBlockerId)
                .collect(Collectors.toList());
        return userRepository.findAllById(blockerIds);
    }
    
    /**
     * Get list of user IDs that should be filtered out for a user
     * (users they blocked + users who blocked them)
     */
    public List<Long> getFilteredUserIds(Long userId) {
        List<Long> blockedByUser = blockedUserRepository.findBlockedUserIds(userId);
        List<BlockedUser> blockedUser = blockedUserRepository.findByBlockedId(userId);
        List<Long> blockedUser_ids = blockedUser.stream()
                .map(BlockedUser::getBlockerId)
                .collect(Collectors.toList());
        
        // Combine both lists
        blockedByUser.addAll(blockedUser_ids);
        return blockedByUser.stream().distinct().collect(Collectors.toList());
    }
}

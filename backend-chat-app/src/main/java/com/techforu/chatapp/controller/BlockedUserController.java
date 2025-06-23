package com.techforu.chatapp.controller;

import com.techforu.chatapp.model.BlockedUser;
import com.techforu.chatapp.model.User;
import com.techforu.chatapp.service.BlockedUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blocked-users")
public class BlockedUserController {
    
    private final BlockedUserService blockedUserService;
    
    @Autowired
    public BlockedUserController(BlockedUserService blockedUserService) {
        this.blockedUserService = blockedUserService;
    }
    
    /**
     * Block a user
     */
    @PostMapping("/block")
    public ResponseEntity<?> blockUser(@RequestBody Map<String, Object> request) {
        try {
            Long blockerId = Long.valueOf(request.get("blockerId").toString());
            Long blockedId = Long.valueOf(request.get("blockedId").toString());
            String reason = request.get("reason") != null ? request.get("reason").toString() : null;
            
            BlockedUser blockedUser = blockedUserService.blockUser(blockerId, blockedId, reason);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User blocked successfully",
                "data", blockedUser
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Unblock a user
     */
    @PostMapping("/unblock")
    public ResponseEntity<?> unblockUser(@RequestBody Map<String, Object> request) {
        try {
            Long blockerId = Long.valueOf(request.get("blockerId").toString());
            Long blockedId = Long.valueOf(request.get("blockedId").toString());
            
            blockedUserService.unblockUser(blockerId, blockedId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User unblocked successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Get blocked users for a user
     */
    @GetMapping("/{userId}/blocked")
    public ResponseEntity<?> getBlockedUsers(@PathVariable Long userId) {
        try {
            List<User> blockedUsers = blockedUserService.getBlockedUsers(userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("blockedUsers", blockedUsers)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Check if user is blocked
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkIfBlocked(@RequestParam Long blockerId, @RequestParam Long blockedId) {
        try {
            boolean isBlocked = blockedUserService.isUserBlocked(blockerId, blockedId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("isBlocked", isBlocked)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Check if either user has blocked the other
     */
    @GetMapping("/check-mutual")
    public ResponseEntity<?> checkMutualBlock(@RequestParam Long userId1, @RequestParam Long userId2) {
        try {
            boolean isEitherBlocked = blockedUserService.isEitherUserBlocked(userId1, userId2);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("isEitherBlocked", isEitherBlocked)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}

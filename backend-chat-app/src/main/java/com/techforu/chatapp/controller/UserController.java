package com.techforu.chatapp.controller;

import com.techforu.chatapp.model.User;
import com.techforu.chatapp.service.BlockedUserService;
import com.techforu.chatapp.service.MessageService;
import com.techforu.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    private final MessageService messageService;

    @Autowired
    public UserController(UserService userService, MessageService messageService) {
        this.userService = userService;
        this.messageService = messageService;
    }
    
    @PostMapping("/{userId}/status")
    public User setUserStatus(@PathVariable Long userId, @RequestParam boolean online) {
        if (online) {
            messageService.userConnected(userId);
        } else {
            messageService.userDisconnected(userId);
        }
        return userService.getUserById(userId);
    }

    /**
     * Get all users excluding blocked users for a specific user
     */
    @GetMapping("/for-user/{userId}")
    public ResponseEntity<?> getUsersForUser(@PathVariable Long userId) {
        try {
            List<User> users = userService.getAllUsersForUser(userId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("users", users)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Get all users (admin endpoint)
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("users", users)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
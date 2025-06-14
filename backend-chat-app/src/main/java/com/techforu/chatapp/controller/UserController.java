package com.techforu.chatapp.controller;

import com.techforu.chatapp.model.User;
import com.techforu.chatapp.service.MessageService;
import com.techforu.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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
}
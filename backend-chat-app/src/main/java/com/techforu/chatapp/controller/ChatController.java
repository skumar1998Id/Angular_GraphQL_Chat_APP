package com.techforu.chatapp.controller;

import com.techforu.chatapp.model.Message;
import com.techforu.chatapp.model.User;
import com.techforu.chatapp.service.MessageService;
import com.techforu.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SubscriptionMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import reactor.core.publisher.Flux;
import java.util.List;
import java.util.Collections;

@Controller
public class ChatController {
    private final UserService userService;
    private final MessageService messageService;
    
    @Autowired
    public ChatController(UserService userService, MessageService messageService) {
        this.userService = userService;
        this.messageService = messageService;
    }
    
    @QueryMapping
    public List<User> users() {
        return userService.getAllUsers();
    }
    
    @QueryMapping
    public User user(@Argument Long id) {
        return userService.getUserById(id);
    }
    
    @QueryMapping
    public List<User> contacts(@Argument Long userId) {
        return userService.getContactsForUser(userId);
    }
    
    @QueryMapping
    public List<Message> messages(@Argument Long senderId, @Argument Long receiverId) {
        List<Message> messages = messageService.getMessagesBetweenUsers(senderId, receiverId);
        System.out.println("Fetched messages: " + messages.size());
        
        // Debug: Print file URLs
        for (Message msg : messages) {
            if (msg.getFileUrl() != null && !msg.getFileUrl().isEmpty()) {
                System.out.println("Message with file: " + msg.getId() + ", URL: " + msg.getFileUrl());
            }
        }
        
        return messages != null ? messages : Collections.emptyList();
    }
    
    @MutationMapping
    public Message sendMessage(
        @Argument Long senderId,
        @Argument Long receiverId,
        @Argument String content,
        @Argument String fileUrl,
        @Argument String fileType,
        @Argument String fileName
    ) {
        // Backend automatically handles encryption
        return messageService.sendMessage(senderId, receiverId, content, fileUrl, fileType, fileName);
    }
    
    @MutationMapping
    public User createUser(@Argument String name) {
        return userService.createUser(name);
    }

    // REST endpoint to generate encryption keys for all existing users
    @PostMapping("/api/generate-keys")
    public ResponseEntity<String> generateKeysForAllUsers() {
        try {
            userService.generateKeysForAllUsers();
            return ResponseEntity.ok("Encryption keys generated for all users successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error generating keys: " + e.getMessage());
        }
    }
    
    @MutationMapping
    public boolean markMessageAsRead(@Argument Long messageId, @Argument Long userId) {
        messageService.markMessageAsRead(messageId, userId);
        return true;
    }
    
    @MutationMapping
    public boolean setTypingStatus(@Argument Long userId, @Argument Long receiverId, @Argument boolean isTyping) {
        messageService.setUserTyping(userId, receiverId, isTyping);
        return true;
    }
    
    @SubscriptionMapping
    public Flux<Message> onNewMessage(@Argument Long receiverId) {
        return messageService.getMessagesByReceiverId(receiverId);
    }
    
    @QueryMapping
    public User userByName(@Argument String name) {
        return userService.findUserByName(name);
    }
}





package com.techforu.chatapp.service;

import com.techforu.chatapp.model.User;
import com.techforu.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserStatusService {

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<Long, Long> lastActivityTimestamp = new ConcurrentHashMap<>();
    private static final long ACTIVITY_TIMEOUT = 300000; // 5 minutes

    @Autowired
    public UserStatusService(UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void updateUserActivity(Long userId) {
        lastActivityTimestamp.put(userId, Instant.now().toEpochMilli());
    }

    public boolean isUserActive(Long userId) {
        if (!lastActivityTimestamp.containsKey(userId)) {
            return false;
        }
        
        long lastActivity = lastActivityTimestamp.get(userId);
        long currentTime = Instant.now().toEpochMilli();
        return (currentTime - lastActivity) < ACTIVITY_TIMEOUT;
    }

    public void syncAndBroadcastUserStatuses() {
        System.out.println("Syncing and broadcasting user statuses...");
        
        List<User> allUsers = userRepository.findAll();
        
        for (User user : allUsers) {
            boolean isActive = isUserActive(user.getId());
            user.setIsOnline(isActive);
            
            Map<String, Object> statusMessage = new HashMap<>();
            statusMessage.put("userId", user.getId());
            statusMessage.put("status", user.getIsOnline() ? "online" : "offline");
            
            messagingTemplate.convertAndSend("/topic/status/all", statusMessage);
        }
    }
}
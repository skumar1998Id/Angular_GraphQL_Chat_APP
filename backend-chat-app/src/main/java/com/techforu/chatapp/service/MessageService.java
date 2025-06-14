package com.techforu.chatapp.service;

import com.techforu.chatapp.model.Message;
import com.techforu.chatapp.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<Long, Boolean> activeUsers = new ConcurrentHashMap<>();
    private final Map<String, Sinks.Many<Message>> messageStreams = new ConcurrentHashMap<>();
    private final UserStatusService userStatusService;
    
    @Autowired
    public MessageService(MessageRepository messageRepository, SimpMessagingTemplate messagingTemplate, UserStatusService userStatusService) {
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
        this.userStatusService = userStatusService;
    }
    
    public List<Message> getMessagesBetweenUsers(Long senderId, Long receiverId) {
        return messageRepository.findMessagesBetweenUsers(senderId, receiverId);
    }
    
    public Message sendMessage(Long senderId, Long receiverId, String content, String fileUrl, String fileType) {
        Message message = new Message();
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setContent(content);
        message.setTimestamp(System.currentTimeMillis());
        message.setRead(false);
        message.setFileUrl(fileUrl);
        message.setFileType(fileType);
        
        Message savedMessage = messageRepository.save(message);
        
        // Send message via WebSocket
        messagingTemplate.convertAndSend("/topic/messages/" + receiverId, savedMessage);
        
        // Also add to reactive stream for GraphQL subscriptions
        String key = "messages-" + receiverId;
        if (!messageStreams.containsKey(key)) {
            messageStreams.put(key, Sinks.many().multicast().onBackpressureBuffer());
        }
        messageStreams.get(key).tryEmitNext(savedMessage);
        
        return savedMessage;
    }
    
    // Overload for backward compatibility
    public Message sendMessage(Long senderId, Long receiverId, String content) {
        return sendMessage(senderId, receiverId, content, null, null);
    }
    
    public void markMessageAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId).orElse(null);
        if (message != null && message.getReceiverId().equals(userId)) {
            message.setRead(true);
            messageRepository.save(message);
            
            // Notify sender that message was read
            messagingTemplate.convertAndSend("/topic/read/" + message.getSenderId(), 
                Map.of("messageId", messageId, "userId", userId));
        }
    }
    
    public void userConnected(Long userId) {
        activeUsers.put(userId, true);
        userStatusService.updateUserActivity(userId);
        System.out.println("User connected: " + userId);
        
        // Notify all users who have chatted with this user that they are online
        List<Long> contactIds = messageRepository.findContactIds(userId);
        for (Long contactId : contactIds) {
            if (isUserActive(contactId)) {
                messagingTemplate.convertAndSend("/topic/status/" + contactId, 
                    Map.of("userId", userId, "status", "online"));
            }
        }
    }
    
    public void userDisconnected(Long userId) {
        activeUsers.remove(userId);
        System.out.println("User disconnected: " + userId);
        
        // Notify all users who have chatted with this user that they are offline
        List<Long> contactIds = messageRepository.findContactIds(userId);
        for (Long contactId : contactIds) {
            if (isUserActive(contactId)) {
                messagingTemplate.convertAndSend("/topic/status/" + contactId, 
                    Map.of("userId", userId, "status", "offline"));
            }
        }
    }
    
    public boolean isUserActive(Long userId) {
        return userStatusService.isUserActive(userId);
    }
    
    public void setUserTyping(Long userId, Long receiverId, boolean isTyping) {
        if (isUserActive(receiverId)) {
            messagingTemplate.convertAndSend("/topic/typing/" + receiverId, 
                Map.of("userId", userId, "isTyping", isTyping));
        }
    }
    
    public Flux<Message> getMessagesByReceiverId(Long receiverId) {
        String key = "messages-" + receiverId;
        if (!messageStreams.containsKey(key)) {
            messageStreams.put(key, Sinks.many().multicast().onBackpressureBuffer());
        }
        return messageStreams.get(key).asFlux();
    }
}



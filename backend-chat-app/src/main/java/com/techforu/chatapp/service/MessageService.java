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
    private final EncryptionService encryptionService;

    @Autowired
    public MessageService(MessageRepository messageRepository, SimpMessagingTemplate messagingTemplate, UserStatusService userStatusService, EncryptionService encryptionService) {
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
        this.userStatusService = userStatusService;
        this.encryptionService = encryptionService;
    }
    
    public List<Message> getMessagesBetweenUsers(Long senderId, Long receiverId) {
        List<Message> messages = messageRepository.findMessagesBetweenUsers(senderId, receiverId);

        // Decrypt messages for the requesting user
        for (Message message : messages) {
            if (message.getIsEncrypted() && message.getEncryptedContent() != null) {
                try {
                    // Messages are encrypted for the receiver, so use receiver's key to decrypt
                    Long keyUserId = message.getReceiverId();

                    if (encryptionService.hasUserKey(keyUserId)) {
                        String decryptedContent = encryptionService.decryptMessage(
                            message.getEncryptedContent(),
                            message.getIv(),
                            keyUserId
                        );
                        message.setContent(decryptedContent);
                        System.out.println("Successfully decrypted message " + message.getId() + " for user " + keyUserId);
                    } else {
                        System.err.println("No encryption key found for user " + keyUserId);
                        message.setContent("[Encrypted message - key not available]");
                    }
                } catch (Exception e) {
                    System.err.println("Failed to decrypt message " + message.getId() + ": " + e.getMessage());
                    e.printStackTrace();
                    // If decryption fails but we have original content, use it
                    if (message.getContent() == null || message.getContent().isEmpty()) {
                        message.setContent("[Decryption failed]");
                    }
                }
            }
            // If message is not encrypted, content should already be set
            // If content is null or empty for unencrypted message, set a default
            if (!message.getIsEncrypted() && (message.getContent() == null || message.getContent().isEmpty())) {
                message.setContent("[Message content unavailable]");
            }
        }

        return messages;
    }
    
    public Message sendMessage(Long senderId, Long receiverId, String content, String fileUrl, String fileType, String fileName) {
        // Automatically encrypt the message on the backend
        Message message = new Message();
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setTimestamp(System.currentTimeMillis());
        message.setRead(false);

        // Handle file attachments
        message.setFileUrl(fileUrl != null && !fileUrl.isEmpty() ? fileUrl : null);
        message.setFileType(fileType != null && !fileType.isEmpty() ? fileType : null);
        message.setFileName(fileName != null && !fileName.isEmpty() ? fileName : null);

        // Check if receiver has encryption key, if not create one
        if (!encryptionService.hasUserKey(receiverId)) {
            System.out.println("User " + receiverId + " doesn't have encryption key, generating one...");
            try {
                encryptionService.generateUserKey(receiverId);
            } catch (Exception e) {
                System.err.println("Failed to generate encryption key for user " + receiverId + ": " + e.getMessage());
            }
        }

        try {
            // Encrypt the message content
            EncryptionService.EncryptedMessage encryptedData = encryptionService.encryptMessage(content, receiverId);

            // Store encrypted data but keep original content for now
            message.setContent(content); // Keep original content for debugging/fallback
            message.setIsEncrypted(true);
            message.setEncryptedContent(encryptedData.getEncryptedContent());
            message.setIv(encryptedData.getIv());

            System.out.println("Message encrypted successfully for user " + receiverId);
        } catch (Exception e) {
            // If encryption fails, store as plain text
            System.err.println("Encryption failed, storing as plain text: " + e.getMessage());
            e.printStackTrace();
            message.setContent(content);
            message.setIsEncrypted(false);
        }

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
        return sendMessage(senderId, receiverId, content, null, null, null);
    }

    // Overload for file messages without fileName
    public Message sendMessage(Long senderId, Long receiverId, String content, String fileUrl, String fileType) {
        return sendMessage(senderId, receiverId, content, fileUrl, fileType, null);
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



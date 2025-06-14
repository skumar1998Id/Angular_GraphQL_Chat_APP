package com.techforu.chatapp.controller;

import com.techforu.chatapp.model.Message;
import com.techforu.chatapp.service.MessageService;
import com.techforu.chatapp.service.UserStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class WebSocketChatController {
    
    private final MessageService messageService;
    private final UserStatusService userStatusService;
    
    @Autowired
    public WebSocketChatController(MessageService messageService, UserStatusService userStatusService) {
        this.messageService = messageService;
        this.userStatusService = userStatusService;
    }
    
    @MessageMapping("/chat.sendMessage")
    public Message sendMessage(@Payload Message message) {
        return messageService.sendMessage(
            message.getSenderId(), 
            message.getReceiverId(), 
            message.getContent()
        );
    }
    
    @MessageMapping("/chat.connect/{userId}")
    public void connectUser(@DestinationVariable Long userId, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("userId", userId);
        userStatusService.updateUserActivity(userId);
        messageService.userConnected(userId);
    }
    
    @MessageMapping("/chat.disconnect/{userId}")
    public void disconnectUser(@DestinationVariable Long userId) {
        messageService.userDisconnected(userId);
    }
    
    @MessageMapping("/chat.typing")
    public void typingIndicator(@Payload Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        Long receiverId = Long.valueOf(payload.get("receiverId").toString());
        boolean isTyping = (boolean) payload.get("isTyping");
        
        messageService.setUserTyping(userId, receiverId, isTyping);
    }
    
    @MessageMapping("/chat.markRead")
    public void markMessageAsRead(@Payload Map<String, Object> payload) {
        Long messageId = Long.valueOf(payload.get("messageId").toString());
        Long userId = Long.valueOf(payload.get("userId").toString());
        
        messageService.markMessageAsRead(messageId, userId);
    }
    
    @MessageMapping("/chat.activity/{userId}")
    public void userActivity(@DestinationVariable Long userId) {
        userStatusService.updateUserActivity(userId);
    }
}



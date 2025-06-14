package com.techforu.chatapp.config;

import com.techforu.chatapp.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    private final MessageService messageService;

    @Autowired
    public WebSocketEventListener(MessageService messageService) {
        this.messageService = messageService;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        if (headerAccessor.getSessionAttributes() == null) {
            return;
        }
        
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        if (userId != null) {
            messageService.userConnected(userId);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        if (headerAccessor.getSessionAttributes() == null) {
            return;
        }
        
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        if (userId != null) {
            messageService.userDisconnected(userId);
        }
    }
}

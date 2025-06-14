package com.techforu.chatapp.config;

import com.techforu.chatapp.service.UserStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class SchedulingConfig {

    private final UserStatusService userStatusService;

    @Autowired
    public SchedulingConfig(UserStatusService userStatusService) {
        this.userStatusService = userStatusService;
    }

    @Scheduled(fixedRate = 60000) // Run every minute
    public void syncUserStatuses() {
        userStatusService.syncAndBroadcastUserStatuses();
    }
}
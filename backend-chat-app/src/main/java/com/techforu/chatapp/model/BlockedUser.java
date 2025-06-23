package com.techforu.chatapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blocked_users")
public class BlockedUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "blocker_id", nullable = false)
    private Long blockerId;
    
    @Column(name = "blocked_id", nullable = false)
    private Long blockedId;
    
    @Column(name = "blocked_at", nullable = false)
    private LocalDateTime blockedAt;
    
    @Column(name = "reason")
    private String reason;
    
    // Constructors
    public BlockedUser() {}
    
    public BlockedUser(Long blockerId, Long blockedId) {
        this.blockerId = blockerId;
        this.blockedId = blockedId;
        this.blockedAt = LocalDateTime.now();
    }
    
    public BlockedUser(Long blockerId, Long blockedId, String reason) {
        this.blockerId = blockerId;
        this.blockedId = blockedId;
        this.blockedAt = LocalDateTime.now();
        this.reason = reason;
    }
    
    // Getters and setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getBlockerId() {
        return blockerId;
    }
    
    public void setBlockerId(Long blockerId) {
        this.blockerId = blockerId;
    }
    
    public Long getBlockedId() {
        return blockedId;
    }
    
    public void setBlockedId(Long blockedId) {
        this.blockedId = blockedId;
    }
    
    public LocalDateTime getBlockedAt() {
        return blockedAt;
    }
    
    public void setBlockedAt(LocalDateTime blockedAt) {
        this.blockedAt = blockedAt;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
}

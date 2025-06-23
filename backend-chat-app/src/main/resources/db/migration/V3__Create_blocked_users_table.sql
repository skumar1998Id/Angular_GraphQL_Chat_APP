-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    blocker_id BIGINT NOT NULL,
    blocked_id BIGINT NOT NULL,
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255),
    
    -- Foreign key constraints
    CONSTRAINT fk_blocker_user FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_blocked_user FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate blocks
    CONSTRAINT uk_blocker_blocked UNIQUE (blocker_id, blocked_id),
    
    -- Check constraint to prevent self-blocking
    CONSTRAINT chk_no_self_block CHECK (blocker_id != blocked_id)
);

-- Create indexes for better performance
CREATE INDEX idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON blocked_users(blocked_id);
CREATE INDEX idx_blocked_users_blocked_at ON blocked_users(blocked_at);

-- Insert some sample data for testing (optional)
-- INSERT INTO blocked_users (blocker_id, blocked_id, reason) VALUES 
-- (1, 3, 'Spam messages'),
-- (2, 4, 'Inappropriate behavior');

-- Add encryption fields to messages table
ALTER TABLE messages ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN encrypted_content TEXT;
ALTER TABLE messages ADD COLUMN encrypted_aes_key TEXT;
ALTER TABLE messages ADD COLUMN iv VARCHAR(255);
ALTER TABLE messages ADD COLUMN signature TEXT;

-- Add public key field to users table
ALTER TABLE users ADD COLUMN public_key TEXT;

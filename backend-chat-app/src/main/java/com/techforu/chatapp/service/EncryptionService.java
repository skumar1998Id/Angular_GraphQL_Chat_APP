package com.techforu.chatapp.service;

import org.springframework.stereotype.Service;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.IvParameterSpec;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class EncryptionService {
    
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";
    private static final int KEY_LENGTH = 256;
    private static final int IV_LENGTH = 16;
    
    // Store user encryption keys (in production, use database)
    private final Map<Long, SecretKey> userKeys = new ConcurrentHashMap<>();
    
    /**
     * Generate encryption key for a user
     */
    public String generateUserKey(Long userId) {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
            keyGenerator.init(KEY_LENGTH);
            SecretKey secretKey = keyGenerator.generateKey();
            
            // Store the key for the user
            userKeys.put(userId, secretKey);
                
            // Return base64 encoded key
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate encryption key", e);
        }
    }
    
    /**
     * Encrypt message content
     */
    public EncryptedMessage encryptMessage(String content, Long userId) {
        try {
            SecretKey key = userKeys.get(userId);
            if (key == null) {
                // Generate key if not exists
                generateUserKey(userId);
                key = userKeys.get(userId);
            }
            
            // Generate random IV
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            
            // Encrypt the content
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, ivSpec);
            byte[] encryptedBytes = cipher.doFinal(content.getBytes());
            
            // Return encrypted data
            return new EncryptedMessage(
                Base64.getEncoder().encodeToString(encryptedBytes),
                Base64.getEncoder().encodeToString(iv)
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt message", e);
        }
    }
    
    /**
     * Decrypt message content
     */
    public String decryptMessage(String encryptedContent, String ivBase64, Long userId) {
        try {
            SecretKey key = userKeys.get(userId);
            if (key == null) {
                throw new RuntimeException("No encryption key found for user: " + userId);
            }
            
            // Decode the encrypted content and IV
            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedContent);
            byte[] iv = Base64.getDecoder().decode(ivBase64);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            
            // Decrypt the content
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, ivSpec);
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            
            return new String(decryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt message", e);
        }
    }
    
    /**
     * Check if user has encryption key
     */
    public boolean hasUserKey(Long userId) {
        return userKeys.containsKey(userId);
    }
    
    /**
     * Remove user key (for logout/cleanup)
     */
    public void removeUserKey(Long userId) {
        userKeys.remove(userId);
    }
    
    /**
     * Inner class for encrypted message data
     */
    public static class EncryptedMessage {
        private final String encryptedContent;
        private final String iv;
        
        public EncryptedMessage(String encryptedContent, String iv) {
            this.encryptedContent = encryptedContent;
            this.iv = iv;
        }
        
        public String getEncryptedContent() {
            return encryptedContent;
        }
        
        public String getIv() {
            return iv;
        }
    }
}

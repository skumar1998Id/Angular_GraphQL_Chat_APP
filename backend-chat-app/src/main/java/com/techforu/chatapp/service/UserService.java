package com.techforu.chatapp.service;

import com.techforu.chatapp.exception.UserNotFoundException;
import com.techforu.chatapp.model.User;
import com.techforu.chatapp.repository.MessageRepository;
import com.techforu.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final MessageService messageService;
    private final BlockedUserService blockedUserService;
    private final EncryptionService encryptionService;

    @Autowired
    public UserService(UserRepository userRepository, MessageRepository messageRepository,
                      MessageService messageService, BlockedUserService blockedUserService, EncryptionService encryptionService) {
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.messageService = messageService;
        this.blockedUserService = blockedUserService;
        this.encryptionService = encryptionService;
    }
    
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(this::setOnlineStatus);

        // Ensure all users have encryption keys
        users.forEach(this::ensureUserHasEncryptionKey);

        return users;
    }

    /**
     * Get all users excluding blocked users for a specific user
     */
    public List<User> getAllUsersForUser(Long userId) {
        List<User> allUsers = userRepository.findAll();
        List<Long> filteredUserIds = blockedUserService.getFilteredUserIds(userId);

        List<User> filteredUsers = allUsers.stream()
                .filter(user -> !filteredUserIds.contains(user.getId()) && !user.getId().equals(userId))
                .collect(Collectors.toList());

        filteredUsers.forEach(this::setOnlineStatus);
        filteredUsers.forEach(this::ensureUserHasEncryptionKey);
        return filteredUsers;
    }
    
    public User getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        setOnlineStatus(user);
        ensureUserHasEncryptionKey(user);
        return user;
    }
    
    public User createUser(String name) {
        return createUser(name, null);
    }

    public User createUser(String name, String publicKey) {
        User user = new User();
        user.setName(name);
        user.setPublicKey(publicKey != null && !publicKey.isEmpty() ? publicKey : null);

        // Save user first to get ID
        User savedUser = userRepository.save(user);

        // Generate encryption key for the user
        try {
            String encryptionKey = encryptionService.generateUserKey(savedUser.getId());
            System.out.println("Generated encryption key for user " + savedUser.getId());
        } catch (Exception e) {
            System.err.println("Failed to generate encryption key for user " + savedUser.getId() + ": " + e.getMessage());
        }

        return savedUser;
    }

    public boolean updateUserPublicKey(Long userId, String publicKey) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            user.setPublicKey(publicKey);
            userRepository.save(user);
            return true;
        }
        return false;
    }
    
    public List<User> getContactsForUser(Long userId) {
        List<Long> contactIds = messageRepository.findContactIds(userId);
        List<User> contacts = contactIds.stream()
                .map(this::getUserById)
                .collect(Collectors.toList());
        
        // Set online status for each contact
        contacts.forEach(this::setOnlineStatus);
        return contacts;
    }
    
    private void setOnlineStatus(User user) {
        user.setIsOnline(messageService.isUserActive(user.getId()));
    }

    /**
     * Ensure user has encryption key, generate one if missing
     */
    private void ensureUserHasEncryptionKey(User user) {
        if (!encryptionService.hasUserKey(user.getId())) {
            try {
                String encryptionKey = encryptionService.generateUserKey(user.getId());
                System.out.println("Generated encryption key for existing user " + user.getId());
            } catch (Exception e) {
                System.err.println("Failed to generate encryption key for user " + user.getId() + ": " + e.getMessage());
            }
        }
    }

    public User findUserByName(String name) {
        return userRepository.findByName(name)
                .orElseThrow(() -> new UserNotFoundException("User not found with name: " + name));
    }

    /**
     * Generate encryption keys for all existing users who don't have them
     */
    public void generateKeysForAllUsers() {
        List<User> allUsers = userRepository.findAll();
        int keysGenerated = 0;

        for (User user : allUsers) {
            if (!encryptionService.hasUserKey(user.getId())) {
                try {
                    encryptionService.generateUserKey(user.getId());
                    keysGenerated++;
                    System.out.println("Generated encryption key for user " + user.getId() + " (" + user.getName() + ")");
                } catch (Exception e) {
                    System.err.println("Failed to generate encryption key for user " + user.getId() + ": " + e.getMessage());
                }
            }
        }

        System.out.println("Generated encryption keys for " + keysGenerated + " users");
    }

}






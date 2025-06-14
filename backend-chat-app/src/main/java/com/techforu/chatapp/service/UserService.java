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
    
    @Autowired
    public UserService(UserRepository userRepository, MessageRepository messageRepository, MessageService messageService) {
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.messageService = messageService;
    }
    
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(this::setOnlineStatus);
        return users;
    }
    
    public User getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        setOnlineStatus(user);
        return user;
    }
    
    public User createUser(String name) {
        User user = new User();
        user.setName(name);
        return userRepository.save(user);
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

    public User findUserByName(String name) {
        return userRepository.findByName(name)
                .orElseThrow(() -> new UserNotFoundException("User not found with name: " + name));
    }

}






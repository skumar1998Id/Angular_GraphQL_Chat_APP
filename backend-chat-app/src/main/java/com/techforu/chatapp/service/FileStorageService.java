package com.techforu.chatapp.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {
    private Path fileStorageLocation;
    
    @Value("${app.file-storage-location:uploads}")
    private String uploadDir;
    
    @Value("${app.base-url:}")
    private String baseUrl;

    @Value("${server.port:8080}")
    private String serverPort;

    // Use @PostConstruct to initialize after properties are set
    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir)
                .toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
            System.out.println("Created file storage directory at: " + this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    /**
     * Get the current request's base URL dynamically
     */
    private String getCurrentBaseUrl() {
        // If base URL is configured, use it
        if (baseUrl != null && !baseUrl.isEmpty()) {
            System.out.println("Using configured base URL: " + baseUrl);
            return baseUrl;
        }

        // Otherwise, try to get it from the current request
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String scheme = request.getScheme();
                String serverName = request.getServerName();
                int serverPort = request.getServerPort();

                StringBuilder url = new StringBuilder();
                url.append(scheme).append("://").append(serverName);

                // Only add port if it's not the default port for the scheme
                if ((scheme.equals("http") && serverPort != 80) ||
                    (scheme.equals("https") && serverPort != 443)) {
                    url.append(":").append(serverPort);
                }

                String dynamicUrl = url.toString();
                System.out.println("Detected dynamic base URL from request: " + dynamicUrl);
                return dynamicUrl;
            } else {
                System.out.println("No request attributes found, using fallback");
            }
        } catch (Exception e) {
            System.err.println("Could not determine base URL from request: " + e.getMessage());
        }

        // Fallback to localhost with current server port
        String fallbackUrl = "http://localhost:" + serverPort;
        System.out.println("Using fallback base URL: " + fallbackUrl + " (port from config: " + serverPort + ")");
        return fallbackUrl;
    }

    public String storeFile(MultipartFile file) {
        // Normalize file name
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        
        try {
            // Check if the file's name contains invalid characters
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + originalFileName);
            }
            
            // Generate unique file name
            String fileExtension = "";
            if (originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;
            
            // Copy file to the target location
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            System.out.println("Storing file at: " + targetLocation);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Return the public URL using dynamic base URL
            String currentBaseUrl = getCurrentBaseUrl();
            String fileUrl = currentBaseUrl + "/api/files/" + fileName;
            System.out.println("File URL: " + fileUrl + " (base: " + currentBaseUrl + ")");
            return fileUrl;
        } catch (IOException ex) {
            ex.printStackTrace();
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }

    // Add a method to retrieve files
    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            System.out.println("Loading file from: " + filePath);
            Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                System.out.println("File not found: " + filePath);
                throw new RuntimeException("File not found " + fileName);
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            throw new RuntimeException("File not found " + fileName, ex);
        }
    }
}



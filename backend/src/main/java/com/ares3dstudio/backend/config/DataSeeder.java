package com.ares3dstudio.backend.config;

import com.ares3dstudio.backend.model.User;
import com.ares3dstudio.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

@Component
public class DataSeeder implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String adminPassword;

    public DataSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.username:}") String adminUsername,
            @Value("${app.admin.password:}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (adminUsername.isBlank() || adminPassword.isBlank()) {
            logger.warn("Admin account was not bootstrapped. Set APP_ADMIN_USERNAME and APP_ADMIN_PASSWORD.");
            return;
        }

        var existingAdmin = userRepository.findByUsername(adminUsername);
        if (existingAdmin.isPresent()) {
            User admin = existingAdmin.get();
            if ("admin".equals(adminUsername) && passwordEncoder.matches("admin", admin.getPassword())) {
                admin.setPassword(passwordEncoder.encode(adminPassword));
                userRepository.save(admin);
                logger.info("The legacy admin password was replaced with the configured password.");
            }
            return;
        }

        if (existingAdmin.isEmpty()) {
            User admin = new User(adminUsername, passwordEncoder.encode(adminPassword));
            userRepository.save(admin);
            logger.info("Initial admin account '{}' was created.", adminUsername);
        }
    }
}

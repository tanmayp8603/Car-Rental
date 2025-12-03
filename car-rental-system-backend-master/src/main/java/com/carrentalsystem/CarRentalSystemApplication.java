package com.carrentalsystem;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.ApplicationContext;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.carrentalsystem.entity.User;
import com.carrentalsystem.service.UserService;
import com.carrentalsystem.utility.Constants.ActiveStatus;
import com.carrentalsystem.utility.Constants.UserRole;

@SpringBootApplication(scanBasePackages = "com.carrentalsystem")
@EntityScan("com.carrentalsystem.entity")
@EnableJpaRepositories("com.carrentalsystem.dao")
public class CarRentalSystemApplication implements CommandLineRunner {
	
	private final Logger LOG = LoggerFactory.getLogger(CarRentalSystemApplication.class);
	
	@Autowired
	private ApplicationContext applicationContext;

	public static void main(String[] args) {
		SpringApplication.run(CarRentalSystemApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		try {
			UserService userService = applicationContext.getBean(UserService.class);
			PasswordEncoder passwordEncoder = applicationContext.getBean(PasswordEncoder.class);
			
			User admin = userService.getUserByEmailIdAndRoleAndStatus("demo.admin@demo.com",
					UserRole.ROLE_ADMIN.value(), ActiveStatus.ACTIVE.value());

			if (admin == null) {
				LOG.info("Admin not found in system, so adding default admin");

				User user = new User();
				user.setEmailId("demo.admin@demo.com");
				user.setPassword(passwordEncoder.encode("123456"));
				user.setRole(UserRole.ROLE_ADMIN.value());
				user.setStatus(ActiveStatus.ACTIVE.value());

				userService.addUser(user);
			}
		} catch (Exception e) {
			LOG.error("Error initializing admin user: {}", e.getMessage());
		}
	}

}
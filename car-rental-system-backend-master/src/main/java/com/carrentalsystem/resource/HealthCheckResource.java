package com.carrentalsystem.resource;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carrentalsystem.dto.CommonApiResponse;

@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "http://localhost:3000")
public class HealthCheckResource {
    
    private final Logger LOG = LoggerFactory.getLogger(HealthCheckResource.class);
    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        Map<String, Object> healthInfo = new HashMap<>();
        
        try {
            // Basic health check
            healthInfo.put("status", "UP");
            healthInfo.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            healthInfo.put("service", "Car Rental System API");
            healthInfo.put("version", "1.0.0");
            
            // System information
            Runtime runtime = Runtime.getRuntime();
            healthInfo.put("memory", Map.of(
                "total", runtime.totalMemory(),
                "free", runtime.freeMemory(),
                "used", runtime.totalMemory() - runtime.freeMemory(),
                "max", runtime.maxMemory()
            ));
            
            healthInfo.put("java", System.getProperty("java.version"));
            healthInfo.put("os", System.getProperty("os.name"));
            
            LOG.info("Health check requested - Status: UP");
            
            return ResponseEntity.ok(healthInfo);
            
        } catch (Exception e) {
            LOG.error("Health check failed: {}", e.getMessage());
            healthInfo.put("status", "DOWN");
            healthInfo.put("error", e.getMessage());
            return ResponseEntity.status(503).body(healthInfo);
        }
    }
    
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
} 
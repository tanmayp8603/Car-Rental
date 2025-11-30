package com.carrentalsystem.dto;

public class PaymentCheckResponse {
    private boolean exists;
    private String message;

    public PaymentCheckResponse(boolean exists, String message) {
        this.exists = exists;
        this.message = message;
    }

    // Getters and setters
    public boolean isExists() {
        return exists;
    }

    public void setExists(boolean exists) {
        this.exists = exists;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

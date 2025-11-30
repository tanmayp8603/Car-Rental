package com.carrentalsystem.dto;

public class RazorpayOrderResponse {
    private String id;
    private String entity;
    private String amount;
    private String amount_paid;
    private String amount_due;
    private String currency;
    private String receipt;
    private String status;
    private String attempts;
    private String notes;
    private String created_at;

    public RazorpayOrderResponse() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEntity() {
        return entity;
    }

    public void setEntity(String entity) {
        this.entity = entity;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    // Snakecase getter/setter for JSON deserialization
    public String getAmount_paid() {
        return amount_paid;
    }

    public void setAmount_paid(String amount_paid) {
        this.amount_paid = amount_paid;
    }
    
    // Camel case getter/setter for better Java code compatibility
    public String getAmountPaid() {
        return amount_paid;
    }
    
    public void setAmountPaid(String amountPaid) {
        this.amount_paid = amountPaid;
    }

    // Snakecase getter/setter for JSON deserialization
    public String getAmount_due() {
        return amount_due;
    }

    public void setAmount_due(String amount_due) {
        this.amount_due = amount_due;
    }
    
    // Camel case getter/setter for better Java code compatibility
    public String getAmountDue() {
        return amount_due;
    }
    
    public void setAmountDue(String amountDue) {
        this.amount_due = amountDue;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getReceipt() {
        return receipt;
    }

    public void setReceipt(String receipt) {
        this.receipt = receipt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAttempts() {
        return attempts;
    }

    public void setAttempts(String attempts) {
        this.attempts = attempts;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    // Snakecase getter/setter for JSON deserialization
    public String getCreated_at() {
        return created_at;
    }
    
    public void setCreated_at(String created_at) {
        this.created_at = created_at;
    }
    
    // Camel case getter/setter for better Java code compatibility
    public String getCreatedAt() {
        return created_at;
    }
    
    public void setCreatedAt(String createdAt) {
        this.created_at = createdAt;
    }
}
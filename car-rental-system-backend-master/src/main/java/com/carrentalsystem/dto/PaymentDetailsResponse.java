package com.carrentalsystem.dto;

import java.math.BigDecimal; // Add this import

public class PaymentDetailsResponse {
    private String paymentStatus;
    private String transactionTime;
    private String transactionRefId;
    private BigDecimal amount; // Change to BigDecimal

    public PaymentDetailsResponse() {
    }

    public PaymentDetailsResponse(String paymentStatus, String transactionTime, String transactionRefId, BigDecimal amount) { // Update constructor
        this.paymentStatus = paymentStatus;
        this.transactionTime = transactionTime;
        this.transactionRefId = transactionRefId;
        this.amount = amount;
    }

    // Getters and setters
    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getTransactionTime() {
        return transactionTime;
    }

    public void setTransactionTime(String transactionTime) {
        this.transactionTime = transactionTime;
    }

    public String getTransactionRefId() {
        return transactionRefId;
    }

    public void setTransactionRefId(String transactionRefId) {
        this.transactionRefId = transactionRefId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
package com.carrentalsystem.dto;


public class RazorpayOrderRequest {
    private String bookingId;
    private String orderId;
    private String amount;
    private String currency;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String description;
    private String callbackUrl;
    private String cancelUrl;

    public RazorpayOrderRequest() {
    }

    public RazorpayOrderRequest(String bookingId, String orderId, String amount, String currency, 
                               String customerName, String customerEmail, String customerPhone, 
                               String description, String callbackUrl, String cancelUrl) {
        this.bookingId = bookingId;
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.description = description;
        this.callbackUrl = callbackUrl;
        this.cancelUrl = cancelUrl;
    }

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCallbackUrl() {
        return callbackUrl;
    }

    public void setCallbackUrl(String callbackUrl) {
        this.callbackUrl = callbackUrl;
    }

    public String getCancelUrl() {
        return cancelUrl;
    }

    public void setCancelUrl(String cancelUrl) {
        this.cancelUrl = cancelUrl;
    }
} 
package com.carrentalsystem.dto;

public class RazorpayPaymentVerificationRequest {
    private String razorpay_order_id;
    private String razorpay_payment_id;
    private String razorpay_signature;
    private String amount;
    private String currency;
    private String bookingId;

    public RazorpayPaymentVerificationRequest() {
    }

    public RazorpayPaymentVerificationRequest(String razorpay_order_id, String razorpay_payment_id, 
                                             String razorpay_signature, String amount, String currency, String bookingId) {
        this.razorpay_order_id = razorpay_order_id;
        this.razorpay_payment_id = razorpay_payment_id;
        this.razorpay_signature = razorpay_signature;
        this.amount = amount;
        this.currency = currency;
        this.bookingId = bookingId;
    }

    public String getRazorpayOrderId() {
        return razorpay_order_id;
    }
    
    // Keep the original getter for JSON deserialization
    public String getRazorpay_order_id() {
        return razorpay_order_id;
    }

    public void setRazorpay_order_id(String razorpay_order_id) {
        this.razorpay_order_id = razorpay_order_id;
    }

    public String getRazorpayPaymentId() {
        return razorpay_payment_id;
    }
    
    // Keep the original getter for JSON deserialization
    public String getRazorpay_payment_id() {
        return razorpay_payment_id;
    }

    public void setRazorpay_payment_id(String razorpay_payment_id) {
        this.razorpay_payment_id = razorpay_payment_id;
    }

    public String getRazorpaySignature() {
        return razorpay_signature;
    }
    
    // Keep the original getter for JSON deserialization
    public String getRazorpay_signature() {
        return razorpay_signature;
    }

    public void setRazorpay_signature(String razorpay_signature) {
        this.razorpay_signature = razorpay_signature;
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

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }
} 
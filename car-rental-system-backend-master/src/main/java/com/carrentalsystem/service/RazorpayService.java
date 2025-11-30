package com.carrentalsystem.service;

import com.carrentalsystem.dto.RazorpayOrderRequest;
import com.carrentalsystem.dto.RazorpayOrderResponse;
import com.carrentalsystem.dto.RazorpayPaymentVerificationRequest;

public interface RazorpayService {
    
    RazorpayOrderResponse createOrder(RazorpayOrderRequest request) throws Exception;
    
    boolean verifyPayment(RazorpayPaymentVerificationRequest request) throws Exception;
    
    String getPaymentStatus(String orderId) throws Exception;
} 
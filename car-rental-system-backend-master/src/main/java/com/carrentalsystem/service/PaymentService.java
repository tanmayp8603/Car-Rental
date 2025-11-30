package com.carrentalsystem.service;

import java.util.List;

import com.carrentalsystem.dto.RazorpayOrderRequest;
import com.carrentalsystem.dto.RazorpayOrderResponse;
import com.carrentalsystem.dto.RazorpayPaymentVerificationRequest;
import com.carrentalsystem.entity.Payment;
import com.carrentalsystem.entity.User;
import com.razorpay.RazorpayException;

public interface PaymentService {

    /**
     * Creates or updates a payment with proper transaction management
     * @param payment The payment to create or update
     * @param razorpayOrderId The Razorpay order ID
     * @return The created or updated payment
     * @throws RuntimeException if there's an error processing the payment
     */
    Payment createOrUpdatePayment(Payment payment, String razorpayOrderId);
    
    /**
     * Creates a new Razorpay order
     * @param request The Razorpay order request
     * @return The created order response
     * @throws RazorpayException if there's an error creating the order
     */
    RazorpayOrderResponse createRazorpayOrder(RazorpayOrderRequest request) throws RazorpayException;
    
    /**
     * Verifies a Razorpay payment
     * @param orderId The Razorpay order ID
     * @param paymentId The Razorpay payment ID
     * @param signature The payment signature
     * @return true if the payment is valid, false otherwise
     */
    boolean verifyRazorpayPayment(String orderId, String paymentId, String signature);
    
    /**
     * Saves payment details to the database
     * @param orderId The Razorpay order ID
     * @param paymentId The Razorpay payment ID
     * @param amount The payment amount in paise
     * @param bookingId The booking ID
     */
    void savePaymentDetails(String orderId, String paymentId, String amount, String bookingId);
    
    /**
     * Processes a cash on Delivery (COD) order
     * @param bookingId The booking ID
     * @param amount The order amount
     * @param customerName The customer's name
     * @param customerEmail The customer's email
     * @return The transaction ID for the COD order
     */
    String processCashOnDelivery(String bookingId, String amount, String customerName, String customerEmail);
    
    /**
     * Adds a new payment
     * @param payment The payment to add
     * @return The added payment
     */
    Payment addPayment(Payment payment);

    /**
     * Updates an existing payment
     * @param payment The payment to update
     * @return The updated payment
     */
    Payment updatePayment(Payment payment);

    /**
     * Gets a payment by ID
     * @param paymentId The payment ID
     * @return The payment, or null if not found
     */
    Payment getById(int paymentId);

    /**
     * Gets a payment by booking ID
     * @param bookingId The booking ID
     * @return The payment, or null if not found
     */
    Payment getByBookingId(String bookingId);

    /**
     * Gets a payment by transaction reference ID
     * @param transactionId The transaction ID
     * @return The payment, or null if not found
     */
    Payment getByTransactionRefId(String transactionId);

    /**
     * Gets a payment by Razorpay order ID
     * @param razorpayOrderId The Razorpay order ID
     * @return The payment, or null if not found
     */
    Payment getByRazorpayOrderId(String razorpayOrderId);

    /**
     * Gets all payments for a customer
     * @param user The customer
     * @return List of payments
     */
    List<Payment> getByCustomer(User user);
    
    /**
     * Checks if a payment exists for the given booking ID
     * @param bookingId The ID of the booking to check (as String)
     * @return true if a payment exists, false otherwise
     */
    boolean paymentExistsForBooking(String bookingId);
    
    /**
     * Debugging method to find all payments for a given booking ID
     * @param bookingId The ID of the booking to check (as String)
     * @return List of payments
     */
    List<Payment> findAllPaymentsByBookingId(String bookingId);
}
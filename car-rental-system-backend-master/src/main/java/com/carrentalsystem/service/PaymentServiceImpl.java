package com.carrentalsystem.service;

import com.razorpay.*;
import com.carrentalsystem.config.RazorpayConfig;
import com.carrentalsystem.dao.BookingDao;
import com.carrentalsystem.dao.PaymentDao;
import com.carrentalsystem.dto.RazorpayOrderRequest;
import com.carrentalsystem.dto.RazorpayOrderResponse;
import com.carrentalsystem.entity.Booking;
import com.carrentalsystem.entity.Payment;
import com.carrentalsystem.entity.User;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.SQLIntegrityConstraintViolationException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);
    
    @Autowired
    private PaymentDao paymentDao;
    
    @Autowired
    private BookingDao bookingDao;
    
    @Autowired
    private RazorpayConfig razorpayConfig;
    
    private RazorpayClient getRazorpayClient() throws RazorpayException {
        return new RazorpayClient(razorpayConfig.getKeyId(), razorpayConfig.getKeySecret());
    }

    @Override
    @Transactional(noRollbackFor = {DataIntegrityViolationException.class, SQLIntegrityConstraintViolationException.class})
    public Payment createOrUpdatePayment(Payment payment, String razorpayOrderId) {
        try {
            // First try to find existing payment
            Payment existingPayment = paymentDao.findByBookingId(payment.getBookingId());
            
            if (existingPayment != null) {
                log.info("Updating existing payment for booking ID: {}", payment.getBookingId());
                existingPayment.setRazorpayOrderId(razorpayOrderId);
                existingPayment.setAmount(payment.getAmount());
                existingPayment.setPaymentStatus("PENDING");
                return paymentDao.save(existingPayment);
            } else {
                log.info("Creating new payment for booking ID: {}", payment.getBookingId());
                if (payment.getCustomer() == null) {
                    throw new IllegalStateException("Customer cannot be null for new payment");
                }
                if (payment.getBookingId() == null) {
                    throw new IllegalStateException("Booking ID cannot be null for new payment");
                }
                
                // Create a new Payment instance to ensure we don't have any stale data
                Payment newPayment = new Payment();
                newPayment.setBookingId(payment.getBookingId());
                newPayment.setCustomer(payment.getCustomer());
                newPayment.setAmount(payment.getAmount());
                newPayment.setRazorpayOrderId(razorpayOrderId);
                newPayment.setPaymentStatus("PENDING");
                newPayment.setTransactionTime(LocalDateTime.now().toString());
                
                return paymentDao.save(newPayment);
            }
        } catch (DataIntegrityViolationException e) {
            log.warn("Data integrity violation while saving payment: {}", e.getMessage());
            // If we get here, try to return existing payment
            Payment existing = paymentDao.findByBookingId(payment.getBookingId());
            if (existing != null) {
                return existing;
            }
            throw new RuntimeException("Failed to process payment due to data integrity issue", e);
        } catch (Exception e) {
            log.error("Unexpected error in createOrUpdatePayment", e);
            throw new RuntimeException("Failed to process payment: " + e.getMessage(), e);
        }
    }
    
    @Override
    public boolean paymentExistsForBooking(String bookingId) {
        log.info("Checking if payment exists for booking ID: '{}'", bookingId);
        if (bookingId != null) {
            log.info("Booking ID length: {}, Characters: '{}'", bookingId.length(), bookingId);
            // Check for whitespace
            if (!bookingId.equals(bookingId.trim())) {
                log.warn("Booking ID has leading/trailing whitespace: '{}'", bookingId);
            }
        }
        
        // Try the robust method first
        try {
            Payment robustResult = paymentDao.findPaymentByBookingIdRobust(bookingId);
            if (robustResult != null) {
                log.info("Found payment using robust query for booking ID '{}'", bookingId);
                return true;
            }
        } catch (Exception e) {
            log.warn("Robust query failed for booking ID '{}': {}", bookingId, e.getMessage());
        }
        
        boolean result = paymentDao.existsByBookingId(bookingId);
        log.info("Payment exists check result for booking ID '{}': {}", bookingId, result);
        return result;
    }
    
    @Override
    public RazorpayOrderResponse createRazorpayOrder(RazorpayOrderRequest request) throws RazorpayException {
        try {
            RazorpayClient razorpay = getRazorpayClient();
            
            JSONObject orderRequest = new JSONObject();
            // Convert amount to string if it's not already
            String amountStr = request.getAmount();
            // Ensure amount is a valid string representation of a number
            if (amountStr == null || amountStr.isEmpty()) {
                amountStr = "0";
            }
            // Additional validation to prevent casting errors
            try {
                // Try to parse the amount to ensure it's a valid number
                Long.parseLong(amountStr);
            } catch (NumberFormatException e) {
                log.error("Invalid amount format: {}", amountStr);
                throw new IllegalArgumentException("Invalid amount format: " + amountStr);
            }
            orderRequest.put("amount", amountStr);
            orderRequest.put("currency", request.getCurrency() != null ? request.getCurrency() : "INR");
            orderRequest.put("receipt", request.getOrderId() != null ? request.getOrderId() : "order_" + System.currentTimeMillis());
            orderRequest.put("payment_capture", 1);

            // Add customer details if available
            JSONObject notes = new JSONObject();
            notes.put("bookingId", request.getBookingId());
            if (request.getCustomerName() != null) notes.put("customerName", request.getCustomerName());
            if (request.getCustomerEmail() != null) notes.put("customerEmail", request.getCustomerEmail());
            orderRequest.put("notes", notes);

            Order order = razorpay.orders.create(orderRequest);

            // Safely extract fields from the Razorpay Order object without relying on
            // any unexpected generic casts (which were causing ClassCastException).
            Object idObj = order.get("id");
            Object amountObj = order.get("amount");
            Object currencyObj = order.get("currency");
            Object createdAtObj = order.get("created_at");

            RazorpayOrderResponse response = new RazorpayOrderResponse();
            response.setId(idObj != null ? idObj.toString() : null);
            response.setAmount(amountObj != null ? amountObj.toString() : null);
            response.setCurrency(currencyObj != null ? currencyObj.toString() : null);
            response.setReceipt(order.has("receipt") && order.get("receipt") != null
                    ? order.get("receipt").toString()
                    : "");
            response.setStatus(order.has("status") && order.get("status") != null
                    ? order.get("status").toString()
                    : "created");
            response.setCreatedAt(createdAtObj != null ? createdAtObj.toString() : null);
            
            return response;
        } catch (RazorpayException e) {
            log.error("Razorpay error: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Error creating Razorpay order: {}", e.getMessage(), e);
            throw new RazorpayException("Failed to create order: " + e.getMessage());
        }
    }
    
    @Override
    public boolean verifyRazorpayPayment(String orderId, String paymentId, String signature) {
        try {
            String data = orderId + "|" + paymentId;
            
            RazorpayClient razorpay = getRazorpayClient();
            
            // Log the verification attempt
            log.info("Attempting to verify Razorpay payment - Order ID: {}, Payment ID: {}", orderId, paymentId);
            
            // Verify the payment signature
            Utils.verifySignature(data, signature, razorpayConfig.getKeySecret());
            
            // If we get here, the signature is valid
            log.info("Razorpay payment verification successful - Order ID: {}, Payment ID: {}", orderId, paymentId);
            return true;
        } catch (RazorpayException e) {
            log.error("Razorpay verification error: {}", e.getMessage(), e);
            return false;
        } catch (Exception e) {
            log.error("Error verifying payment: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    @Transactional
    public void savePaymentDetails(String orderId, String paymentId, String amount, String bookingId) {
        try {
            log.info("=== SAVE PAYMENT DETAILS START ===");
            log.info("Saving payment details - Order ID: {}, Payment ID: {}, Amount: {}, Booking ID: {}", 
                     orderId, paymentId, amount, bookingId);
            
            // Validate inputs
            if (bookingId == null || bookingId.trim().isEmpty()) {
                log.error("Invalid booking ID provided: {}", bookingId);
                throw new RuntimeException("Invalid booking ID provided");
            }
            
            // Check if payment already exists by checking if a payment with this razorpay payment ID exists
            Payment existingPayment = paymentDao.findByRazorpayPaymentId(paymentId);
            if (existingPayment != null) {
                log.warn("Payment with ID {} already exists", paymentId);
                throw new RuntimeException("Payment with ID " + paymentId + " already exists");
            }
            
            // Find the booking
            log.info("Searching for booking with ID: {}", bookingId);
            Booking booking = bookingDao.findByBookingId(bookingId);
            if (booking == null) {
                log.error("Booking not found with ID: {}", bookingId);
                throw new RuntimeException("Booking not found with ID: " + bookingId);
            }
            
            // Log booking details
            log.info("Found booking - ID: {}, Status: {}, Customer ID: {}", 
                     booking.getId(), booking.getStatus(), booking.getCustomer() != null ? booking.getCustomer().getId() : "null");
            
            // Parse amount safely
            BigDecimal amountInRupees;
            try {
                // Amount comes in paise from Razorpay, convert to rupees
                BigDecimal amountInPaise = new BigDecimal(amount);
                amountInRupees = amountInPaise.divide(new BigDecimal(100));
                log.debug("Converted amount from paise to rupees: {} paise = {} rupees", amount, amountInRupees);
            } catch (NumberFormatException e) {
                log.error("Invalid amount format: {}", amount);
                throw new RuntimeException("Invalid amount format: " + amount, e);
            }
            
            // Create and save payment
            Payment payment = new Payment();
            payment.setRazorpayPaymentId(paymentId);
            payment.setRazorpayOrderId(orderId);
            payment.setAmount(amountInRupees);
            payment.setBookingId(bookingId); // This is the critical line
            payment.setCustomer(booking.getCustomer());
            payment.setPaymentStatus("COMPLETED");
            payment.setTransactionTime(java.time.LocalDateTime.now().toString());
            
            log.info("Saving payment - Razorpay Payment ID: {}, Booking ID: {}", paymentId, bookingId);
            Payment savedPayment = paymentDao.save(payment);
            log.info("Payment saved with ID: {}", savedPayment.getId());
            
            // Update booking status to CONFIRMED
            log.info("Updating booking status to CONFIRMED for booking ID: {}", bookingId);
            String oldStatus = booking.getStatus();
            booking.setStatus("CONFIRMED");
            log.info("Booking status changed from '{}' to '{}'", oldStatus, booking.getStatus());
            
            // Save the booking
            Booking savedBooking = bookingDao.save(booking);
            log.info("Booking updated with status: {}", savedBooking.getStatus());
            
            log.info("=== SAVE PAYMENT DETAILS END SUCCESS ===");
            
        } catch (Exception e) {
            log.error("Error saving payment details: {}", e.getMessage(), e);
            log.info("=== SAVE PAYMENT DETAILS END ERROR ===");
            throw new RuntimeException("Failed to save payment details: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public String processCashOnDelivery(String bookingId, String amount, String customerName, String customerEmail) {
        try {
            log.info("=== PROCESS COD PAYMENT START ===");
            log.info("Processing COD payment for booking ID: {}, Amount: {}, Customer: {}, Email: {}", 
                     bookingId, amount, customerName, customerEmail);
            
            // Validate inputs
            if (bookingId == null || bookingId.trim().isEmpty()) {
                log.error("Invalid booking ID provided: {}", bookingId);
                throw new RuntimeException("Invalid booking ID provided");
            }
            
            // Find the booking by bookingId (String)
            Booking booking = bookingDao.findByBookingId(bookingId);
            if (booking == null) {
                log.error("Booking not found with ID: {}", bookingId);
                throw new RuntimeException("Booking not found with ID: " + bookingId);
            }
            
            // Log booking details
            log.info("Found booking - ID: {}, Status: {}, Customer ID: {}", 
                     booking.getId(), booking.getStatus(), booking.getCustomer() != null ? booking.getCustomer().getId() : "null");
            
            // Generate a unique transaction ID for COD
            String transactionId = "COD_" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
            log.info("Generated COD transaction ID: {}", transactionId);
            
            // Create and save payment
            Payment payment = new Payment();
            payment.setTransactionRefId(transactionId);
            payment.setRazorpayOrderId("COD_ORDER_" + System.currentTimeMillis());
            payment.setAmount(new java.math.BigDecimal(Double.parseDouble(amount)));
            payment.setBookingId(bookingId); // This is the critical line
            payment.setCustomer(booking.getCustomer());
            payment.setPaymentStatus("PENDING");
            payment.setTransactionTime(LocalDateTime.now().toString());
            
            log.info("Saving COD payment for booking ID: {}", bookingId);
            paymentDao.save(payment);
            log.info("COD payment saved successfully");
            
            // Update booking status
            log.info("Updating booking status to CONFIRMED for booking ID: {}", bookingId);
            String oldStatus = booking.getStatus();
            booking.setStatus("CONFIRMED");
            log.info("Booking status changed from '{}' to '{}'", oldStatus, booking.getStatus());
            
            bookingDao.save(booking);
            log.info("Booking updated with status: {}", booking.getStatus());
            
            log.info("=== PROCESS COD PAYMENT END SUCCESS ===");
            return transactionId;
            
        } catch (Exception e) {
            log.error("Error processing COD: {}", e.getMessage(), e);
            log.info("=== PROCESS COD PAYMENT END ERROR ===");
            throw new RuntimeException("Failed to process COD order: " + e.getMessage(), e);
        }
    }
	
	@Override
	public Payment addPayment(Payment payment) {
		// TODO Auto-generated method stub
		return paymentDao.save(payment);
	}

	@Override
	public Payment updatePayment(Payment payment) {
		// TODO Auto-generated method stub
		return paymentDao.save(payment);
	}

	@Override
	public Payment getById(int paymentId) {
		// TODO Auto-generated method stub
		Optional<Payment> optional = paymentDao.findById(paymentId);

		if (optional.isPresent()) {
			return optional.get();
		}

		return null;
	}

	@Override
	public Payment getByBookingId(String bookingId) {
        log.info("Getting payment by booking ID: '{}'", bookingId);
        if (bookingId != null) {
            log.info("Booking ID length: {}, Characters: '{}'", bookingId.length(), bookingId);
            // Check for whitespace
            if (!bookingId.equals(bookingId.trim())) {
                log.warn("Booking ID has leading/trailing whitespace: '{}'", bookingId);
            }
        }
        
        // Try the robust method first
        try {
            Payment robustResult = paymentDao.findPaymentByBookingIdRobust(bookingId);
            if (robustResult != null) {
                log.info("Found payment using robust query for booking ID '{}' - ID: {}", bookingId, robustResult.getId());
                return robustResult;
            }
        } catch (Exception e) {
            log.warn("Robust query failed for booking ID '{}': {}", bookingId, e.getMessage());
        }
        
        Payment result = paymentDao.findByBookingId(bookingId);
        log.info("Get by booking ID result for booking ID '{}': {}", bookingId, result != null ? "FOUND (ID: " + result.getId() + ")" : "NOT FOUND");
        return result;
    }

	@Override
	public Payment getByTransactionRefId(String transactionId) {
		// TODO Auto-generated method stub
		return paymentDao.findByTransactionRefId(transactionId);
	}

	@Override
	public Payment getByRazorpayOrderId(String razorpayOrderId) {
		return paymentDao.findByRazorpayOrderId(razorpayOrderId);
	}

	@Override
	public List<Payment> getByCustomer(User user) {
		// TODO Auto-generated method stub
		return paymentDao.findByCustomer(user);
	}
	
	@Override
	public List<Payment> findAllPaymentsByBookingId(String bookingId) {
	    log.info("Debug: Finding all payments for booking ID: {}", bookingId);
	    List<Payment> payments = paymentDao.findAllByBookingId(bookingId);
	    log.info("Debug: Found {} payments for booking ID: {}", payments.size(), bookingId);
	    if (!payments.isEmpty()) {
	        for (Payment payment : payments) {
	            log.info("Debug: Payment ID: {}, Status: {}, Amount: {}", 
	                    payment.getId(), payment.getPaymentStatus(), payment.getAmount());
	        }
	    }
	    return payments;
	}
}

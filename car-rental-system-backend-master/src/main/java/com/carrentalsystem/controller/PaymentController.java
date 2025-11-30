package com.carrentalsystem.controller;

import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import com.carrentalsystem.dto.*;
import com.carrentalsystem.entity.Payment;
import com.carrentalsystem.service.PaymentService;
import com.carrentalsystem.dao.PaymentDao; // Add this import

import java.util.List;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    
    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private PaymentDao paymentDao; // Add this injection

    @GetMapping("/check/{bookingId}")
    @Transactional(readOnly = true)
    public ResponseEntity<PaymentCheckResponse> checkPaymentExists(@PathVariable String bookingId) {
        try {
            log.info("=== PAYMENT CHECK START ===");
            log.info("Checking payment existence for booking ID: {}", bookingId);
            
            // Validate input
            if (bookingId == null || bookingId.trim().isEmpty()) {
                log.warn("Invalid booking ID provided: {}", bookingId);
                return ResponseEntity.badRequest()
                    .body(new PaymentCheckResponse(false, "Invalid booking ID"));
            }
            
            // Log the length and some characters of the bookingId for debugging
            log.info("Booking ID length: {}, Value: '{}'", bookingId.length(), bookingId);
            
            // Try to find a payment using the robust method first
            log.info("Attempting to find payment using robust query for bookingId: {}", bookingId);
            try {
                com.carrentalsystem.entity.Payment robustPayment = paymentService.getByBookingId(bookingId);
                if (robustPayment != null) {
                    log.info("Found payment using robust method - Payment ID: {}, Status: {}", 
                            robustPayment.getId(), robustPayment.getPaymentStatus());
                    log.info("=== PAYMENT CHECK END ===");
                    return ResponseEntity.ok(new PaymentCheckResponse(true, "Payment exists for this booking"));
                }
            } catch (Exception e) {
                log.warn("Robust query failed: {}", e.getMessage());
            }
            
            // First, try to find a payment directly by bookingId
            log.info("Attempting to find payment by bookingId: {}", bookingId);
            com.carrentalsystem.entity.Payment directPayment = paymentService.getByBookingId(bookingId);
            if (directPayment != null) {
                log.info("Found payment directly by bookingId - Payment ID: {}, Status: {}", 
                        directPayment.getId(), directPayment.getPaymentStatus());
            } else {
                log.info("No payment found directly by bookingId: {}", bookingId);
            }
            
            // Debug: Find all payments for this booking ID
            log.info("Debug: Finding all payments for booking ID: {}", bookingId);
            List<com.carrentalsystem.entity.Payment> allPayments = paymentService.findAllPaymentsByBookingId(bookingId);
            if (!allPayments.isEmpty()) {
                log.info("Debug: Found {} payments for booking ID: {}", allPayments.size(), bookingId);
                for (com.carrentalsystem.entity.Payment p : allPayments) {
                    log.info("  Payment ID: {}, Status: {}, Booking ID: '{}'", p.getId(), p.getPaymentStatus(), p.getBookingId());
                }
            } else {
                log.info("Debug: No payments found for booking ID: {}", bookingId);
            }
            
            // Then check with exists method
            boolean exists = paymentService.paymentExistsForBooking(bookingId);
            log.info("Payment exists check result: {}", exists);
            
            String message = exists ? "Payment exists for this booking" : "No payment found for this booking";
            log.info("Payment check result for booking {}: {}", bookingId, exists);
            
            // Let's also log what we found in the database for debugging
            if (exists) {
                com.carrentalsystem.entity.Payment payment = paymentService.getByBookingId(bookingId);
                if (payment != null) {
                    log.info("Found payment with ID: {} for booking ID: {}", payment.getId(), bookingId);
                    log.info("Payment details - Amount: {}, Status: {}, TransactionTime: {}", 
                            payment.getAmount(), payment.getPaymentStatus(), payment.getTransactionTime());
                } else {
                    log.warn("Payment exists check returned true but getByBookingId returned null for booking ID: {}", bookingId);
                }
            } else {
                // Log what we have in the database for this bookingId
                com.carrentalsystem.entity.Payment payment = paymentService.getByBookingId(bookingId);
                if (payment != null) {
                    log.info("Payment exists returned false but found payment with ID: {} for booking ID: {}", payment.getId(), bookingId);
                    log.info("Payment details - Amount: {}, Status: {}, TransactionTime: {}", 
                            payment.getAmount(), payment.getPaymentStatus(), payment.getTransactionTime());
                } else {
                    log.info("No payment found in database for booking ID: {}", bookingId);
                }
            }
            
            log.info("=== PAYMENT CHECK END ===");
            return ResponseEntity.ok(new PaymentCheckResponse(exists, message));
        } catch (Exception e) {
            log.error("Error checking payment status for booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new PaymentCheckResponse(false, "Error checking payment status: " + e.getMessage()));
        }
    }
    
    @GetMapping("/details/{bookingId}")
    @Transactional(readOnly = true)
    public ResponseEntity<PaymentDetailsResponse> getPaymentDetails(@PathVariable String bookingId) {
        log.info("Fetching payment details for booking ID: {}", bookingId);
        
        try {
            // Validate input
            if (bookingId == null || bookingId.trim().isEmpty()) {
                log.warn("Invalid booking ID provided for payment details: {}", bookingId);
                return ResponseEntity.badRequest().build();
            }
            
            log.info("Booking ID for payment details: '{}'", bookingId);
            
            // Try to get payment using the robust method first
            com.carrentalsystem.entity.Payment payment = paymentService.getByBookingId(bookingId);
            
            if (payment == null) {
                // Try one more time with the direct DAO method
                log.info("Payment not found with service method, trying direct DAO method");
                payment = paymentDao.findPaymentByBookingIdRobust(bookingId);
                
                if (payment == null) {
                    log.info("Payment still not found with robust DAO method");
                    // Try the debug method
                    payment = paymentDao.debugFindByBookingId(bookingId);
                    
                    if (payment == null) {
                        log.warn("No payment found for booking ID: {}", bookingId);
                        return ResponseEntity.notFound().build();
                    }
                }
            }
            
            log.info("Found payment for booking ID {}: Payment ID: {}, Status: {}", 
                    bookingId, payment.getId(), payment.getPaymentStatus());
            
            PaymentDetailsResponse response = new PaymentDetailsResponse(
                payment.getPaymentStatus(),
                payment.getTransactionTime(),
                payment.getTransactionRefId(),
                payment.getAmount() // This should now work correctly
            );
            
            log.info("Returning payment details for booking ID {}: {}", bookingId, response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching payment details for booking ID {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/create-order")
    public ResponseEntity<RazorpayOrderResponse> createRazorpayOrder(@RequestBody RazorpayOrderRequest request) {
        try {
            log.info("Creating Razorpay order for booking ID: {}", request.getBookingId());
            log.debug("Order request details - Amount: {}, Currency: {}", request.getAmount(), request.getCurrency());
            RazorpayOrderResponse response = paymentService.createRazorpayOrder(request);
            log.info("Razorpay order created successfully with ID: {}", response.getId());
            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            log.error("Razorpay error while creating order: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new RazorpayOrderResponse());
        } catch (Exception e) {
            log.error("Error creating Razorpay order: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(new RazorpayOrderResponse());
        }
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<CommonApiResponse> verifyPayment(@RequestBody RazorpayPaymentVerificationRequest request) {
        try {
            log.info("Verifying Razorpay payment for order ID: {}", request.getRazorpay_order_id());
            log.debug("Payment verification details - Payment ID: {}, Booking ID: {}, Amount: {}", 
                      request.getRazorpay_payment_id(), request.getBookingId(), request.getAmount());
            
            // Validate required fields
            if (request.getRazorpay_order_id() == null || request.getRazorpay_order_id().isEmpty()) {
                log.warn("Missing razorpay_order_id in request");
                return ResponseEntity.badRequest().body(new CommonApiResponse(false, "Missing razorpay_order_id"));
            }
            
            if (request.getRazorpay_payment_id() == null || request.getRazorpay_payment_id().isEmpty()) {
                log.warn("Missing razorpay_payment_id in request");
                return ResponseEntity.badRequest().body(new CommonApiResponse(false, "Missing razorpay_payment_id"));
            }
            
            if (request.getRazorpay_signature() == null || request.getRazorpay_signature().isEmpty()) {
                log.warn("Missing razorpay_signature in request");
                return ResponseEntity.badRequest().body(new CommonApiResponse(false, "Missing razorpay_signature"));
            }
            
            if (request.getBookingId() == null || request.getBookingId().isEmpty()) {
                log.warn("Missing bookingId in request");
                return ResponseEntity.badRequest().body(new CommonApiResponse(false, "Missing bookingId"));
            }
            
            if (request.getAmount() == null || request.getAmount().isEmpty()) {
                log.warn("Missing amount in request");
                return ResponseEntity.badRequest().body(new CommonApiResponse(false, "Missing amount"));
            }
            
            log.info("Calling paymentService.verifyRazorpayPayment");
            boolean isValid = paymentService.verifyRazorpayPayment(
                request.getRazorpay_order_id(),
                request.getRazorpay_payment_id(),
                request.getRazorpay_signature()
            );
            
            log.info("Payment verification result: {}", isValid);
            
            if (isValid) {
                // Save payment details to database
                log.info("Saving payment details for booking ID: {}", request.getBookingId());
                log.info("Calling paymentService.savePaymentDetails");
                paymentService.savePaymentDetails(
                    request.getRazorpay_order_id(),
                    request.getRazorpay_payment_id(),
                    request.getAmount(),
                    request.getBookingId()
                );
                log.info("Payment verified and saved successfully");
                return ResponseEntity.ok(new CommonApiResponse(true, "Payment verified and saved successfully"));
            } else {
                log.warn("Payment verification failed for order ID: {}", request.getRazorpay_order_id());
                return ResponseEntity.badRequest().body(new CommonApiResponse(false, "Payment verification failed"));
            }
        } catch (Exception e) {
            log.error("Error verifying payment for order ID {}: {}", request.getRazorpay_order_id(), e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new CommonApiResponse(false, "Error verifying payment: " + e.getMessage()));
        }
    }

    @PostMapping("/cod-confirm")
    public ResponseEntity<CommonApiResponse> confirmCashOnDelivery(@RequestBody CustomerBookingPaymentRequest request) {
        try {
            log.info("Processing COD payment for booking ID: {}", request.getBookingId());
            String transactionId = paymentService.processCashOnDelivery(
                request.getBookingId(),
                request.getAmount(),
                request.getCustomerName(),
                request.getCustomerEmail()
            );
            log.info("COD order confirmed successfully with transaction ID: {}", transactionId);
            return ResponseEntity.ok(new CommonApiResponse(true, "COD order confirmed successfully", transactionId));
        } catch (Exception e) {
            log.error("Error processing COD order for booking ID {}: {}", request.getBookingId(), e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new CommonApiResponse(false, "Error processing COD order: " + e.getMessage()));
        }
    }
}
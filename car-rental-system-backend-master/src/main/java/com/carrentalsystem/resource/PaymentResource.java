package com.carrentalsystem.resource;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carrentalsystem.dto.CommonApiResponse;
import com.carrentalsystem.dto.RazorpayOrderRequest;
import com.carrentalsystem.dto.RazorpayOrderResponse;
import com.carrentalsystem.dto.RazorpayPaymentVerificationRequest;
import com.carrentalsystem.entity.Booking;
import com.carrentalsystem.entity.Payment;
import com.carrentalsystem.entity.User;
import com.carrentalsystem.service.BookingService;
import com.carrentalsystem.service.PaymentService;
import com.carrentalsystem.service.RazorpayService;
import com.carrentalsystem.service.UserService;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentResource {
	
	private final Logger LOG = LoggerFactory.getLogger(PaymentResource.class);
	
	@Autowired
	private RazorpayService razorpayService;
	
	@Autowired
	private PaymentService paymentService;
	
	@Autowired
	private BookingService bookingService;
	
	@Autowired
	private UserService userService;


	
	@PostMapping("/razorpay/create-order")
	public ResponseEntity<CommonApiResponse> createRazorpayOrder(@RequestBody RazorpayOrderRequest request) {
		CommonApiResponse response = new CommonApiResponse();
		
		try {
			RazorpayOrderResponse orderResponse = razorpayService.createOrder(request);
			
			response.setSuccess(true);
			response.setResponseMessage("Razorpay order created successfully");
			response.setData(orderResponse);
			
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			LOG.error("Error creating Razorpay order: " + e.getMessage());
			response.setSuccess(false);
			response.setResponseMessage("Failed to create Razorpay order: " + e.getMessage());
			return ResponseEntity.badRequest().body(response);
		}
	}
	
	@PostMapping("/razorpay/verify-payment")
	public ResponseEntity<CommonApiResponse> verifyRazorpayPayment(@RequestBody RazorpayPaymentVerificationRequest request) {
		CommonApiResponse response = new CommonApiResponse();
		
		try {
			boolean isVerified = razorpayService.verifyPayment(request);
			
			if (isVerified) {
				// Update payment status in database
				Payment payment = paymentService.getByTransactionRefId(request.getRazorpay_order_id());
				if (payment != null) {
					payment.setRazorpayOrderId(request.getRazorpay_order_id());
					payment.setRazorpayPaymentId(request.getRazorpay_payment_id());
					payment.setPaymentStatus("COMPLETED");
					payment.setTransactionTime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
					paymentService.updatePayment(payment);
					
					// Update booking status
					Booking booking = bookingService.getByBookingId(payment.getBookingId());
					if (booking != null) {
						booking.setStatus("CONFIRMED");
						bookingService.updateBooking(booking);
					}
				}
				
				response.setSuccess(true);
				response.setResponseMessage("Razorpay payment verified successfully");
			} else {
				response.setSuccess(false);
				response.setResponseMessage("Razorpay payment verification failed");
			}
			
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			LOG.error("Error verifying Razorpay payment: " + e.getMessage());
			response.setSuccess(false);
			response.setResponseMessage("Failed to verify Razorpay payment: " + e.getMessage());
			return ResponseEntity.badRequest().body(response);
		}
	}
}

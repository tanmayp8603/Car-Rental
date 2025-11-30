package com.carrentalsystem.dao;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.carrentalsystem.entity.Payment;
import com.carrentalsystem.entity.User;

import java.util.List;

@Repository
public interface PaymentDao extends JpaRepository<Payment, Integer> {
    
    // Add logging capability
    Logger log = LoggerFactory.getLogger(PaymentDao.class);

	// Original method - may have issues with certain booking IDs
	Payment findByBookingId(String bookingId);
	
	Payment findByTransactionRefId(String transactionId);
	
	// Find payment by Razorpay payment id (used in Razorpay integration flow)
	Payment findByRazorpayPaymentId(String razorpayPaymentId);

	// Check if a payment already exists for a given booking ID
	boolean existsByBookingId(String bookingId);

	// Find payment by Razorpay order id (used in Razorpay integration flow)
	Payment findByRazorpayOrderId(String razorpayOrderId);

	List<Payment> findByCustomer(User user);
	
	// Custom method to help with debugging - find all payments with a specific booking ID
	@Query("SELECT p FROM Payment p WHERE p.bookingId = :bookingId")
	List<Payment> findAllByBookingId(@Param("bookingId") String bookingId);
	
	// More robust query method that handles potential whitespace or encoding issues
	@Query("SELECT p FROM Payment p WHERE TRIM(p.bookingId) = TRIM(:bookingId)")
	Payment findPaymentByBookingIdRobust(@Param("bookingId") String bookingId);
	
	// Custom method with debugging
	default Payment debugFindByBookingId(String bookingId) {
	    log.info("DAO: Finding payment by booking ID: '{}'", bookingId);
	    if (bookingId != null) {
	    }
	    Payment result = findByBookingId(bookingId);
	    log.info("DAO: Find by booking ID result: {}", result != null ? "FOUND (ID: " + result.getId() + ")" : "NOT FOUND");
	    return result;
	}
	
	// Custom method with debugging for exists check
	default boolean debugExistsByBookingId(String bookingId) {
	    log.info("DAO: Checking if payment exists by booking ID: '{}'", bookingId);
	    if (bookingId != null) {
	        log.info("DAO: Booking ID length: {}, Characters: '{}'", bookingId.length(), bookingId);
	    }
	    boolean result = existsByBookingId(bookingId);
	    log.info("DAO: Exists by booking ID result: {}", result);
	    return result;
	}
}
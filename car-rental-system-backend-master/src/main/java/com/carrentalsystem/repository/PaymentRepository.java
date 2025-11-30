package com.carrentalsystem.repository;

import com.carrentalsystem.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    boolean existsByBookingId(String bookingId);
    
    Payment findByBookingId(String bookingId);
    
    Optional<Payment> findById(Integer id);
    
    Payment save(Payment payment);
    
    void delete(Payment payment);
}

package com.carrentalsystem.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.carrentalsystem.entity.Booking;
import com.carrentalsystem.entity.User;
import com.carrentalsystem.entity.Vehicle;

@Repository
public interface BookingDao extends JpaRepository<Booking, Integer> {
    
    // Add logging capability
    Logger log = LoggerFactory.getLogger(BookingDao.class);

	Booking findByBookingId(String bookingId);

	@Query("SELECT b FROM Booking b LEFT JOIN FETCH b.payment WHERE b.customer = :customer")
	List<Booking> findByCustomer(@Param("customer") User customer);

	List<Booking> findByStatus(String status);

	List<Booking> findByVehicle(Vehicle vehicle);
}
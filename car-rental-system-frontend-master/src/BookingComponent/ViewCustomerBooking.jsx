import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const ViewCustomerBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state;
  const [hasPayment, setHasPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  console.log("ViewCustomerBooking received booking data:", booking);
  console.log("Booking bookingId:", booking?.bookingId);
  console.log("Booking id:", booking?.id);
  console.log("Booking variant:", booking?.variant);
  console.log("Booking customer:", booking?.customer);
  console.log("Booking startDate:", booking?.startDate);
  console.log("Booking endDate:", booking?.endDate);
  console.log("Booking status:", booking?.status);

  // Check if user is logged in when component mounts
  useEffect(() => {
    const customer = JSON.parse(sessionStorage.getItem("active-customer"));
    const admin = JSON.parse(sessionStorage.getItem("active-admin"));
    const customerToken = sessionStorage.getItem("customer-jwtToken");
    const adminToken = sessionStorage.getItem("admin-jwtToken");
    
    // If no customer or admin data/token, redirect to home page
    if ((!customer || !customerToken) && (!admin || !adminToken)) {
      navigate("/");
      return;
    }
    
    // If no booking data, show error message (don't redirect here)
    if (!booking) {
      // This will be handled by the conditional render below
      return;
    }
  }, [booking, navigate]);

  // Fetch payment status when component mounts
  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        console.log("Fetching payment status for booking:", booking);
        
        // Validate that we have booking data
        if (!booking) {
          console.error("No booking data available");
          setHasPayment(false);
          setPaymentDetails(null);
          return;
        }
        
        const bookingId = booking.bookingId || booking.id;
        console.log("Using booking ID for payment check:", bookingId);
        
        // Validate that we have a booking ID
        if (!bookingId) {
          console.error("No booking ID found for payment check");
          setHasPayment(false);
          setPaymentDetails(null);
          return;
        }
        
        // Log the full URL we're calling
        console.log("Calling payment check endpoint:", `http://localhost:8080/api/payment/check/${bookingId}`);
        
        // First, let's try to get payment details directly
        try {
          const paymentResponse = await axios.get(
            `http://localhost:8080/api/payment/details/${bookingId}`
          );
          console.log("Direct payment details response:", paymentResponse.data);
          setPaymentDetails(paymentResponse.data);
          setHasPayment(true);
          return;
        } catch (directError) {
          console.log("Direct payment details fetch failed:", directError.response?.data || directError.message);
          // Continue with the original approach
        }
        
        // Original approach - check if payment exists
        const response = await axios.get(
          `http://localhost:8080/api/payment/check/${bookingId}`
        );
        const paymentExists = response.data.exists;
        console.log("Payment exists check response:", response.data);
        setHasPayment(paymentExists);
        
        // If payment exists, fetch payment details
        if (paymentExists) {
          console.log("Fetching payment details for booking ID:", bookingId);
          const paymentResponse = await axios.get(
            `http://localhost:8080/api/payment/details/${bookingId}`
          );
          console.log("Payment details response:", paymentResponse.data);
          setPaymentDetails(paymentResponse.data);
        } else {
          setPaymentDetails(null);
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setHasPayment(false);
        setPaymentDetails(null);
      }
    };

    if (booking && (booking.variant)) {
      fetchPaymentStatus();
    }
  }, [booking]);

  // Defensive: If booking or booking.variant is missing, show error UI
  if (!booking) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger mt-4">
          <h4>Booking details not available.</h4>
          <p>No booking information was passed to this page. Please go back and try again.</p>
        </div>
      </div>
    );
  }
  
  if (!booking.variant) {
    return (
      <div className="container-fluid">
      <div className="alert alert-danger mt-4">
        <h4>Booking details incomplete.</h4>
        <p>The booking information is missing vehicle details. Please go back and try again.</p>
      </div>
    </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    // Handle both epoch timestamps (numbers) and ISO date strings
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } else {
      // Assume it's already a readable date string
      return timestamp;
    }
  };

  return (
    <div className="container-fluid bg-transparent mt-4">
      <div className="card border-0 rounded-lg bg-transparent">
        <div className="card-header bg-primary text-white text-center py-3">
          <h2 className="mb-0">
            <i className="fas fa-car me-2"></i>
            {booking?.variant?.modelNumber?.toString() || "Vehicle"} Details
          </h2>
        </div>
        <div className="card-body bg-transparent">
          {/* Vehicle and Company Information */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="p-3 rounded bg-light">
                <h4 className="text-primary border-bottom pb-2">Vehicle Information</h4>
                <div className="row">
                  <div className="col-6">
                    <p><strong>Company:</strong> {booking?.variant?.company?.name?.toString() || "N/A"}</p>
                    <p><strong>Model:</strong> {booking?.variant?.modelNumber?.toString() || "N/A"}</p>
                    <p><strong>Fuel Type:</strong> {booking?.variant?.fuelType?.toString() || "N/A"}</p>
                  </div>
                  <div className="col-6">
                    <p><strong>Price/Day:</strong> ₹{booking?.variant?.pricePerDay?.toString() || booking?.variant?.price?.toString() || "N/A"}</p>
                    <p><strong>Registration:</strong> {booking?.vehicle?.registrationNumber?.toString() || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-center">
              {booking?.variant?.image ? (
                <img
                  src={`http://localhost:8080/image/${booking.variant.image}`}
                  alt={booking?.variant?.modelNumber?.toString() || "Car"}
                  className="img-fluid rounded shadow"
                  style={{ 
                    maxHeight: "200px", 
                    maxWidth: "100%",
                    objectFit: "contain",
                    width: "auto",
                    height: "auto"
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="p-5 rounded d-flex align-items-center justify-content-center bg-light" style={{ height: "200px" }}>
                  <i className="fas fa-car fa-3x text-muted"></i>
                </div>
              )}
            </div>
          </div>

          <div className="row">
            {/* Booking Details Section */}
            <div className="col-md-6 mb-4">
              <div className="p-3 rounded bg-light h-100">
                <h4 className="text-primary border-bottom pb-2">Booking Details</h4>
                <p><strong>Booking ID:</strong> {booking?.bookingId?.toString() || "N/A"}</p>
                <p><strong>Booking Time:</strong> {formatDate(booking?.bookingTime)}</p>
                <p><strong>From Date:</strong> {booking?.startDate?.toString() || "N/A"}</p>
                <p><strong>To Date:</strong> {booking?.endDate?.toString() || "N/A"}</p>
                <p><strong>Total Days:</strong> {booking?.totalDay?.toString() || "N/A"}</p>
                <p><strong>Total Price:</strong> ₹ {booking?.totalPrice?.toString() || "N/A"}</p>
                <p><strong>Status:</strong> 
                  <span className={`badge ${booking?.status?.toString() === 'CONFIRMED' ? 'bg-success' : booking?.status?.toString() === 'Cancel' ? 'bg-danger' : 'bg-warning'} ms-2`}>
                    {booking?.status?.toString() || "N/A"}
                  </span>
                </p>
              </div>
            </div>

            {/* Customer Details Section */}
            <div className="col-md-6 mb-4">
              <div className="p-3 rounded bg-light h-100">
                <h4 className="text-primary border-bottom pb-2">Customer Details</h4>
                <p><strong>Name:</strong> {booking?.customer?.firstName?.toString() ? `${booking.customer.firstName} ${booking.customer.lastName || ''}`.trim() : "N/A"}</p>
                <p><strong>Contact:</strong> {booking?.customer?.phoneNo?.toString() || "N/A"}</p>
                <p><strong>Email:</strong> {booking?.customer?.emailId?.toString() || "N/A"}</p>
                <p><strong>Address:</strong> {booking?.customer?.address ? `${booking.customer.address.street}, ${booking.customer.address.city} ${booking.customer.address.pincode}` : "N/A"}</p>
                <p><strong>Vehicle Registration:</strong> {booking?.vehicle?.registrationNumber?.toString() || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Driving License Section */}
            <div className="col-md-6 mb-4">
              <div className="p-3 rounded bg-light h-100">
                <h4 className="text-primary border-bottom pb-2">Driving License</h4>
                <p><strong>License Number:</strong> {booking?.customer?.license?.licenseNumber?.toString() || "N/A"}</p>
                <p><strong>Expiry Date:</strong> {booking?.customer?.license?.expirationDate?.toString() || "N/A"}</p>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="col-md-6 mb-4">
              <div className="p-3 rounded bg-light h-100">
                <h4 className="text-primary border-bottom pb-2">Payment Details</h4>
                {(hasPayment || (booking?.status && (booking.status.includes("Paid") || booking.status.includes("CONFIRMED")))) ? (
                  <>
                    <p><strong>Payment Status:</strong> 
                      <span className="badge bg-success ms-2">
                        {paymentDetails?.paymentStatus?.toString() || booking?.status?.toString() || "COMPLETED"}
                      </span>
                    </p>
                    <p><strong>Transaction Time:</strong> {paymentDetails?.transactionTime?.toString() || "Completed"}</p>
                    <p><strong>Transaction Ref:</strong> {paymentDetails?.transactionRefId?.toString() || "N/A"}</p>
                    <p><strong>Amount Paid:</strong> ₹ {paymentDetails?.amount?.toString() || booking?.totalPrice?.toString() || "0"}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Payment Status:</strong> 
                      <span className="badge bg-warning ms-2">Pending</span>
                    </p>
                    <p><strong>Transaction Time:</strong> Pending</p>
                    <p><strong>Transaction Ref:</strong> Pending</p>
                    <p><strong>Amount Paid:</strong> ₹ 0.0</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="card-footer text-center bg-transparent border-0">
          <button className="btn btn-primary me-2" onClick={() => window.history.back()}>
            <i className="fas fa-arrow-left me-1"></i> Back to Bookings
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <i className="fas fa-print me-1"></i> Print Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCustomerBooking;
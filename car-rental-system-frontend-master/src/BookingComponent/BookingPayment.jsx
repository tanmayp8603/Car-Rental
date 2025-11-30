import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Form } from "react-bootstrap";
import Razorpay from "react-razorpay";
import creditcard from "../images/credit-card.png";
import { ToastContainer } from "react-toastify";
import axios from "axios";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Important for cookies/session
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        method: config.method.toUpperCase(),
        url: config.url,
        data: config.data,
        headers: config.headers
      });
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    const statusCode = error.response?.status;
    
    console.error('API Error:', {
      status: statusCode,
      message: errorMessage,
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error object:', error);
    }

    // Handle 401 Unauthorized
    if (statusCode === 401) {
      sessionStorage.removeItem('jwtToken');
      sessionStorage.removeItem('active-customer');
      // Use window.location to ensure full page reload and clear React state
      window.location.href = '/customer/login';
      return Promise.reject(new Error('Unauthorized'));
    }

    // Show error to user
    if (errorMessage.toLowerCase().includes('network error')) {
      toast.error('Unable to connect to the server. Please check your internet connection.');
    } else if (statusCode !== 401) { // Don't show error toast for 401 as we're redirecting
      toast.error(errorMessage);
    }
    
    // Return error response with both message and response data
    return Promise.reject({
      message: errorMessage,
      response: error.response?.data,
      status: statusCode
    });
  }
);

const BookingPayment = () => {
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const razorpayRef = useRef(null);
  
  // State management
  const [paymentExists, setPaymentExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [order, setOrder] = useState(null);
  const [showRazorpay, setShowRazorpay] = useState(false);
  
  // Get booking and customer data
  const booking = location.state?.booking || location.state || {};
  const sessionCustomer = JSON.parse(sessionStorage.getItem("active-customer")) || {};
  
  // Check for existing payment
  const checkPaymentStatus = useCallback(async () => {
    try {
      // Use bookingId instead of id
      const response = await apiClient.get(`/payment/check/${booking.bookingId || booking.id}`);
      if (response.data.exists) {
        setPaymentExists(true);
        toast.info("Payment already completed for this booking.");
      }
      return response.data.exists;
    } catch (error) {
      // Don't show error toast for 404 (payment not found is an expected case)
      if (error.response?.status !== 404) {
        toast.error('Error checking payment status. Please refresh the page and try again.');
        console.error('Error checking existing payment:', error);
      }
      return false;
    }
  }, [booking.bookingId, booking.id]);

  // Check if user is logged in and booking data exists
  useEffect(() => {
    const checkAuthAndBooking = () => {
      if (!sessionCustomer?.id) {
        toast.error("Please login to make payments");
        console.error('User not logged in:', sessionCustomer);
        navigate("/customer/login");
        return false;
      }

      // Check for bookingId or id
      if (!booking?.bookingId && !booking?.id) {
        toast.error("Invalid booking data");
        navigate("/customer/bookings");
        return false;
      }
      return true;
    };

    if (checkAuthAndBooking()) {
      checkPaymentStatus();
    }
  }, [sessionCustomer, booking, navigate, checkPaymentStatus]);

  // Payment request state
  const [paymentRequest, setPaymentRequest] = useState({
    bookingId: booking?.bookingId || booking?.id || "",  // Use bookingId instead of id
    nameOnCard: "",
    cardNo: "",
    cvv: "",
    expiryDate: "",
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create Razorpay order
  const createRazorpayOrder = async () => {
    try {
      // Ensure amount is properly formatted
      const amount = booking?.totalPrice ? Math.round(Number(booking.totalPrice) * 100) : 0;
      console.log('Creating Razorpay order with amount (in paise):', amount);
      
      const orderData = {
        bookingId: booking.bookingId || booking.id,  // Use bookingId instead of id
        amount: amount.toString(),  // Convert to string
        currency: "INR",
        orderId: `order_${booking.bookingId || booking.id}_${Date.now()}`,  // Use bookingId instead of id
        customerName: `${sessionCustomer?.firstName || ''} ${sessionCustomer?.lastName || ''}`.trim(),
        customerEmail: sessionCustomer?.email,
        customerPhone: sessionCustomer?.phone || '9999999999',
        description: `Payment for booking #${booking.bookingId || booking.id}`  // Use bookingId instead of id
      };
      
      console.log('Request: POST /payment/create-order', orderData);
      const response = await apiClient.post('/payment/create-order', orderData);
      
      // Check if response data is already an object or needs to be parsed
      let responseData = response.data;
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (parseError) {
          console.error('Error parsing response data:', parseError);
          throw new Error('Invalid response format from server');
        }
      }
      
      if (!responseData || !responseData.id) {
        throw new Error('Invalid response from payment server');
      }
      
      console.log('Razorpay order created successfully:', responseData);
      return responseData;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || error.message || 'Failed to create payment order. Please try again.';
      console.error('Error creating Razorpay order:', {
        error: error.message,
        response: error.response?.data,
        bookingId: booking?.bookingId || booking?.id,
        amount: booking?.totalPrice
      });
      throw new Error(errorMessage);
    }
  };

  // Verify Razorpay payment
  const verifyRazorpayPayment = async (orderId, paymentId, signature) => {
    try {
      console.log('Verifying Razorpay payment:', { orderId, paymentId, signature, bookingId: booking.bookingId || booking.id });
      
      // Validate required data before sending request
      if (!orderId) {
        throw new Error('Missing order ID');
      }
      if (!paymentId) {
        throw new Error('Missing payment ID');
      }
      if (!signature) {
        throw new Error('Missing signature');
      }
      const actualBookingId = booking?.bookingId || booking?.id;
      if (!actualBookingId) {
        throw new Error('Missing booking ID');
      }
      if (!booking?.totalPrice) {
        throw new Error('Missing booking amount');
      }
      
      // Ensure amount is properly formatted
      const amountInPaise = Math.round(Number(booking.totalPrice) * 100);
      if (isNaN(amountInPaise) || amountInPaise <= 0) {
        throw new Error('Invalid booking amount');
      }
      
      const response = await apiClient.post(
        '/payment/verify-payment',
        {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          bookingId: actualBookingId,  // Use bookingId instead of id
          amount: amountInPaise.toString()  // Add amount to the request
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("jwtToken")}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Payment verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (response) => {
    try {
      setLoading(true);
      const result = await verifyRazorpayPayment(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature
      );

      if (result.success) {
        toast.success('Payment successful! Your booking is confirmed.');
        setTimeout(() => {
          // Redirect back to bookings page instead of confirmation page
          navigate('/customer/bookings');
        }, 2000);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
    setLoading(false);
    setShowRazorpay(false);
  };

  // Process mock payment (for Cash on Delivery)
  const processMockPayment = async () => {
    try {
      setLoading(true);
      
      // Get customer data
      const sessionCustomer = JSON.parse(sessionStorage.getItem("active-customer")) || {};
      
      // Call your backend to confirm the COD payment
      const response = await apiClient.post('/payment/cod-confirm', {
        bookingId: parseInt(booking.bookingId || booking.id),  // Convert to integer
        amount: booking.totalPrice,
        customerName: `${sessionCustomer?.firstName || ''} ${sessionCustomer?.lastName || ''}`.trim(),
        customerEmail: sessionCustomer?.email || ''
      });
      
      // Check if response data is already an object or needs to be parsed
      let responseData = response.data;
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (parseError) {
          console.error('Error parsing response data:', parseError);
          throw new Error('Invalid response format from server');
        }
      }
      
      if (responseData.success) {
        toast.success('Cash on Delivery order confirmed successfully!');
        // Redirect back to bookings page instead of confirmation page
        navigate('/customer/bookings');
      } else {
        throw new Error(responseData.message || 'Failed to confirm COD order');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || error.message || 'Failed to process COD order. Please try again.';
      console.error('COD payment error:', {
        error: error.message,
        response: error.response?.data,
        bookingId: booking?.bookingId || booking?.id
      });
      toast.error(errorMessage);
      throw error; // Re-throw to be handled by the caller
    } finally {
      setLoading(false);
    }
  };

  // Handle payment submission
  const payAndConfirmBooking = async (e) => {
    e.preventDefault();
    
    if (paymentExists) {
      toast.info("Payment already completed for this booking.");
      return;
    }

    if (!booking || !booking.id) {
      toast.error("Invalid booking data. Please try again.");
      return;
    }

    setLoading(true);
    
    try {
      if (paymentMethod === "razorpay") {
        // Create Razorpay order
        const order = await createRazorpayOrder();
        
        // Razorpay options
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: "Car Rental System",
          description: `Payment for booking #${booking.bookingId || booking.id}`,
          order_id: order.id,
          handler: handlePaymentSuccess,
          prefill: {
            name: `${sessionCustomer?.firstName || ''} ${sessionCustomer?.lastName || ''}`.trim(),
            email: sessionCustomer?.email || '',
            contact: sessionCustomer?.phone || '9999999999',
          },
          notes: {
            bookingId: booking.bookingId || booking.id,
          },
          theme: {
            color: "#3399cc"
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            }
          }
        };
        
        // Initialize Razorpay payment
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (paymentMethod === "cod") {
        await processMockPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      let errorMessage = 'Failed to process payment. ';
      
      if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage += 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.message && error.message.includes('NetworkError')) {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again later.';
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      {paymentExists && (
        <div className="alert alert-info mt-3">Payment already completed for this booking.</div>
      )}
      <ToastContainer 
        position="top-center" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop={false} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
      />
      <div className="d-flex align-items-center justify-content-center ms-5 mt-1 me-5 mb-3">
        <div className="card form-card rounded-card h-100 custom-bg" style={{ maxWidth: "900px" }}>
          <div className="card-body header-logo-color">
            <h4 className="card-title text-color text-center">Payment Gateway</h4>
            <div className="mt-4">
              <div className="row">
                <div className="col-md-8">
                  {showRazorpay && order && (
                    <div className="razorpay-container">
                      <Razorpay
                        key={Date.now()}
                        ref={razorpayRef}
                        currency="INR"
                        amount={Math.round(Number(booking?.totalPrice) * 100) || 0}
                        name="Car Rental System"
                        description={`Payment for booking #${booking?.bookingId || booking?.id}`}
                        order_id={order.id}
                        prefill={{
                          name: `${sessionCustomer?.firstName || ''} ${sessionCustomer?.lastName || ''}`.trim(),
                          email: sessionCustomer?.email || '',
                          contact: sessionCustomer?.phone || '9999999999'
                        }}
                        notes={{
                          booking_id: booking?.bookingId || booking?.id
                        }}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        onClose={() => {
                          setShowRazorpay(false);
                          setLoading(false);
                        }}
                        theme={{
                          color: '#3399cc'
                        }}
                      />
                    </div>
                  )}
                  {!showRazorpay && (
                    <div className="text-center p-5">
                      <h5>Select a payment method and click "Pay Now" to proceed</h5>
                      <p className="text-muted">You'll be redirected to the secure payment gateway</p>
                    </div>
                  )}
                </div>
                <div className="col-md-4 mt-2">
                  <div className="mb-3">
                    <label className="form-label text-color">
                      <b>Payment Method</b>
                    </label>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="razorpay"
                        value="razorpay"
                        checked={paymentMethod === "razorpay"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        disabled={loading}
                      />
                      <label className="form-check-label text-color" htmlFor="razorpay">
                        <div className="d-flex align-items-center">
                          <span>Razorpay Payment Gateway</span>
                          <span className="badge bg-primary ms-2">Recommended</span>
                        </div>
                        <small className="d-block text-muted">Pay via Credit/Debit Card, UPI, Net Banking</small>
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="cod"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        disabled={loading}
                      />
                      <label className="form-check-label text-color" htmlFor="cod">
                        Cash on Delivery
                      </label>
                    </div>
                  </div>
                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={payAndConfirmBooking}
                      disabled={loading || paymentExists}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Processing...
                        </>
                      ) : (
                        `Pay ₹${booking?.totalPrice || '0'} Now`
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPayment;
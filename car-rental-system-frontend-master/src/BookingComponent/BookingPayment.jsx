import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Form } from "react-bootstrap";
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
    const isConnectionRefused = error.code === 'ERR_NETWORK' || 
                                 error.message?.toLowerCase().includes('network error') ||
                                 error.message?.toLowerCase().includes('connection refused');
    
    console.error('API Error:', {
      status: statusCode,
      message: errorMessage,
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      code: error.code
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
    if (isConnectionRefused) {
      toast.error('Backend server is not running. Please start the backend server on port 8080.', {
        position: "top-center",
        autoClose: 8000,
      });
    } else if (errorMessage.toLowerCase().includes('network error')) {
      toast.error('Unable to connect to the server. Please check your internet connection.');
    } else if (statusCode !== 401) { // Don't show error toast for 401 as we're redirecting
      toast.error(errorMessage);
    }
    
    // Return error response with both message and response data
    return Promise.reject({
      message: errorMessage,
      response: error.response?.data,
      status: statusCode,
      isConnectionRefused: isConnectionRefused
    });
  }
);

const BookingPayment = () => {
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [paymentExists, setPaymentExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [order, setOrder] = useState(null);
  
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

  // Load Razorpay script
  useEffect(() => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log('Razorpay script already loaded');
      return;
    }

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
    };
    
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      toast.error("Failed to load payment gateway. Please disable ad blockers and refresh the page.", {
        position: "top-center",
        autoClose: 5000,
      });
    };
    
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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

  // Create Razorpay order and open payment modal
  const createRazorpayOrder = async () => {
    setLoading(true);
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
      
      // The backend returns a RazorpayOrderResponse object
      console.log('Response:', response.data);
      
      // Check if we got a valid order response (should have an id)
      if (response.data && response.data.id) {
        // Check if Razorpay is available
        if (!window.Razorpay) {
          throw new Error('Razorpay payment gateway is not loaded. Please refresh the page.');
        }

        // Initialize Razorpay payment options
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_6N3gRgK9B1lmko",
          amount: response.data.amount,
          currency: response.data.currency || "INR",
          name: "Car Rental System",
          description: `Payment for booking #${booking.bookingId || booking.id}`,
          order_id: response.data.id,
          handler: handleRazorpaySuccess,
          prefill: {
            name: `${sessionCustomer?.firstName || ''} ${sessionCustomer?.lastName || ''}`.trim(),
            email: sessionCustomer?.email || '',
            contact: sessionCustomer?.phone || ''
          },
          notes: {
            booking_id: booking.bookingId || booking.id
          },
          theme: {
            color: "#3399cc"
          },
          modal: {
            ondismiss: () => {
              console.log('Razorpay modal closed');
              setLoading(false);
            }
          }
        };

        // Set order state for later use
        setOrder(response.data);
        
        // Open Razorpay payment modal
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Handle error response
        throw new Error('Failed to create payment order');
      }
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      setLoading(false);
      
      // Show user-friendly error message
      if (error.isConnectionRefused || error.code === 'ERR_NETWORK' || 
          error.message?.toLowerCase().includes('connection refused')) {
        toast.error('Backend server is not running. Please start the backend server on port 8080.', {
          position: "top-center",
          autoClose: 8000,
        });
      } else if (error.message?.includes('Network Error')) {
        toast.error('Network connection failed. Please check your internet connection and try again.');
      } else if (error.message?.includes('401') || error.status === 401) {
        toast.error('Your session has expired. Please login again.');
        sessionStorage.removeItem('jwtToken');
        sessionStorage.removeItem('active-customer');
        setTimeout(() => {
          navigate('/customer/login');
        }, 2000);
      } else {
        toast.error(error.message || 'Failed to initiate payment. Please try again.');
      }
    }
  };

  // Handle Razorpay payment success
  const handleRazorpaySuccess = async (response) => {
    try {
      console.log('Razorpay payment successful:', response);
      setLoading(false);
      
      // Use the amount from the order response to ensure consistency
      const amount = order?.amount || (booking?.totalPrice ? Math.round(Number(booking.totalPrice) * 100) : 0);
      
      // Verify payment with backend
      const verificationData = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        bookingId: booking.bookingId || booking.id,  // Use bookingId instead of id
        amount: amount.toString()
      };
      
      console.log('Verifying payment with backend:', verificationData);
      
      const verifyResponse = await apiClient.post('/payment/verify-payment', verificationData);
      
      console.log('Payment verification response:', verifyResponse.data);
      
      if (verifyResponse.data.success) {
        toast.success('Payment successful!');
        setTimeout(() => {
          navigate('/booking-confirmation', { 
            state: { 
              booking: booking,
              paymentId: verifyResponse.data.paymentId 
            } 
          });
        }, 2000);
      } else {
        throw new Error(verifyResponse.data.responseMessage || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setLoading(false);
      toast.error('Payment verification failed. Please contact support.');
    }
  };

  // Handle Razorpay payment failure
  const handleRazorpayFailure = (response) => {
    console.error('Razorpay payment failed:', response);
    setLoading(false);
    toast.error('Payment failed. Please try again.');
  };

  // Process card payment
  const processCardPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate card details
      if (!paymentRequest.nameOnCard || !paymentRequest.cardNo || 
          !paymentRequest.cvv || !paymentRequest.expiryDate) {
        toast.error('Please fill in all card details');
        setLoading(false);
        return;
      }
      
      // Validate card number (basic validation)
      if (paymentRequest.cardNo.replace(/\s/g, '').length < 16) {
        toast.error('Please enter a valid card number');
        setLoading(false);
        return;
      }
      
      // Validate CVV (basic validation)
      if (paymentRequest.cvv.length < 3) {
        toast.error('Please enter a valid CVV');
        setLoading(false);
        return;
      }
      
      // Create payment data
      const paymentData = {
        bookingId: booking.bookingId || booking.id,  // Use bookingId instead of id
        amount: booking?.totalPrice?.toString() || "0",
        cardNumber: paymentRequest.cardNo.replace(/\s/g, ''),
        cardHolderName: paymentRequest.nameOnCard,
        expiryDate: paymentRequest.expiryDate,
        cvv: paymentRequest.cvv,
        paymentMethod: "CARD"
      };
      
      console.log('Processing card payment:', paymentData);
      
      const response = await apiClient.post('/payment/process', paymentData);
      
      console.log('Card payment response:', response.data);
      
      if (response.data.success) {
        toast.success('Payment successful!');
        setTimeout(() => {
          navigate('/booking-confirmation', { 
            state: { 
              booking: booking,
              paymentId: response.data.paymentId 
            } 
          });
        }, 2000);
      } else {
        throw new Error(response.data.responseMessage || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing card payment:', error);
      
      if (error.message.includes('Network Error')) {
        toast.error('Network connection failed. Please check your internet connection and try again.');
      } else if (error.message.includes('401')) {
        toast.error('Your session has expired. Please login again.');
        sessionStorage.removeItem('jwtToken');
        sessionStorage.removeItem('active-customer');
        setTimeout(() => {
          navigate('/customer/login');
        }, 2000);
      } else {
        toast.error(error.message || 'Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  // Format card number input
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Handle card number input
  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setPaymentRequest(prev => ({
      ...prev,
      cardNo: formattedValue
    }));
  };

  // Handle expiry date input
  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setPaymentRequest(prev => ({
      ...prev,
      expiryDate: value
    }));
  };

  // Handle CVV input
  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    setPaymentRequest(prev => ({
      ...prev,
      cvv: value
    }));
  };

  return (
    <div className="container mt-4">
      <ToastContainer />
      
      {/* Show loading spinner */}
      {loading && (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Processing...</span>
          </div>
          <p>Processing your payment...</p>
        </div>
      )}
      
      {/* Show payment form only if not loading and payment doesn't exist */}
      {!loading && !paymentExists && (
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Payment for Booking #{booking?.bookingId || booking?.id}</h4>
              </div>
              <div className="card-body">
                {/* Booking Summary */}
                <div className="mb-4 p-3 bg-light rounded">
                  <h5>Booking Summary</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Vehicle:</strong> {booking?.variant?.modelNumber || 'N/A'}</p>
                      <p><strong>From:</strong> {booking?.startDate || 'N/A'}</p>
                      <p><strong>To:</strong> {booking?.endDate || 'N/A'}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Total Days:</strong> {booking?.totalDay || 'N/A'}</p>
                      <p><strong>Price/Day:</strong> ₹{booking?.variant?.pricePerDay || booking?.variant?.price || 'N/A'}</p>
                      <p><strong>Total Amount:</strong> <strong>₹{booking?.totalPrice || 'N/A'}</strong></p>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-4">
                  <h5>Select Payment Method</h5>
                  <div className="btn-group" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="paymentMethod"
                      id="razorpay"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => handlePaymentMethodChange("razorpay")}
                    />
                    <label className="btn btn-outline-primary" htmlFor="razorpay">
                      Razorpay
                    </label>
                    
                    <input
                      type="radio"
                      className="btn-check"
                      name="paymentMethod"
                      id="card"
                      checked={paymentMethod === "card"}
                      onChange={() => handlePaymentMethodChange("card")}
                    />
                    <label className="btn btn-outline-primary" htmlFor="card">
                      Credit/Debit Card
                    </label>
                  </div>
                </div>

                {/* Razorpay Payment */}
                {paymentMethod === "razorpay" && (
                  <div className="text-center">
                    <img 
                      src={creditcard} 
                      alt="Razorpay" 
                      className="img-fluid mb-3" 
                      style={{ maxWidth: '200px' }}
                    />
                    <p className="mb-3">Secure payment powered by Razorpay</p>
                    <Button 
                      variant="success" 
                      size="lg"
                      onClick={createRazorpayOrder}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Pay with Razorpay'}
                    </Button>
                  </div>
                )}

                {/* Card Payment Form */}
                {paymentMethod === "card" && (
                  <Form onSubmit={processCardPayment}>
                    <div className="mb-3">
                      <Form.Label>Name on Card</Form.Label>
                      <Form.Control
                        type="text"
                        name="nameOnCard"
                        value={paymentRequest.nameOnCard}
                        onChange={handleInputChange}
                        placeholder="Enter name as it appears on card"
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <Form.Label>Card Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="cardNo"
                        value={paymentRequest.cardNo}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        required
                      />
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <Form.Label>Expiry Date</Form.Label>
                        <Form.Control
                          type="text"
                          name="expiryDate"
                          value={paymentRequest.expiryDate}
                          onChange={handleExpiryDateChange}
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                        />
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <Form.Label>CVV</Form.Label>
                        <Form.Control
                          type="password"
                          name="cvv"
                          value={paymentRequest.cvv}
                          onChange={handleCvvChange}
                          placeholder="123"
                          maxLength="4"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="d-grid">
                      <Button 
                        variant="primary" 
                        type="submit"
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? 'Processing Payment...' : 'Pay Now'}
                      </Button>
                    </div>
                  </Form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show success message if payment exists */}
      {!loading && paymentExists && (
        <div className="text-center">
          <div className="alert alert-success">
            <h4>Payment Already Completed</h4>
            <p>This booking has already been paid for.</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/customer/bookings')}
            >
              View My Bookings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPayment;
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import axios from "axios";
import creditcard from "../images/credit-card.png";
import { ToastContainer, toast } from "react-toastify";

const RazorpayPayment = () => {
  const location = useLocation();
  var booking = location.state;

  const sessionCustomer = JSON.parse(sessionStorage.getItem("active-customer"));

  let navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const createRazorpayOrder = async () => {
    try {
      const jwtToken = sessionStorage.getItem("jwtToken");
      
      const orderRequest = {
        bookingId: booking.bookingId || booking.id,
        amount: Math.round(booking.totalPrice * 100).toString(), // Convert to paise and string
        currency: "INR",
        orderId: `order_${booking.bookingId || booking.id}_${Date.now()}`,
        customerName: sessionCustomer.firstName + " " + sessionCustomer.lastName,
        customerEmail: sessionCustomer.email,
        customerPhone: sessionCustomer.phone || "9999999999",
        description: `Payment for booking #${booking.bookingId || booking.id}`
      };

      const response = await fetch("http://localhost:8080/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify(orderRequest),
      });

      const result = await response.json();
      
      if (result.id) {
        return result;
      } else {
        throw new Error(result.responseMessage || "Failed to create order");
      }
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      throw error;
    }
  };

  const verifyRazorpayPayment = async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    try {
      const jwtToken = sessionStorage.getItem("jwtToken");
      
      const verificationRequest = {
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        amount: Math.round(booking.totalPrice * 100).toString(), // Convert to paise
        currency: "INR",
        bookingId: booking.bookingId || booking.id  // Use bookingId instead of id
      };

      const response = await fetch("http://localhost:8080/api/payment/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify(verificationRequest),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      return false;
    }
  };

  const initiateRazorpayPayment = async () => {
    setLoading(true);

    try {
      // Create order
      const order = await createRazorpayOrder();

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_6N3gRgK9B1lmko", // Use environment variable or fallback to test key
        amount: order.amount,
        currency: order.currency,
        name: "Car Rental System",
        description: `Booking payment for booking ID: ${booking.bookingId || booking.id}`,  // Use bookingId instead of id
        order_id: order.id,
        handler: function (response) {
          // Handle successful payment
          handlePaymentSuccess(response);
        },
        prefill: {
          name: sessionCustomer.firstName + " " + sessionCustomer.lastName,
          email: sessionCustomer.email,
          contact: sessionCustomer.phone || "9999999999"
        },
        notes: {
          "booking_id": booking.bookingId || booking.id  // Use bookingId instead of id
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment. Please try again.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      const isVerified = await verifyRazorpayPayment(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature,
        booking.totalPrice
      );

      if (isVerified) {
        toast.success("Payment successful! Booking confirmed.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        setTimeout(() => {
          navigate("/customer/bookings");
        }, 2000);
      } else {
        toast.error("Payment verification failed!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Payment verification failed!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  useEffect(() => {
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
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    };
    
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-center ms-5 mt-1 me-5 mb-3">
        <div
          className="card form-card rounded-card h-100 custom-bg"
          style={{
            maxWidth: "900px",
          }}
        >
          <div className="card-body header-logo-color">
            <h4 className="card-title text-color text-center">
              Razorpay Payment Gateway
            </h4>

            <div className="row mt-4">
              <div className="col-sm-1 mt-2"></div>
              <div className="col-sm-4 mt-2">
                <img
                  src={creditcard}
                  className="card-img-top rounded img-fluid"
                  alt="img"
                  style={{
                    maxWidth: "500px",
                  }}
                />
              </div>
              <div className="col-sm-4 mt-2">
                <div className="text-color">
                  <h5>Booking Details</h5>
                  <p><strong>Booking ID:</strong> {booking.bookingId || booking.id}</p>
                  <p><strong>Total Amount:</strong> ₹{booking.totalPrice}</p>
                  <p><strong>Customer:</strong> {sessionCustomer.firstName} {sessionCustomer.lastName}</p>
                  
                  <div className="mt-4">
                    <h6>Payment Methods Available:</h6>
                    <ul>
                      <li>Credit/Debit Cards</li>
                      <li>Net Banking</li>
                      <li>UPI</li>
                      <li>Wallets</li>
                      <li>EMI</li>
                    </ul>
                  </div>

                  <button
                    onClick={initiateRazorpayPayment}
                    className="btn bg-color custom-bg-text ms-2 w-100"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : `Pay ₹${booking.totalPrice} with Razorpay`}
                  </button>
                  
                  <div className="mt-3">
                    <small className="text-muted">
                      You will be redirected to Razorpay's secure payment gateway
                    </small>
                  </div>
                </div>
                <ToastContainer />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPayment; 
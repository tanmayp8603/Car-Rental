import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import React from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";

const MyBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const customer_jwtToken = sessionStorage.getItem("customer-jwtToken");

  const user = useMemo(() => {
    const raw = sessionStorage.getItem("active-customer");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);
  let navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    if (!user || !user.id || !customer_jwtToken) {
      toast.error("Please login to view your bookings", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      navigate("/");
      return;
    }
  }, [user, customer_jwtToken, navigate]);

  const retrieveAllBookings = async () => {
    if (!user || !user.id) {
      return null;
    }
    
    try {
      const response = await axios.get(
        "http://localhost:8080/api/booking/fetch/customer-wise?customerId=" +
          user.id
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return null;
    }
  };

  // Function to check if a booking has a payment
  const checkBookingPaymentStatus = async (bookingId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/payment/check/${bookingId}`
      );
      return response.data.exists;
    } catch (error) {
      console.error("Error checking payment status:", error);
      return false;
    }
  };

  // Function to fetch payment status for all bookings
  const fetchPaymentStatusForBookings = async (bookings) => {
    const updatedBookings = [];
    for (const booking of bookings) {
      const hasPayment = await checkBookingPaymentStatus(booking.bookingId || booking.id);
      updatedBookings.push({
        ...booking,
        hasPayment: hasPayment
      });
    }
    return updatedBookings;
  };

  useEffect(() => {
    const getAllBooking = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const res = await retrieveAllBookings();
      if (res && res.bookings) {
        // Fetch payment status for each booking
        const bookingsWithPaymentStatus = await fetchPaymentStatusForBookings(res.bookings);
        setBookings(bookingsWithPaymentStatus);
      }
      setLoading(false);
    };

    getAllBooking();
  }, [user]);

  const formatDateFromEpoch = (epochTime) => {
    const date = new Date(Number(epochTime));
    const formattedDate = date.toLocaleString(); 

    return formattedDate;
  };

  const cancelBooking = (e, bookingId) => {
    console.log(bookingId);
    if (!bookingId) {
      toast.error("Missing Input", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else {
      let data = {
        status: "Cancel",
        bookingId: bookingId,
      };

      fetch("http://localhost:8080/api/booking/cancel", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        
        },
        body: JSON.stringify(data),
      })
        .then((result) => {
          result.json().then((res) => {
            if (res.success) {
              toast.success(res.responseMessage, {
                position: "top-center",
                autoClose: 1000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
              });

              setTimeout(() => {
                window.location.reload(true);
              }, 1000); 
            } else if (!res.success) {
              toast.error(res.responseMessage, {
                position: "top-center",
                autoClose: 1000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
              });
              setTimeout(() => {
                window.location.reload(true);
              }, 1000); 
            }
          });
        })
        .catch((error) => {
          console.error(error);
          toast.error("It seems server is down", {
            position: "top-center",
            autoClose: 1000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          setTimeout(() => {
            window.location.reload(true);
          }, 1000); 
        });
    }
  };

  const viewCustomerBookingDetail = (booking) => {
    navigate("/customer/vehicle/booking/details", { state: booking });
  };

  const payAndConfirm = (booking) => {
    navigate("/customer/booking/payment", { state: booking });
  };

  // Function to get payment status based on booking status
  const getPaymentStatus = (booking) => {
    // If booking status is Paid & Confirmed or CONFIRMED, show Paid
    if (booking.status === "Paid & Confirmed" || booking.status === "CONFIRMED") {
      return "Paid";
    }
    // If booking status is Rejected, show Rejected
    else if (booking.status === "Rejected") {
      return "Rejected";
    }
    // If booking status is Deactivated, show Not Paid
    else if (booking.status === "Deactivated" || booking.status === "Cancel") {
      return "Not Paid";
    }
    // For all other statuses, show Pending
    else {
      return "Pending";
    }
  };

  // Function to get payment status color based on booking status
  const getPaymentStatusColor = (booking) => {
    // If booking status is Paid & Confirmed or CONFIRMED, show green
    if (booking.status === "Paid & Confirmed" || booking.status === "CONFIRMED") {
      return "text-success";
    }
    // If booking status is Rejected or Deactivated, show red
    else if (booking.status === "Rejected" || booking.status === "Deactivated" || booking.status === "Cancel") {
      return "text-danger";
    }
    // For all other statuses, show yellow
    else {
      return "text-warning";
    }
  };

  return (
    <div className="mt-3">
      <ToastContainer />
      <div
        className="card form-card ms-2 me-2 mb-5 custom-bg"
        style={{
          height: "45rem",
        }}
      >
        <div
          className="card-header custom-bg-text text-center bg-color"
          style={{
            borderRadius: "1em",
            height: "50px",
          }}
        >
          <h2>All Bookings</h2>
        </div>
        <div
          className="card-body"
          style={{
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div className="text-center mt-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : bookings.length <= 0 ? (
            <h4 className="text-center p-5 mt-5">No Bookings Available</h4>
          ) : (
            <div className="table-responsive">
              <table className="table text-color text-center">
                <thead className="table-bordered border-color bg-color custom-bg-text">
                  <tr>
                    <th scope="col">Variant</th>
                    <th scope="col">Name</th>
                    <th scope="col">Booking Id</th>
                    <th scope="col">Total Day</th>
                    <th scope="col">Price</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Booking Time</th>
                    <th scope="col">From</th>
                    <th scope="col">To</th>
                    <th scope="col">Status</th>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Payment Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody className="header-logo-color">
                  {bookings && Array.isArray(bookings) && bookings.map((booking, index) => (
                    <tr key={index}>
                      <td>
                        <img
                          src={
                            "http://localhost:8080/api/variant/" +
                            booking.variant.image
                          }
                          className="img-fluid"
                          alt="car_pic"
                          style={{
                            maxWidth: "90px",
                          }}
                        />
                      </td>
                      <td>
                        <b>{booking.variant.name}</b>
                      </td>
                      <td>
                        <b>{booking.bookingId}</b>
                      </td>
                      <td>
                        <b>{booking.totalDay}</b>
                      </td>
                      <td>
                        <b>&#8377;{booking.totalPrice}</b>
                      </td>
                      <td>
                        <b>
                          {booking.customer.firstName +
                            " " +
                            booking.customer.lastName}
                        </b>
                      </td>
                      <td>
                        <b>{formatDateFromEpoch(booking.bookingTime)}</b>
                      </td>
                      <td>
                        <b>{booking.startDate}</b>
                      </td>
                      <td>
                        <b>{booking.endDate}</b>
                      </td>
                      <td>
                        <b
                          className={
                            booking.status === "Pending"
                              ? "text-warning"
                              : booking.status === "Approved"
                              ? "text-success"
                              : booking.status === "Rejected"
                              ? "text-danger"
                              : booking.status === "Cancel"
                              ? "text-danger"
                              : "text-primary"
                          }
                        >
                          {booking.status}
                        </b>
                      </td>
                      <td>
                        <b>
                          {booking.vehicle
                            ? booking.vehicle.registrationNumber
                            : "NA"}
                        </b>
                      </td>
                      <td>
                        <b className={getPaymentStatusColor(booking)}>
                          {getPaymentStatus(booking)}
                        </b>
                      </td>
                      <td>
                        <button
                          onClick={() => viewCustomerBookingDetail(booking)}
                          className="btn btn-sm bg-color custom-bg-text"
                        >
                          <b>View</b>
                        </button>
                        {booking.status === "Pending" && (
                          <button
                            onClick={(e) => cancelBooking(e, booking.bookingId)}
                            className="btn btn-sm btn-danger ms-2"
                          >
                            <b>Cancel</b>
                          </button>
                        )}
                        {booking.status === "Approved" && !booking.hasPayment && (
                          <button
                            onClick={(e) => payAndConfirm(booking)}
                            className="btn btn-sm btn-success ms-2"
                          >
                            <b>Pay Now</b>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBooking;
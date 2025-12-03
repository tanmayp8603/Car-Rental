import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const HeaderCustomer = () => {
  let navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("active-customer"));

  const userLogout = () => {
    toast.success("Logged out successfully!", {
      position: "top-center",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    
    // Remove session storage items
    sessionStorage.removeItem("active-customer");
    sessionStorage.removeItem("customer-jwtToken");
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new Event('storage'));
    
    // Navigate to home page
    setTimeout(() => {
      navigate("/");
    }, 1500);
  };

  const viewProfile = () => {
    navigate("/user/profile/detail", { state: user });
  };

  return (
    <ul className="navbar-nav ms-auto mb-2 mb-lg-0 me-5">
      <li className="nav-item">
        <Link
          to="/customer/bookings"
          className="nav-link active"
          aria-current="page"
        >
          <b className="text-color">My Bookings</b>
        </Link>
      </li>

      <li className="nav-item">
        <div className="nav-link active" aria-current="page">
          <b className="text-color" onClick={viewProfile}>
            My Profile
          </b>
          <ToastContainer />
        </div>
      </li>

      <li className="nav-item">
        <Link
          to=""
          className="nav-link active"
          aria-current="page"
          onClick={userLogout}
        >
          <b className="text-color">Logout</b>
        </Link>
        <ToastContainer />
      </li>
    </ul>
  );
};

export default HeaderCustomer;
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminHeader = () => {
  let navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("active-admin"));
  console.log(user);

  const adminLogout = () => {
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
    sessionStorage.removeItem("active-admin");
    sessionStorage.removeItem("admin-jwtToken");
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new Event('storage'));
    
    // Navigate to home page
    setTimeout(() => {
      navigate("/");
    }, 1500);
  };
  
  return (
    <ul className="navbar-nav ms-auto mb-2 mb-lg-0 me-5">
      <li className="nav-item">
        <Link
          to="/user/admin/register"
          className="nav-link active"
          aria-current="page"
        >
          <b className="text-color">Register Admin</b>
        </Link>
      </li>
      <li className="nav-item">
        <Link
          to="/admin/company/add"
          className="nav-link active"
          aria-current="page"
        >
          <b className="text-color">Add Company</b>
        </Link>
      </li>
      <li className="nav-item">
        <Link
          to="/admin/variant/add"
          className="nav-link active"
          aria-current="page"
        >
          <b className="text-color">Add Variant</b>
        </Link>
      </li>
      <li className="nav-item">
        <Link
          to="/admin/variant/all"
          className="nav-link active"
          aria-current="page"
        >
          <b className="text-color"> Variants</b>
        </Link>
      </li>

      <li className="nav-item">
        <Link
          to="/admin/customer/bookings"
          className="nav-link active"
          aria-current="page"
        >
          <b className="text-color"> Bookings</b>
        </Link>
      </li>
      <li className="nav-item">
        <Link
          to="/admin/customer/all"
          className="nav-link active"
          aria-current="page"
        >
          <b className="text-color"> Customers</b>
        </Link>
      </li>
      <li className="nav-item">
        <Link
          to=""
          className="nav-link active"
          aria-current="page"
          onClick={adminLogout}
        >
          <b className="text-color">Logout</b>
        </Link>
        <ToastContainer />
      </li>
    </ul>
  );
};

export default AdminHeader;
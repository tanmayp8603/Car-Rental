import AdminHeader from "./AdminHeader";
import HeaderCustomer from "./HeaderCustomer";
import NormalHeader from "./NormalHeader";
import { useState, useEffect } from "react";

const RoleNav = () => {
  const [userState, setUserState] = useState({
    customer: JSON.parse(sessionStorage.getItem("active-customer")),
    admin: JSON.parse(sessionStorage.getItem("active-admin"))
  });

  // Listen for storage changes to update navigation when user logs in/out
  useEffect(() => {
    const handleStorageChange = () => {
      setUserState({
        customer: JSON.parse(sessionStorage.getItem("active-customer")),
        admin: JSON.parse(sessionStorage.getItem("active-admin"))
      });
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (userState.admin != null) {
    return <AdminHeader />;
  } else if (userState.customer != null) {
    return <HeaderCustomer />;
  } else {
    return <NormalHeader />;
  }
};

export default RoleNav;
// Authentication utility functions

export const isUserLoggedIn = () => {
  const user = JSON.parse(sessionStorage.getItem("active-customer"));
  return user && user.id;
};

export const getCurrentUser = () => {
  const user = JSON.parse(sessionStorage.getItem("active-customer"));
  return user;
};

export const isAdminLoggedIn = () => {
  const adminToken = sessionStorage.getItem("admin-jwtToken");
  return adminToken && adminToken.length > 0;
};

export const logout = () => {
  sessionStorage.removeItem("active-customer");
  sessionStorage.removeItem("customer-jwtToken");
  sessionStorage.removeItem("admin-jwtToken");
  sessionStorage.removeItem("admin");
};

export const requireAuth = (navigate, redirectTo = "/customer/login") => {
  if (!isUserLoggedIn()) {
    return false;
  }
  return true;
};

export const requireAdminAuth = (navigate, redirectTo = "/admin/login") => {
  if (!isAdminLoggedIn()) {
    return false;
  }
  return true;
};
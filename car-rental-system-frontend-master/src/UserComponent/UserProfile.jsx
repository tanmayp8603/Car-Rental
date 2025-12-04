import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const UserProfile = () => {
  const location = useLocation();
  var customer = location.state;

  const sessionCustomer = JSON.parse(sessionStorage.getItem("active-customer"));

  const [user, setUser] = useState(customer);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLicense, setIsEditingLicense] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [editedLicense, setEditedLicense] = useState({});
  const [selectedLicenseImage, setSelectedLicenseImage] = useState(null);

  let navigate = useNavigate();

  const addDrivingLicense = (booking) => {
    navigate("/customer/driving-license/add");
  };

  const retrieveUser = async () => {
    const response = await axios.get(
      "http://localhost:8080/api/user/fetch/user-id?userId=" + customer.id
    );
    return response.data;
  };

  useEffect(() => {
    const getUser = async () => {
      const res = await retrieveUser();
      if (res) {
        setUser(res.users[0]);
        setEditedUser({
          userId: res.users[0].id,
          firstName: res.users[0].firstName,
          lastName: res.users[0].lastName,
          emailId: res.users[0].emailId,
          phoneNo: res.users[0].phoneNo,
          street: res.users[0].address?.street || "",
          city: res.users[0].address?.city || "",
          pincode: res.users[0].address?.pincode || ""
        });
        if (res.users[0].license) {
          setEditedLicense({
            customerId: res.users[0].id,
            licenseNumber: res.users[0].license.licenseNumber,
            expirationDate: res.users[0].license.expirationDate
          });
        }
      }
    };

    getUser();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset edited user to current user values
    setEditedUser({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      phoneNo: user.phoneNo,
      street: user.address?.street || "",
      city: user.address?.city || "",
      pincode: user.address?.pincode || ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser({
      ...editedUser,
      [name]: value
    });
  };

  const handleLicenseInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLicense({
      ...editedLicense,
      [name]: value
    });
  };

  const handleLicenseImageChange = (e) => {
    setSelectedLicenseImage(e.target.files[0]);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.put(
        "http://localhost:8080/api/user/update",
        editedUser
      );
      
      if (response.data.success) {
        toast.success("User details updated successfully!");
        // Update the user state with new data
        setUser({
          ...user,
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          emailId: editedUser.emailId,
          phoneNo: editedUser.phoneNo,
          address: {
            ...user.address,
            street: editedUser.street,
            city: editedUser.city,
            pincode: editedUser.pincode
          }
        });
        setIsEditing(false);
      } else {
        toast.error(response.data.responseMessage || "Failed to update user details");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user details. Please try again.");
    }
  };

  const handleSaveLicenseChanges = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append("customerId", editedLicense.customerId);
      formData.append("licenseNumber", editedLicense.licenseNumber);
      formData.append("expirationDate", editedLicense.expirationDate);
      
      // Append the new license image if selected
      if (selectedLicenseImage) {
        formData.append("licensePic", selectedLicenseImage);
      }
      
      const response = await axios.put(
        "http://localhost:8080/api/user/update/driving-license",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Driving license updated successfully!");
        // Update the user state with new license data
        setUser({
          ...user,
          license: {
            ...user.license,
            licenseNumber: editedLicense.licenseNumber,
            expirationDate: editedLicense.expirationDate
          }
        });
        
        // Reset the selected image
        setSelectedLicenseImage(null);
        setIsEditingLicense(false);
      } else {
        toast.error(response.data.responseMessage || "Failed to update driving license");
      }
    } catch (error) {
      console.error("Error updating license:", error);
      toast.error("Failed to update driving license. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        const response = await axios.delete(
          `http://localhost:8080/api/user/delete/user-id?userId=${user.id}`
        );
        
        if (response.data.success) {
          toast.success("Account deleted successfully!");
          // Clear session storage and redirect to home
          sessionStorage.removeItem("active-customer");
          sessionStorage.removeItem("customer-jwtToken");
          navigate("/");
        } else {
          toast.error(response.data.responseMessage || "Failed to delete account");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        toast.error("Failed to delete account. Please try again.");
      }
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-center ms-5 mt-1 me-5 mb-3">
        <div
          className="card form-card rounded-card h-100 custom-bg"
          style={{
            width: "900px",
          }}
        >
          <div className="card-body header-logo-color">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="card-title text-color text-center mb-0">
                Personal Detail
              </h4>
              {!isEditing && (
                <button 
                  className="btn btn-sm bg-color custom-bg-text"
                  onClick={handleEditClick}
                >
                  <b>Edit Profile</b>
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveChanges}>
                <div className="row mt-4">
                  <div className="col-md-6 mb-3">
                    <label className="form-label"><b>First Name:</b></label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstName"
                      value={editedUser.firstName || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label"><b>Last Name:</b></label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={editedUser.lastName || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="row mt-2">
                  <div className="col-md-6 mb-3">
                    <label className="form-label"><b>Email Id:</b></label>
                    <input
                      type="email"
                      className="form-control"
                      name="emailId"
                      value={editedUser.emailId || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label"><b>Contact:</b></label>
                    <input
                      type="text"
                      className="form-control"
                      name="phoneNo"
                      value={editedUser.phoneNo || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="row mt-2">
                  <div className="col-md-4 mb-3">
                    <label className="form-label"><b>Street:</b></label>
                    <input
                      type="text"
                      className="form-control"
                      name="street"
                      value={editedUser.street || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label"><b>City:</b></label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={editedUser.city || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label"><b>Pincode:</b></label>
                    <input
                      type="text"
                      className="form-control"
                      name="pincode"
                      value={editedUser.pincode || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="d-flex justify-content-center mt-4">
                  <button 
                    type="submit" 
                    className="btn bg-color custom-bg-text me-2"
                  >
                    <b>Save Changes</b>
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary me-2"
                    onClick={handleCancelEdit}
                  >
                    <b>Cancel</b>
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDeleteAccount}
                  >
                    <b>Delete Account</b>
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="row mt-4">
                  <div className="col-md-4">
                    <p className="mb-2">
                      <b className="text-color">First Name:</b> {user.firstName}
                    </p>
                  </div>
                  <div className="col-md-4">
                    <p className="mb-2">
                      <b className="text-color">Last Name:</b> {user.lastName}
                    </p>
                  </div>
                  <div className="col-md-4">
                    <p className="mb-2">
                      <b className="text-color">Email Id:</b> {user.emailId}
                    </p>
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-md-4">
                    <p className="mb-2">
                      <b className="text-color">Contact:</b> {user.phoneNo}
                    </p>
                  </div>
                  <div className="col-md-8">
                    <p className="mb-2">
                      <b className="text-color">Address:</b>{" "}
                      {user.address?.street +
                        " " +
                        user.address?.city +
                        " " +
                        user.address?.pincode}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <h4 className="card-title text-color text-center mt-5">
              Driving License
            </h4>
            
            {isEditingLicense ? (
              <form onSubmit={handleSaveLicenseChanges}>
                <div className="row mt-4">
                  <div className="col-md-6 mb-3">
                    <label className="form-label"><b>License No:</b></label>
                    <input
                      type="text"
                      className="form-control"
                      name="licenseNumber"
                      value={editedLicense.licenseNumber || ""}
                      onChange={handleLicenseInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label"><b>License Expiry:</b></label>
                    <input
                      type="date"
                      className="form-control"
                      name="expirationDate"
                      value={editedLicense.expirationDate || ""}
                      onChange={handleLicenseInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="row mt-2">
                  <div className="col-md-6 mb-3">
                    <label className="form-label"><b>Upload New License Image:</b></label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleLicenseImageChange}
                    />
                  </div>
                </div>
                
                <div className="d-flex aligns-items-center justify-content-center mt-3">
                  {user.license && (
                    <img
                      src={
                        "http://localhost:8080/api/user/" +
                        user.license.licensePic
                      }
                      className="card-img-top rounded img-fluid"
                      alt="current license"
                      style={{
                        maxWidth: "350px",
                        display: "inline-block",
                      }}
                    />
                  )}
                </div>
                
                <div className="d-flex justify-content-center mt-4">
                  <button 
                    type="submit" 
                    className="btn bg-color custom-bg-text me-2"
                  >
                    <b>Save License</b>
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditingLicense(false);
                      setSelectedLicenseImage(null);
                    }}
                  >
                    <b>Cancel</b>
                  </button>
                </div>
              </form>
            ) : (
              (() => {
                if (user.license) {
                  return (
                    <div>
                      <div className="row mt-4">
                        <div className="col-md-4">
                          <p className="mb-2">
                            <b className="text-color">License No:</b>{" "}
                            {user.license.licenseNumber}
                          </p>
                        </div>
                        <div className="col-md-4">
                          <p className="mb-2">
                            <b className="text-color">License Expiry:</b>{" "}
                            {user.license.expirationDate}
                          </p>
                        </div>
                        <div className="col-md-4">
                          <button 
                            className="btn btn-sm bg-color custom-bg-text"
                            onClick={() => setIsEditingLicense(true)}
                          >
                            <b>Edit License</b>
                          </button>
                        </div>

                        <div className="d-flex aligns-items-center justify-content-center mt-3">
                          <img
                            src={
                              "http://localhost:8080/api/user/" +
                              user.license.licensePic
                            }
                            className="card-img-top rounded img-fluid"
                            alt="license img"
                            style={{
                              maxWidth: "350px",
                              display: "inline-block",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                } else if (
                  sessionCustomer &&
                  sessionCustomer.role === "Customer"
                ) {
                  return (
                    <div className="d-flex aligns-items-center justify-content-center">
                      <button
                        onClick={(e) => addDrivingLicense()}
                        className="btn btn-md bg-color custom-bg-text mt-4 "
                      >
                        <b>Add License</b>
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div className="text-center header-logo-color mt-4">
                      <h5>Not Uploaded</h5>
                    </div>
                  );
                }
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
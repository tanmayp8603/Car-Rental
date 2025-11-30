import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AddDrivingLicense = () => {
  const user = JSON.parse(sessionStorage.getItem("active-customer"));
  let navigate = useNavigate();
  const [selectedImage, setSelectImage] = useState(null);

  const [addLicenseRequest, setAddLicenseRequest] = useState({
    customerId: user.id,
    licenseNumber: "",
    expirationDate: "",
  });

  const handleInput = (e) => {
    setAddLicenseRequest({
      ...addLicenseRequest,
      [e.target.name]: e.target.value,
    });
  };

  const saveLicense = (e) => {
    e.preventDefault();
    if (addLicenseRequest === null) {
      toast.error("invalid input!!!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      return;
    }

    const formData = new FormData();
    formData.append("customerId", addLicenseRequest.customerId);
    formData.append("licenseNumber", addLicenseRequest.licenseNumber);
    formData.append("expirationDate", addLicenseRequest.expirationDate);
    formData.append("licensePic", selectedImage);

    axios
      .post(
        "http://localhost:8080/api/user/add/driving-licence",
        formData
        
      )
      .then((resp) => {
        let response = resp.data;

        if (response.success) {
          toast.success(response.responseMessage, {
            position: "top-center",
            autoClose: 1000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });

          setTimeout(() => {
            navigate("/home");
          }, 2000); 
        } else if (!response.success) {
          toast.error(response.responseMessage, {
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
          }, 2000);
        } else {
          toast.error("It Seems Server is down!!!", {
            position: "top-center",
            autoClose: 1000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
         
        }
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
        
      });
  };

  return (
    <div>
      <div className="mt-2 d-flex aligns-items-center justify-content-center mb-4">
        <div className="card form-card custom-bg" style={{ width: "60rem" }}>
          <div className="container-fluid">
            <div
              className="card-header bg-color custom-bg-text mt-2 text-center"
              style={{
                borderRadius: "1em",
                height: "45px",
              }}
            >
              <h5 className="card-title">Add Driving License</h5>
            </div>
            <div className="card-body text-color">
              <form className="row g-3">
                <div className="col-md-6 mb-3">
                  <label htmlFor="title" className="form-label">
                    <b>License Number</b>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="licenseNumber"
                    name="licenseNumber"
                    onChange={handleInput}
                    value={addLicenseRequest.licenseNumber}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="title" className="form-label">
                    <b>Expiry Date</b>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="expirationDate"
                    name="expirationDate"
                    onChange={handleInput}
                    value={addLicenseRequest.expirationDate}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="formFile" className="form-label">
                    <b> Select License Pic</b>
                  </label>
                  <input
                    className="form-control"
                    type="file"
                    id="image"
                    name="image"
                    onChange={(e) => setSelectImage(e.target.files[0])}
                    required
                  />
                </div>

                <div className="d-flex aligns-items-center justify-content-center mb-2">
                  <button
                    type="submit"
                    className="btn bg-color custom-bg-text"
                    onClick={saveLicense}
                  >
                    <b> Add License</b>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDrivingLicense;

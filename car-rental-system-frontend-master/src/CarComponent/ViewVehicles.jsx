import { useState, useEffect } from "react";
import axios from "axios";
import React from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

const ViewVehicles = () => {
  const location = useLocation();
  const variant = location.state;

  const [vehicles, setVehicles] = useState([]);

  const admin_jwtToken = sessionStorage.getItem("admin-jwtToken");

  let navigate = useNavigate();

  const [vehicleRequest, setVehicleRequest] = useState({
    variantId: variant.id,
    registrationNumber: "",
  });

  const handleUserInput = (e) => {
    setVehicleRequest({
      ...vehicleRequest,
      [e.target.name]: e.target.value,
    });
  };

  const retrieveVehiclesByVariant = async () => {
    const response = await axios.get(
      "http://localhost:8080/api/vehicle/fetch/variant-wise?variantId=" +
        variant.id
    );
    return response.data;
  };

  useEffect(() => {
    const getAllVariant = async () => {
      const res = await retrieveVehiclesByVariant();
      if (res) {
        setVehicles(res.vehicles);
      }
    };
    getAllVariant();
  }, []);

  const saveVehicle = (e) => {
    e.preventDefault();
    if (vehicleRequest.registrationNumber === "") {
      toast.error("Vehicle Registration Missing!!!", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else {
      fetch("http://localhost:8080/api/vehicle/add", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify(vehicleRequest),
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

  const deleteVehicle = (vehicleId, e) => {
    fetch("http://localhost:8080/api/vehicle/delete?vehicleId=" + vehicleId, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
       
      },
      body: JSON.stringify(vehicleRequest),
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
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-4 mt-2">
          <div className="card form-card custom-bg ">
            <img
              src={"http://localhost:8080/api/variant/" + variant.image}
              className="card-img-top rounded img-fluid"
              alt="variant img"
            />
          </div>
        </div>
        <div className="col-sm-4 mt-2">
          <div className="card form-card custom-bg shadow-lg">
            <div
              className="card-header bg-color custom-bg-text "
              style={{
                borderRadius: "1em",
                height: "50px",
              }}
            >
              <h3 className="card-title ">{variant.name}</h3>
            </div>

            <div className="card-body text-left text-color">
              <div className="text-left mt-3">
                <h4>
                  Company :{" "}
                  <span className="header-logo-color">
                    {variant.company.name}
                  </span>
                </h4>
                <h4>
                  Fuel Type :{" "}
                  <span className="header-logo-color">{variant.fuelType}</span>
                </h4>
                <h4>
                  Price per day :{" "}
                  <span className="header-logo-color">
                    &#8377;{variant.pricePerDay}
                  </span>
                </h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-4 mt-2">
          <div className="form-card">
            <div className="container-fluid">
              <div
                className="card-header bg-color custom-bg-text mt-2 d-flex justify-content-center align-items-center"
                style={{
                  borderRadius: "1em",
                  height: "38px",
                }}
              >
                <h4 className="card-title">Add Vehicle</h4>
              </div>
              <div className="card-body mt-3">
                <form className="text-color">
                  <div className="mb-3">
                    <label for="name" className="form-label">
                      <b>Registration Number</b>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrationNumber"
                      name="registrationNumber"
                      onChange={handleUserInput}
                      value={vehicleRequest.registrationNumber}
                      required
                    />
                  </div>

                  <div className="d-flex aligns-items-center justify-content-center mb-2">
                    <button
                      type="submit"
                      className="btn bg-color custom-bg-text"
                      onClick={saveVehicle}
                    >
                      <b> Add Vehicle</b>
                    </button>
                    <ToastContainer />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="card form-card mb-5 custom-bg mt-5"
        style={{
          height: "25rem",
        }}
      >
        <div
          className="card-header custom-bg-text text-center bg-color"
          style={{
            borderRadius: "1em",
            height: "50px",
          }}
        >
          <h2>All Variants</h2>
        </div>
        <div
          className="card-body"
          style={{
            overflowY: "auto",
          }}
        >
          <div className="table-responsive">
            <table className="table table-hover text-color text-center">
              <thead className="table-bordered border-color bg-color custom-bg-text">
                <tr>
                  <th scope="col">Vehicle Id</th>
                  <th scope="col">Vehicle Registration No.</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody className="header-logo-color">
                {vehicles.map((vehicle) => {
                  return (
                    <tr>
                      <td>
                        <b>{vehicle.id}</b>
                      </td>
                      <td>
                        <b>{vehicle.registrationNumber}</b>
                      </td>
                      <td>
                        <b>{vehicle.status}</b>
                      </td>

                      <td>
                        <button
                          onClick={() => deleteVehicle(vehicle.id)}
                          className="btn btn-sm bg-color custom-bg-text"
                        >
                          <b>Delete</b>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewVehicles;

import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <div>
      <div className="container my-5">
        <footer className="text-center text-lg-start">
          <div className="container-fluid p-4 pb-0">
            <section className="">
              <div className="row">
                <div className="col-lg-4 col-md-6 mb-4 mb-md-0">
                  <h4 className="text-uppercase text-color">
                    <i>Car Rental System</i>
                  </h4>

                  <p className="header-logo-color">
                    Welcome to our world of boundless exploration. Embrace the
                    freedom to wander, discover, and make unforgettable
                    memories. Let's embark on this journey together. Welcome to
                    our community!
                  </p>
                </div>

                <div className="col-lg-2 col-md-6 mb-4 mb-md-0">
                  <h5 className="text-uppercase text-color-second">About us</h5>

                  <ul className="list-unstyled mb-0">
                    <li>
                      <a href="/AboutUs" className="text-color">
                        About Us
                      </a>
                    </li>
                    <li>
                      <a href="/ContactUs" className="text-color">
                        Contact Us
                      </a>
                    </li>
                    
                  </ul>
                </div>

              
                
              </div>
            </section>

            <hr className="mb-4" />

            <hr className="mb-4" />
          </div>

          <div className="text-center text-color">
            Project Created by:
            <a className="text-color-3" href="">
              tanmaypatil8336@gmail.com
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Footer;
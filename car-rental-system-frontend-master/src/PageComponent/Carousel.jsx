import carousel1 from "../images/carousel_1.png";

const Carousel = () => {
  return (
    <div
      id="carouselExampleCaptions"
      className="carousel slide"
      data-bs-ride="carousel"
      data-bs-interval="5000"
    >
      <div className="carousel-indicators">
        <button
          type="button"
          data-bs-target="#carouselExampleCaptions"
          data-bs-slide-to="0"
          className="active"
          aria-current="true"
          aria-label="Slide 1"
        ></button>
        <button
          type="button"
          data-bs-target="#carouselExampleCaptions"
          data-bs-slide-to="1"
          aria-label="Slide 2"
        ></button>
        <button
          type="button"
          data-bs-target="#carouselExampleCaptions"
          data-bs-slide-to="2"
          aria-label="Slide 3"
        ></button>
      </div>
      <div className="carousel-inner">
        <div className="carousel-item active">
          <img src={carousel1} className="d-block w-100" alt="Luxury Car Rentals" style={{ height: "500px", objectFit: "cover" }} />
          <div className="carousel-caption d-none d-md-block">
            <h5>Luxury Car Rentals</h5>
            <p>Experience premium vehicles for your special occasions</p>
          </div>
        </div>
        <div className="carousel-item">
          <img 
            src="https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" 
            className="d-block w-100" 
            alt="Premium Sedan" 
            style={{ height: "500px", objectFit: "cover" }} 
          />
          <div className="carousel-caption d-none d-md-block">
            <h5>Premium Sedan Collection</h5>
            <p>Elegant and comfortable vehicles for business and leisure</p>
          </div>
        </div>
        <div className="carousel-item">
          <img 
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" 
            className="d-block w-100" 
            alt="Sports Cars" 
            style={{ height: "500px", objectFit: "cover" }} 
          />
          <div className="carousel-caption d-none d-md-block">
            <h5>Sports & Performance Cars</h5>
            <p>Thrilling rides for adventure seekers</p>
          </div>
        </div>
      </div>
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExampleCaptions"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExampleCaptions"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
};

export default Carousel;
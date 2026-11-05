import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { carAPI } from '../services/api';
import './CarList.css';

const CarList = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await carAPI.getAll();
      setCars(response.data.data);
    } catch (err) {
      setError('Failed to load cars');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    window.location.href = 'tel:+919876543210';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/919876543210', '_blank');
  };

  return (
    <div className="car-list-page">
      {/* Header */}
      <header className="page-header">
        <Link to="/" className="back-button">
          ← Back
        </Link>
        <h1 className="page-title">Choose your car</h1>
      </header>

      {/* Cars Grid */}
      <section className="cars-section">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading cars...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p className="error-message">{error}</p>
            <p className="error-submessage">We're having trouble loading the cars. Please try again.</p>
            <button onClick={fetchCars} className="retry-button">
              🔄 Try Again
            </button>
          </div>
        ) : cars.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon">🚗</div>
            <p className="empty-message">No cars available at the moment</p>
            <p className="empty-submessage">We're updating our fleet. Please check back soon or contact us directly.</p>
            <div className="empty-actions">
              <Link to="/contact" className="contact-link-button">
                📞 Contact Us
              </Link>
              <button onClick={fetchCars} className="refresh-button">
                🔄 Refresh
              </button>
            </div>
          </div>
        ) : (
          <div className="cars-grid">
            {cars.map((car) => (
              <Link to={`/cars/${car._id}`} key={car._id} className="car-card">
                <div className="car-image-container">
                  {car.photo ? (
                    <img src={car.photo} alt={car.name} className="car-image" />
                  ) : (
                    <div className="car-image-placeholder">
                      <span className="car-icon">🚗</span>
                    </div>
                  )}
                </div>
                <div className="car-details">
                  <h3 className="car-name">{car.name}</h3>
                  <div className="car-info-row">
                    <span className="car-seats">
                      <span className="icon">👥</span> {car.seats} Seats
                    </span>
                    <span className="car-rate">₹{car.ratePerKm}/km</span>
                  </div>
                  <button className="view-details-button">
                    View Details & Book
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Floating Action Buttons */}
      <div className="floating-actions">
        <button onClick={handleWhatsApp} className="floating-button whatsapp-fab" aria-label="WhatsApp">
          💬
        </button>
        <button onClick={handleCall} className="floating-button call-fab" aria-label="Call">
          📞
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <Link to="/" className="nav-item">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </Link>
        <Link to="/cars" className="nav-item active">
          <span className="nav-icon">🚗</span>
          <span className="nav-label">Cars</span>
        </Link>
        <Link to="/contact" className="nav-item">
          <span className="nav-icon">📞</span>
          <span className="nav-label">Contact</span>
        </Link>
      </nav>
    </div>
  );
};

export default CarList;

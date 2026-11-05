import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { carAPI } from '../services/api';
import heroImg from '../assets/hero.png';
import './Home.css';

const Home = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await carAPI.getAll();
      // Show only first 3 cars on home page
      setCars(response.data.data.slice(0, 3));
    } catch (err) {
      setError('Failed to load cars');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    window.location.href = 'tel:+919876543210'; // Replace with actual phone number
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/919876543210', '_blank'); // Replace with actual WhatsApp number
  };

  return (
    <div className="home">
      {/* Splash/Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <img src={heroImg} alt="Urvi Tours" className="hero-logo" />
          <h1 className="brand-name">Urvi Tours & Travels</h1>
          <p className="tagline">Your Journey, Our Commitment</p>
          <Link to="/cars" className="cta-button">
            Book your cab in one tap
          </Link>
          <button onClick={handleCall} className="cta-link">
            Inquire now
          </button>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="our-cars-section">
        <h2>Our Cars</h2>
        <div className="cars-grid">
          {loading ? (
            <p className="loading-text">Loading cars...</p>
          ) : error ? (
            <div className="error-state">
              <p className="error-text">⚠️ {error}</p>
              <button onClick={fetchCars} className="retry-small-button">
                Try Again
              </button>
            </div>
          ) : cars.length === 0 ? (
            <p className="no-cars-text">No cars available at the moment</p>
          ) : (
            cars.map((car) => (
              <Link to={`/cars/${car._id}`} key={car._id} className="car-card">
                <div className="car-image-container">
                  {car.photo ? (
                    <img src={car.photo} alt={car.name} className="car-image" />
                  ) : (
                    <div className="car-image-placeholder">
                      <span>🚗</span>
                    </div>
                  )}
                </div>
                <div className="car-info">
                  <h3 className="car-name">{car.name}</h3>
                  <p className="car-seats">{car.seats} Seats</p>
                  <p className="car-rate">₹{car.ratePerKm}/km</p>
                </div>
              </Link>
            ))
          )}
        </div>
        {!loading && cars.length > 0 && (
          <Link to="/cars" className="view-all-link">
            View All Cars →
          </Link>
        )}
      </section>

      {/* Contact Strip */}
      <section className="contact-strip">
        <h3>Need help?</h3>
        <div className="contact-buttons">
          <button onClick={handleCall} className="contact-button call-button">
            📞 Call us
          </button>
          <button onClick={handleWhatsApp} className="contact-button whatsapp-button">
            💬 WhatsApp us
          </button>
        </div>
      </section>

      {/* Floating Call/WhatsApp Button */}
      <div className="floating-actions">
        <button onClick={handleWhatsApp} className="floating-button whatsapp-fab">
          💬
        </button>
        <button onClick={handleCall} className="floating-button call-fab">
          📞
        </button>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">© 2026 Urvi Tours & Travels. All rights reserved.</p>
      </footer>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <Link to="/" className="nav-item active">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </Link>
        <Link to="/cars" className="nav-item">
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

export default Home;

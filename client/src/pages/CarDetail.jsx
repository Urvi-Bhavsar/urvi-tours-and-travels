import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { carAPI } from '../services/api';
import './CarDetail.css';

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState('');
  const [estimatedFare, setEstimatedFare] = useState(0);

  useEffect(() => {
    fetchCar();
  }, [id]);

  useEffect(() => {
    calculateFare();
  }, [distance, car]);

  const fetchCar = async () => {
    try {
      const response = await carAPI.getById(id);
      setCar(response.data.data);
    } catch (err) {
      setError('Failed to load car details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateFare = () => {
    if (car && distance && !isNaN(distance) && distance > 0) {
      const fare = parseFloat(distance) * car.ratePerKm;
      setEstimatedFare(fare);
    } else {
      setEstimatedFare(0);
    }
  };

  const handleDistanceChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDistance(value);
    }
  };

  const handleSendInquiry = () => {
    navigate(`/inquiry/${id}`, {
      state: {
        car,
        distance: distance || 0,
        estimatedFare: estimatedFare || 0,
      },
    });
  };

  const handleCall = () => {
    window.location.href = 'tel:+919876543210';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/919876543210', '_blank');
  };

  if (loading) {
    return (
      <div className="car-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="car-detail-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error || 'Car not found'}</p>
          <button onClick={() => navigate('/cars')} className="retry-button">
            ← Back to Cars
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="car-detail-page">
      {/* Modern Header with Gradient */}
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <span className="back-icon">←</span>
          <span>Back</span>
        </button>
        <h1 className="page-title">Car Details</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Car Image Section with Overlay */}
      <section className="car-image-section">
        <div className="image-container">
          {car.photo ? (
            <img src={car.photo} alt={car.name} className="car-detail-image" />
          ) : (
            <div className="car-detail-placeholder">
              <span className="car-icon">🚗</span>
            </div>
          )}
          <div className="image-overlay"></div>
        </div>
      </section>

      {/* Car Information Card */}
      <section className="car-info-section">
        <div className="info-card">
          <h2 className="car-name">{car.name}</h2>
          
          <div className="car-specs">
            <div className="spec-item">
              <div className="spec-icon-wrapper">
                <span className="spec-icon">👥</span>
              </div>
              <div className="spec-details">
                <span className="spec-label">Capacity</span>
                <span className="spec-value">{car.seats} Persons</span>
              </div>
            </div>
            
            <div className="spec-divider"></div>
            
            <div className="spec-item">
              <div className="spec-icon-wrapper">
                <span className="spec-icon">💰</span>
              </div>
              <div className="spec-details">
                <span className="spec-label">Rate</span>
                <span className="spec-value">₹{car.ratePerKm}/km</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fare Estimator with Modern Design */}
      <section className="fare-estimator-section">
        <h3 className="section-title">
          <span className="title-icon">🧮</span>
          Estimate Your Fare
        </h3>
        
        <div className="estimator-card">
          <div className="input-group">
            <label htmlFor="distance" className="input-label">
              Enter Distance (km)
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="distance"
                className="distance-input"
                placeholder="e.g., 100"
                value={distance}
                onChange={handleDistanceChange}
                inputMode="decimal"
              />
              <span className="input-suffix">km</span>
            </div>
          </div>

          {estimatedFare > 0 && (
            <div className="fare-result">
              <div className="fare-header">
                <span className="fare-label">Estimated Fare</span>
              </div>
              <div className="fare-amount">₹{estimatedFare.toFixed(2)}</div>
              <div className="fare-breakdown">
                <span>{distance} km × ₹{car.ratePerKm}</span>
              </div>
              <p className="fare-note">
                <span className="note-icon">ℹ️</span>
                Final price will be confirmed during the call
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Action Buttons */}
      <section className="actions-section">
        <button onClick={handleSendInquiry} className="primary-button">
          <span className="button-icon">📋</span>
          <span>Send Inquiry</span>
          <span className="button-arrow">→</span>
        </button>
        
        <div className="quick-actions">
          <button onClick={handleCall} className="quick-action-button call">
            <span className="action-icon">📞</span>
            <span>Call Now</span>
          </button>
          <button onClick={handleWhatsApp} className="quick-action-button whatsapp">
            <span className="action-icon">💬</span>
            <span>WhatsApp</span>
          </button>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="trust-section">
        <div className="trust-badge">
          <span className="badge-icon">✓</span>
          <span>Quick Response</span>
        </div>
        <div className="trust-badge">
          <span className="badge-icon">✓</span>
          <span>Best Rates</span>
        </div>
        <div className="trust-badge">
          <span className="badge-icon">✓</span>
          <span>24/7 Support</span>
        </div>
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

export default CarDetail;

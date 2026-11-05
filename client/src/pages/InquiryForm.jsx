import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { carAPI, inquiryAPI } from '../services/api';
import './InquiryForm.css';

const InquiryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledData = location.state || {};

  const [car, setCar] = useState(prefilledData.car || null);
  const [loading, setLoading] = useState(!prefilledData.car);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    pickupLocation: '',
    dropLocation: '',
    travelDate: '',
    passengers: '',
    note: '',
    estimatedDistance: prefilledData.distance || '',
    estimatedFare: prefilledData.estimatedFare || '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!car && id) {
      fetchCar();
    }
  }, [id]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Name is required';
    }

    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (formData.travelDate) {
      const selectedDate = new Date(formData.travelDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.travelDate = 'Travel date cannot be in the past';
      }
    }

    if (formData.passengers && (formData.passengers < 1 || formData.passengers > car.seats)) {
      errors.passengers = `Number of passengers must be between 1 and ${car.seats}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const inquiryData = {
        customerName: formData.customerName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        car: car._id,
        pickupLocation: formData.pickupLocation.trim(),
        dropLocation: formData.dropLocation.trim(),
        travelDate: formData.travelDate || undefined,
        passengers: formData.passengers ? parseInt(formData.passengers) : undefined,
        note: formData.note.trim(),
        estimatedDistance: formData.estimatedDistance ? parseFloat(formData.estimatedDistance) : undefined,
        estimatedFare: formData.estimatedFare ? parseFloat(formData.estimatedFare) : undefined,
      };

      const response = await inquiryAPI.create(inquiryData);

      // Navigate to thank you page
      navigate('/thank-you', {
        state: {
          message: response.data.message,
          customerName: formData.customerName,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="inquiry-form-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="inquiry-form-page">
        <div className="error-container">
          <p className="error-message">Car not found</p>
          <button onClick={() => navigate('/cars')} className="back-button-error">
            Back to Cars
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inquiry-form-page">
      {/* Header */}
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1 className="page-title">Your inquiry</h1>
      </header>

      {/* Selected Car Info */}
      <section className="selected-car-section">
        <div className="selected-car-card">
          <div className="car-mini-image">
            {car.photo ? (
              <img src={car.photo} alt={car.name} />
            ) : (
              <span className="car-icon">🚗</span>
            )}
          </div>
          <div className="car-mini-info">
            <h3>{car.name}</h3>
            <p>₹{car.ratePerKm}/km • {car.seats} Seats</p>
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <form onSubmit={handleSubmit} className="inquiry-form">
        <section className="form-section">
          <h2 className="section-title">Contact Information</h2>

          <div className="form-group">
            <label htmlFor="customerName" className="form-label">
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              className={`form-input ${formErrors.customerName ? 'error' : ''}`}
              placeholder="Enter your name"
              value={formData.customerName}
              onChange={handleInputChange}
              disabled={submitting}
            />
            {formErrors.customerName && (
              <span className="error-text">{formErrors.customerName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="mobileNumber" className="form-label">
              Mobile number <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              className={`form-input ${formErrors.mobileNumber ? 'error' : ''}`}
              placeholder="10-digit mobile number"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              maxLength={10}
              inputMode="numeric"
              disabled={submitting}
            />
            {formErrors.mobileNumber && (
              <span className="error-text">{formErrors.mobileNumber}</span>
            )}
          </div>
        </section>

        <section className="form-section">
          <h2 className="section-title">Trip Details</h2>

          <div className="form-group">
            <label htmlFor="pickupLocation" className="form-label">
              Pickup location
            </label>
            <input
              type="text"
              id="pickupLocation"
              name="pickupLocation"
              className="form-input"
              placeholder="Enter pickup location"
              value={formData.pickupLocation}
              onChange={handleInputChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dropLocation" className="form-label">
              Drop location
            </label>
            <input
              type="text"
              id="dropLocation"
              name="dropLocation"
              className="form-input"
              placeholder="Enter drop location"
              value={formData.dropLocation}
              onChange={handleInputChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="travelDate" className="form-label">
              Date and time
            </label>
            <input
              type="datetime-local"
              id="travelDate"
              name="travelDate"
              className={`form-input ${formErrors.travelDate ? 'error' : ''}`}
              value={formData.travelDate}
              onChange={handleInputChange}
              disabled={submitting}
            />
            {formErrors.travelDate && (
              <span className="error-text">{formErrors.travelDate}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="passengers" className="form-label">
              Number of passengers
            </label>
            <input
              type="number"
              id="passengers"
              name="passengers"
              className={`form-input ${formErrors.passengers ? 'error' : ''}`}
              placeholder={`Max ${car.seats} passengers`}
              value={formData.passengers}
              onChange={handleInputChange}
              min="1"
              max={car.seats}
              inputMode="numeric"
              disabled={submitting}
            />
            {formErrors.passengers && (
              <span className="error-text">{formErrors.passengers}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="note" className="form-label">
              Additional notes (optional)
            </label>
            <textarea
              id="note"
              name="note"
              className="form-textarea"
              placeholder="Any special requirements or notes..."
              value={formData.note}
              onChange={handleInputChange}
              rows="3"
              disabled={submitting}
            />
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        <section className="submit-section">
          <button
            type="submit"
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit inquiry'}
          </button>
          <p className="submit-note">
            We call you back soon to confirm your booking
          </p>
        </section>
      </form>

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

export default InquiryForm;

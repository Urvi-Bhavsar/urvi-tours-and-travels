import { Link } from 'react-router-dom';
import './Contact.css';

const Contact = () => {
  const handleCall = () => {
    window.location.href = 'tel:+919876543210';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/919876543210', '_blank');
  };

  const handleEmail = () => {
    window.location.href = 'mailto:info@urvitours.com';
  };

  const handleMapClick = () => {
    // Replace with actual Google Maps link
    window.open('https://maps.google.com/?q=Ahmedabad,Gujarat,India', '_blank');
  };

  return (
    <div className="contact-page">
      {/* Header */}
      <header className="page-header">
        <Link to="/" className="back-button">
          ← Back
        </Link>
        <h1 className="page-title">Contact us</h1>
      </header>

      {/* Hero Section */}
      <section className="contact-hero">
        <div className="hero-content">
          <h2>Get in touch</h2>
          <p>We're here to help with your travel needs</p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="contact-methods">
        <h2 className="section-title">Reach us via</h2>
        
        <div className="methods-grid">
          <button onClick={handleCall} className="method-card">
            <div className="method-icon call-icon">📞</div>
            <h3 className="method-title">Phone</h3>
            <p className="method-detail">+91 98765 43210</p>
            <span className="method-action">Call now</span>
          </button>

          <button onClick={handleWhatsApp} className="method-card">
            <div className="method-icon whatsapp-icon">💬</div>
            <h3 className="method-title">WhatsApp</h3>
            <p className="method-detail">+91 98765 43210</p>
            <span className="method-action">Chat now</span>
          </button>

          <button onClick={handleEmail} className="method-card">
            <div className="method-icon email-icon">📧</div>
            <h3 className="method-title">Email</h3>
            <p className="method-detail">info@urvitours.com</p>
            <span className="method-action">Send email</span>
          </button>
        </div>
      </section>

      {/* Office Address */}
      <section className="office-section">
        <h2 className="section-title">Our office</h2>
        
        <div className="office-card">
          <div className="office-icon">📍</div>
          <div className="office-details">
            <h3 className="office-name">Urvi Tours & Travels</h3>
            <p className="office-address">
              123, Business Complex,<br />
              S.G. Highway,<br />
              Ahmedabad, Gujarat 380015<br />
              India
            </p>
          </div>
        </div>

        <button onClick={handleMapClick} className="map-button">
          <span>📍</span> View on Google Maps
        </button>
      </section>

      {/* Business Hours */}
      <section className="hours-section">
        <h2 className="section-title">Business hours</h2>
        
        <div className="hours-card">
          <div className="hours-row">
            <span className="day">Monday - Saturday</span>
            <span className="time">9:00 AM - 8:00 PM</span>
          </div>
          <div className="hours-row">
            <span className="day">Sunday</span>
            <span className="time">10:00 AM - 6:00 PM</span>
          </div>
          <p className="hours-note">
            * 24/7 emergency support available for ongoing trips
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <Link to="/cars" className="action-button primary">
          Browse our cars
        </Link>
        <Link to="/" className="action-button secondary">
          Back to home
        </Link>
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

      {/* Footer */}
      <footer className="footer">
        <nav className="footer-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/cars" className="nav-link">Cars</Link>
          <Link to="/contact" className="nav-link active">Contact</Link>
        </nav>
        <p className="footer-text">© 2026 Urvi Tours & Travels</p>
      </footer>
    </div>
  );
};

export default Contact;

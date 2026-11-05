import { useLocation, Link } from 'react-router-dom';
import './ThankYou.css';

const ThankYou = () => {
  const location = useLocation();
  const { message, customerName } = location.state || {};

  return (
    <div className="thank-you-page">
      <div className="thank-you-container">
        <div className="success-icon">
          <svg viewBox="0 0 52 52" className="checkmark">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <h1 className="thank-you-title">Thank you{customerName ? `, ${customerName}` : ''}!</h1>
        
        <p className="thank-you-message">
          {message || 'Your inquiry has been submitted successfully.'}
        </p>

        <div className="info-box">
          <h2 className="info-title">What happens next?</h2>
          <ul className="info-list">
            <li>
              <span className="step-icon">📞</span>
              <span>We will call you back soon to discuss your requirements</span>
            </li>
            <li>
              <span className="step-icon">💰</span>
              <span>We'll confirm the final price based on your trip details</span>
            </li>
            <li>
              <span className="step-icon">✅</span>
              <span>Once confirmed, your booking will be secured</span>
            </li>
          </ul>
        </div>

        <div className="contact-info">
          <p className="contact-text">Need immediate assistance?</p>
          <div className="contact-buttons">
            <a href="tel:+919876543210" className="contact-button call-button">
              📞 Call us now
            </a>
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="contact-button whatsapp-button">
              💬 WhatsApp us
            </a>
          </div>
        </div>

        <div className="action-buttons">
          <Link to="/" className="primary-button">
            Back to Home
          </Link>
          <Link to="/cars" className="secondary-button">
            Browse more cars
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <nav className="footer-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/cars" className="nav-link">Cars</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>
        <p className="footer-text">© 2026 Urvi Tours & Travels</p>
      </footer>
    </div>
  );
};

export default ThankYou;

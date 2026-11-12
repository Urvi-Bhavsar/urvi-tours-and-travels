import { Link, Navigate, useLocation } from 'react-router-dom';
import { usePageMeta } from '../../hooks.js';

export default function ThankYou() {
  usePageMeta('Thank you - Urvi Tours & Travells');
  const location = useLocation();

  // Opened directly (not after sending an inquiry): nothing to show, go home
  if (!location.state) return <Navigate to="/" replace />;
  const car = location.state.car;

  return (
    <section className="section">
      <div className="thanks">
        <h3>Thank you!</h3>
        <p>
          We received your booking inquiry{car ? ` for ${car}` : ''} and will call you soon. In a hurry? Tap Call or WhatsApp below.
        </p>
        <div className="hero-btns">
          <Link className="btn btn-primary" to="/cars">See more cars</Link>
          <Link className="btn" to="/">Back to home</Link>
        </div>
      </div>
    </section>
  );
}

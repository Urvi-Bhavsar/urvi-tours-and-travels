import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks.js';

export default function NotFound() {
  usePageMeta('Page not found - Urvi Tours & Travells');
  return (
    <section className="section">
      <h2>Page not found</h2>
      <p className="muted">That page does not exist.</p>
      <Link className="btn btn-primary spaced" to="/">Go to home</Link>
    </section>
  );
}

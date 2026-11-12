import { Link, NavLink, Outlet } from 'react-router-dom';
import { profile } from '../config.js';

const waLink = `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(profile.whatsappText)}`;
const navClass = ({ isActive }) => (isActive ? 'active' : undefined);

// Frame around every public page: top menu, footer, and the sticky Call / WhatsApp bar.
export default function PublicLayout() {
  return (
    <div className="page">
      <header className="topbar">
        <Link to="/" className="brand">{profile.name}</Link>
        <nav className="topnav" aria-label="Main">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/cars" className={navClass}>Cars</NavLink>
          <NavLink to="/book" className={navClass}>Book</NavLink>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">&copy; {new Date().getFullYear()} {profile.name}</footer>

      <nav className="sticky-bar" aria-label="Contact">
        <a className="btn btn-call" href={`tel:+${profile.phone}`}>Call now</a>
        <a className="btn btn-wa" href={waLink} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </nav>
    </div>
  );
}

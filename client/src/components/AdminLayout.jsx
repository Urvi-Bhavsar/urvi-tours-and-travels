import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { usePageMeta } from '../hooks.js';

const tabClass = ({ isActive }) => `main-tab${isActive ? ' active' : ''}`;

// Frame around every private admin page. Only rendered after PrivateRoute lets the user in.
export default function AdminLayout() {
  usePageMeta('Admin - Urvi Tours & Travells', { noindex: true });
  const { logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin">
      <div className="admin-top">
        <h1>Admin</h1>
        <div className="admin-actions">
          <Link className="btn btn-small" to="/">View site</Link>
          <button className="btn btn-small" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <nav className="main-tabs" aria-label="Admin">
        <NavLink to="/admin/inquiries" className={tabClass}>Inquiries</NavLink>
        <NavLink to="/admin/cars" className={tabClass}>Cars &amp; rates</NavLink>
      </nav>

      <Outlet />
    </div>
  );
}

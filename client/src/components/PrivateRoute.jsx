import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

// Wraps every /admin/* page. Not signed in -> /admin/login, then back to the page they asked for.
export default function PrivateRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <div className="center-note muted">Checking your login...</div>;
  if (status === 'out') return <Navigate to="/admin/login" replace state={{ from: location }} />;
  return <Outlet />;
}

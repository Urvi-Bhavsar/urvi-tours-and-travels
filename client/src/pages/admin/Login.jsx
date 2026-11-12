import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth.jsx';
import { usePageMeta } from '../../hooks.js';

export default function AdminLogin() {
  usePageMeta('Admin login - Urvi Tours & Travells', { noindex: true });
  const { status, login } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in: skip the form and go to the admin (or the page they were trying to open)
  if (status === 'in') return <Navigate to={from} replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="form login" onSubmit={submit}>
        <h2>Admin login</h2>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </label>
        <label>
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        <Link className="link-inline center" to="/">&larr; Back to website</Link>
      </form>
    </div>
  );
}

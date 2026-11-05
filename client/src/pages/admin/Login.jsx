import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userType, setUserType] = useState('admin'); // 'admin' or 'client'
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.identifier || !formData.password) {
      setError('Please enter both email/mobile and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(formData.identifier, formData.password);
      
      if (result.success) {
        // Redirect based on user type selection or actual role
        if (userType === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/'); // Client goes to home
        }
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background"></div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-circle">
              <span>🚗</span>
            </div>
            <h1 className="login-title">Urvi Tours & Travels</h1>
            <p className="login-subtitle">Sign in to continue</p>
          </div>

          {/* User Type Tabs */}
          <div className="user-type-tabs">
            <button
              type="button"
              className={`tab-button ${userType === 'admin' ? 'active' : ''}`}
              onClick={() => setUserType('admin')}
            >
              👤 Admin
            </button>
            <button
              type="button"
              className={`tab-button ${userType === 'client' ? 'active' : ''}`}
              onClick={() => setUserType('client')}
            >
              🧑‍💼 Client
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="identifier" className="form-label">
                Email or Mobile Number
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                className="form-input"
                placeholder="Enter email or mobile number"
                value={formData.identifier}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : `Sign in as ${userType === 'admin' ? 'Admin' : 'Client'}`}
            </button>
          </form>

          <div className="login-footer">
            <a href="/" className="back-link">
              ← Back to website
            </a>
          </div>
        </div>

        <div className="login-info">
          <p className="info-text">
            {userType === 'admin' 
              ? 'Admin access for managing cars and inquiries' 
              : 'Client access for booking and managing your trips'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

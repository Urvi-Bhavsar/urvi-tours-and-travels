import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { inquiryAPI, carAPI } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [cars, setCars] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const [statsRes, carsRes, inquiriesRes] = await Promise.all([
        inquiryAPI.getStats(),
        carAPI.getAllAdmin(),
        inquiryAPI.getAll(),
      ]);

      console.log('Stats:', statsRes.data);
      console.log('Cars:', carsRes.data);
      console.log('Inquiries:', inquiriesRes.data);

      setStats(statsRes.data.data);
      setCars(carsRes.data.data);
      setInquiries(inquiriesRes.data.data.slice(0, 10)); // Latest 10
      
      console.log('Dashboard data loaded successfully');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (mobileNumber) => {
    window.location.href = `tel:+91${mobileNumber}`;
  };

  const handleWhatsApp = (mobileNumber) => {
    window.open(`https://wa.me/91${mobileNumber}`, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      New: '#2196f3',
      Called: '#ff9800',
      Booked: '#4caf50',
      Closed: '#757575',
    };
    return colors[status] || '#757575';
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <h1 className="header-title">Dashboard</h1>
          <div className="header-actions">
            <span className="user-name">👤 {user?.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="stats-section">
        {error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card new">
              <div className="stat-icon">🆕</div>
              <div className="stat-details">
                <h3 className="stat-value">{stats?.new || 0}</h3>
                <p className="stat-label">New Inquiries</p>
              </div>
            </div>

            <div className="stat-card active">
              <div className="stat-icon">🚗</div>
              <div className="stat-details">
                <h3 className="stat-value">{cars.filter(c => c.active).length}</h3>
                <p className="stat-label">Active Cars</p>
              </div>
            </div>

            <div className="stat-card booked">
              <div className="stat-icon">✅</div>
              <div className="stat-details">
                <h3 className="stat-value">{stats?.booked || 0}</h3>
                <p className="stat-label">Booked</p>
              </div>
            </div>

            <div className="stat-card week">
              <div className="stat-icon">📊</div>
              <div className="stat-details">
                <h3 className="stat-value">{stats?.thisWeek || 0}</h3>
                <p className="stat-label">This Week</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Latest Inquiries */}
      <section className="inquiries-section">
        <div className="section-header">
          <h2 className="section-title">Latest Inquiries</h2>
          <Link to="/admin/inquiries" className="view-all-link">
            View all →
          </Link>
        </div>

        {inquiries.length === 0 ? (
          <div className="empty-state">
            <p>No inquiries yet</p>
          </div>
        ) : (
          <div className="inquiries-list">
            {inquiries.map((inquiry) => (
              <div key={inquiry._id} className="inquiry-card">
                <div className="inquiry-header">
                  <h3 className="customer-name">{inquiry.customerName}</h3>
                  <span 
                    className="status-badge" 
                    style={{ background: getStatusColor(inquiry.status) }}
                  >
                    {inquiry.status}
                  </span>
                </div>

                <div className="inquiry-details">
                  <p className="detail-row">
                    <span className="detail-icon">📞</span>
                    <span>{inquiry.mobileNumber}</span>
                  </p>
                  <p className="detail-row">
                    <span className="detail-icon">🚗</span>
                    <span>{inquiry.carName}</span>
                  </p>
                  {inquiry.pickupLocation && inquiry.dropLocation && (
                    <p className="detail-row">
                      <span className="detail-icon">📍</span>
                      <span>{inquiry.pickupLocation} → {inquiry.dropLocation}</span>
                    </p>
                  )}
                  {inquiry.travelDate && (
                    <p className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span>{new Date(inquiry.travelDate).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>

                <div className="inquiry-actions">
                  <button 
                    onClick={() => handleCall(inquiry.mobileNumber)} 
                    className="action-btn call-btn"
                  >
                    📞 Call
                  </button>
                  <button 
                    onClick={() => handleWhatsApp(inquiry.mobileNumber)} 
                    className="action-btn whatsapp-btn"
                  >
                    💬 WhatsApp
                  </button>
                  <Link 
                    to={`/admin/inquiries/${inquiry._id}`} 
                    className="action-btn view-btn"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Navigation */}
      <nav className="admin-nav">
        <Link to="/admin/dashboard" className="nav-item active">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </Link>
        <Link to="/admin/cars" className="nav-item">
          <span className="nav-icon">🚗</span>
          <span className="nav-label">Cars</span>
        </Link>
        <Link to="/admin/inquiries" className="nav-item">
          <span className="nav-icon">📋</span>
          <span className="nav-label">Inquiries</span>
        </Link>
      </nav>
    </div>
  );
};

export default Dashboard;

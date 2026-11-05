import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { inquiryAPI } from '../../services/api';
import './Inquiries.css';

const Inquiries = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    filterInquiries();
  }, [statusFilter, inquiries]);

  const fetchInquiries = async () => {
    try {
      console.log('Fetching inquiries...');
      const response = await inquiryAPI.getAll();
      console.log('Inquiries response:', response.data);
      setInquiries(response.data.data || []);
      setFilteredInquiries(response.data.data || []);
    } catch (err) {
      setError('Failed to load inquiries');
      console.error('Error fetching inquiries:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const filterInquiries = () => {
    if (statusFilter === 'All') {
      setFilteredInquiries(inquiries);
    } else {
      setFilteredInquiries(inquiries.filter(inq => inq.status === statusFilter));
    }
  };

  const handleStatusChange = async (inquiryId, newStatus) => {
    try {
      await inquiryAPI.updateStatus(inquiryId, newStatus);
      fetchInquiries(); // Refresh list
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (inquiryId) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) {
      return;
    }

    try {
      await inquiryAPI.delete(inquiryId);
      fetchInquiries(); // Refresh list
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      alert('Failed to delete inquiry');
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
      <div className="admin-inquiries">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-inquiries">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <h1 className="header-title">All Inquiries</h1>
          <div className="header-actions">
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <section className="filter-section">
        <div className="filter-buttons">
          {['All', 'New', 'Called', 'Booked', 'Closed'].map((status) => (
            <button
              key={status}
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status} {status === 'All' ? `(${inquiries.length})` : `(${inquiries.filter(i => i.status === status).length})`}
            </button>
          ))}
        </div>
      </section>

      {/* Inquiries List */}
      <section className="inquiries-list-section">
        {error ? (
          <div className="error-state">
            <p className="error-icon">⚠️</p>
            <p className="error-text">{error}</p>
            <button onClick={fetchInquiries} className="retry-button">
              Retry
            </button>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">📋</p>
            <p className="empty-text">
              {statusFilter === 'All' 
                ? 'No inquiries yet' 
                : `No ${statusFilter} inquiries`}
            </p>
          </div>
        ) : (
          <div className="inquiries-grid">
            {filteredInquiries.map((inquiry) => (
              <div key={inquiry._id} className="inquiry-card">
                <div className="inquiry-header">
                  <h3 className="customer-name">{inquiry.customerName}</h3>
                  <select
                    className="status-select"
                    value={inquiry.status}
                    onChange={(e) => handleStatusChange(inquiry._id, e.target.value)}
                    style={{ 
                      background: getStatusColor(inquiry.status),
                      color: 'white' 
                    }}
                  >
                    <option value="New">New</option>
                    <option value="Called">Called</option>
                    <option value="Booked">Booked</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="inquiry-details">
                  <div className="detail-row">
                    <span className="detail-icon">📞</span>
                    <span className="detail-text">{inquiry.mobileNumber}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">🚗</span>
                    <span className="detail-text">{inquiry.carName}</span>
                  </div>

                  {inquiry.pickupLocation && inquiry.dropLocation && (
                    <div className="detail-row">
                      <span className="detail-icon">📍</span>
                      <span className="detail-text">
                        {inquiry.pickupLocation} → {inquiry.dropLocation}
                      </span>
                    </div>
                  )}

                  {inquiry.travelDate && (
                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        {new Date(inquiry.travelDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}

                  {inquiry.passengers && (
                    <div className="detail-row">
                      <span className="detail-icon">👥</span>
                      <span className="detail-text">{inquiry.passengers} passengers</span>
                    </div>
                  )}

                  {inquiry.estimatedDistance && inquiry.estimatedFare && (
                    <div className="detail-row fare">
                      <span className="detail-icon">💰</span>
                      <span className="detail-text">
                        {inquiry.estimatedDistance} km · ₹{inquiry.estimatedFare}
                      </span>
                    </div>
                  )}

                  {inquiry.note && (
                    <div className="detail-row note">
                      <span className="detail-icon">📝</span>
                      <span className="detail-text">{inquiry.note}</span>
                    </div>
                  )}
                </div>

                <div className="inquiry-footer">
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
                    <button 
                      onClick={() => handleDelete(inquiry._id)} 
                      className="action-btn delete-btn"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <div className="inquiry-timestamp">
                    {new Date(inquiry.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Navigation */}
      <nav className="admin-nav">
        <Link to="/admin/dashboard" className="nav-item">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </Link>
        <Link to="/admin/cars" className="nav-item">
          <span className="nav-icon">🚗</span>
          <span className="nav-label">Cars</span>
        </Link>
        <Link to="/admin/inquiries" className="nav-item active">
          <span className="nav-icon">📋</span>
          <span className="nav-label">Inquiries</span>
        </Link>
      </nav>
    </div>
  );
};

export default Inquiries;

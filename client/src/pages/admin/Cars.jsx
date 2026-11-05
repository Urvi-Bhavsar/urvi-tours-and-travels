import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { carAPI } from '../../services/api';
import './Cars.css';

const Cars = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    seats: '',
    ratePerKm: '',
    photo: '',
    active: true,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await carAPI.getAllAdmin();
      setCars(response.data.data);
    } catch (err) {
      console.error('Failed to load cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formError) setFormError('');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      seats: '',
      ratePerKm: '',
      photo: '',
      active: true,
    });
    setEditingCar(null);
    setFormError('');
  };

  const handleAddCar = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditCar = (car) => {
    setFormData({
      name: car.name,
      seats: car.seats,
      ratePerKm: car.ratePerKm,
      photo: car.photo || '',
      active: car.active,
    });
    setEditingCar(car);
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.seats || !formData.ratePerKm) {
      setFormError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingCar) {
        await carAPI.update(editingCar._id, formData);
      } else {
        await carAPI.create(formData);
      }
      
      setShowAddModal(false);
      resetForm();
      fetchCars();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save car');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (car) => {
    try {
      await carAPI.toggleVisibility(car._id);
      fetchCars();
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    }
  };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this car?')) {
      return;
    }

    try {
      await carAPI.delete(carId);
      fetchCars();
    } catch (err) {
      console.error('Failed to delete car:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-cars">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <h1 className="header-title">Car Masters</h1>
          <div className="header-actions">
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Add Car Button */}
      <section className="add-section">
        <button onClick={handleAddCar} className="add-car-button">
          ➕ Add New Car
        </button>
      </section>

      {/* Cars List */}
      <section className="cars-list-section">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading cars...</p>
          </div>
        ) : cars.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">🚗</p>
            <p className="empty-text">No cars added yet</p>
            <button onClick={handleAddCar} className="empty-add-button">
              Add Your First Car
            </button>
          </div>
        ) : (
          <div className="cars-grid">
            {cars.map((car) => (
              <div key={car._id} className={`car-item ${!car.active ? 'hidden' : ''}`}>
                <div className="car-item-image">
                  {car.photo ? (
                    <img src={car.photo} alt={car.name} />
                  ) : (
                    <div className="car-placeholder">🚗</div>
                  )}
                  <div className={`status-badge ${car.active ? 'active' : 'inactive'}`}>
                    {car.active ? 'Active' : 'Hidden'}
                  </div>
                </div>

                <div className="car-item-details">
                  <h3 className="car-item-name">{car.name}</h3>
                  <div className="car-item-specs">
                    <span className="spec">👥 {car.seats} Seats</span>
                    <span className="spec rate">₹{car.ratePerKm}/km</span>
                  </div>

                  <div className="car-item-actions">
                    <button 
                      onClick={() => handleEditCar(car)} 
                      className="action-button edit"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleToggleVisibility(car)} 
                      className="action-button toggle"
                    >
                      {car.active ? '👁️ Hide' : '👁️ Show'}
                    </button>
                    <button 
                      onClick={() => handleDeleteCar(car._id)} 
                      className="action-button delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCar ? 'Edit Car' : 'Add New Car'}</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="car-form">
              <div className="form-group">
                <label className="form-label">
                  Car Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="e.g., Toyota Innova"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Seats <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    name="seats"
                    className="form-input"
                    placeholder="e.g., 7"
                    value={formData.seats}
                    onChange={handleInputChange}
                    min="1"
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Rate per KM (₹) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    name="ratePerKm"
                    className="form-input"
                    placeholder="e.g., 15"
                    value={formData.ratePerKm}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Photo URL (Optional)
                </label>
                <input
                  type="text"
                  name="photo"
                  className="form-input"
                  placeholder="https://example.com/car-image.jpg"
                  value={formData.photo}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
                <p className="form-hint">Enter image URL or leave empty</p>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                  <span>Show to clients (Active)</span>
                </label>
              </div>

              {formError && (
                <div className="form-error">{formError}</div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingCar ? 'Update Car' : 'Add Car'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="admin-nav">
        <Link to="/admin/dashboard" className="nav-item">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </Link>
        <Link to="/admin/cars" className="nav-item active">
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

export default Cars;

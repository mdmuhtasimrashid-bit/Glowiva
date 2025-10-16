import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const EmployeeProfile = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    salaryToggle: true
  });
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        salaryToggle: user.salaryToggle !== undefined ? user.salaryToggle : true
      });
      fetchMyOrders();
    }
  }, [user]);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/employee/my-orders');
      setOrders(response.data.orders);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch your orders');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const result = await updateProfile(profile);

    if (result.success) {
      toast.success('Profile updated successfully!');
      fetchMyOrders(); // Refresh orders to get updated commission info
    } else {
      toast.error(result.error);
    }

    setUpdating(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `৳${amount.toLocaleString()}`;
  };

  if (loading) {
    return <div className="loading">Loading your profile...</div>;
  }

  return (
    <div className="employee-profile">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Welcome, {user?.firstName} {user?.lastName}</p>
      </div>

      <div className="profile-content">
        {/* Profile Form */}
        <div className="profile-card">
          <h2>Personal Information</h2>
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="salaryToggle"
                  name="salaryToggle"
                  checked={profile.salaryToggle}
                  onChange={handleInputChange}
                />
                <label htmlFor="salaryToggle">
                  Enable Commission-Based Salary
                  <span className="help-text">
                    When enabled, you'll earn {formatCurrency(user?.commissionPerOrder || 0)} per order
                  </span>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="update-button"
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Statistics Card */}
        <div className="stats-card">
          <h2>My Performance</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Orders Created</span>
              <span className="stat-value">{stats.orderCount || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">{formatCurrency(stats.totalRevenue || 0)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Commission Earned</span>
              <span className="stat-value">{formatCurrency(stats.totalCommission || 0)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Commission Status</span>
              <span className={`stat-value ${stats.salaryToggleEnabled ? 'active' : 'inactive'}`}>
                {stats.salaryToggleEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="orders-card">
          <h2>My Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="no-orders">You haven't created any orders yet.</p>
          ) : (
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map(order => (
                    <tr key={order._id}>
                      <td>{order.orderNumber}</td>
                      <td>{order.customerName}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .employee-profile {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-header {
          margin-bottom: 30px;
        }

        .profile-header h1 {
          color: #333;
          margin-bottom: 5px;
        }

        .profile-header p {
          color: #666;
          font-size: 16px;
        }

        .profile-content {
          display: grid;
          gap: 30px;
        }

        .profile-card, .stats-card, .orders-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .profile-card h2, .stats-card h2, .orders-card h2 {
          margin-bottom: 20px;
          color: #333;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          margin-bottom: 6px;
        }

        .form-group input {
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .checkbox-wrapper input[type="checkbox"] {
          width: auto;
          margin-top: 4px;
        }

        .checkbox-wrapper label {
          flex: 1;
          cursor: pointer;
        }

        .help-text {
          display: block;
          font-size: 14px;
          color: #666;
          font-weight: normal;
          margin-top: 4px;
        }

        .update-button {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .update-button:hover:not(:disabled) {
          background: #5a67d8;
        }

        .update-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stat-item {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .stat-label {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #333;
        }

        .stat-value.active {
          color: #22c55e;
        }

        .stat-value.inactive {
          color: #ef4444;
        }

        .orders-table {
          overflow-x: auto;
        }

        .orders-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .orders-table th,
        .orders-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e1e5e9;
        }

        .orders-table th {
          font-weight: 600;
          color: #333;
          background: #f8f9fa;
        }



        .no-orders {
          text-align: center;
          color: #666;
          font-style: italic;
          padding: 40px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeProfile;
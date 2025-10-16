import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { FiDollarSign, FiShoppingCart, FiPackage, FiUsers, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getDashboard();
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(102, 126, 234, 0.2)',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '18px', fontWeight: '500' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: 'linear-gradient(135deg, #ff416c15 0%, #ff416c05 100%)',
          border: '2px solid #ff416c20'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#ff416c', marginBottom: '10px' }}>Error Loading Dashboard</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchDashboardData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
          <h2 style={{ color: '#64748b' }}>No Data Available</h2>
          <p style={{ color: '#64748b' }}>Dashboard data is not available at the moment.</p>
        </div>
      </div>
    );
  }

  const { today, monthly, yearly, inventory, employees } = dashboardData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount || 0);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="card" style={{ 
      position: 'relative',
      overflow: 'hidden',
      height: '140px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '80px',
        height: '80px',
        background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div>
          <h3 style={{ 
            fontSize: '14px', 
            color: '#1a1a1a', 
            margin: '0 0 12px 0',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>{title}</h3>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            color, 
            margin: '0',
            lineHeight: '1.2'
          }}>{value}</p>
          <div style={{ height: '20px', display: 'flex', alignItems: 'center' }}>
            {subtitle && <p style={{ 
              fontSize: '14px', 
              color: '#64748b', 
              margin: '0',
              fontWeight: '500'
            }}>{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Dashboard</h1>
      
      {/* Today's Stats */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Today's Performance</h2>
        <div className="row">
          <div className="col-md-4">
            <StatCard
              title="Today's Orders"
              value={today.orders}
              icon={FiShoppingCart}
              color="#007bff"
            />
          </div>
          <div className="col-md-4">
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(today.revenue)}
              icon={FiDollarSign}
              color="#28a745"
            />
          </div>
          <div className="col-md-4">
            <StatCard
              title="Today's Profit"
              value={formatCurrency(today.profit)}
              icon={today.profit >= 0 ? FiTrendingUp : FiTrendingDown}
              color={today.profit >= 0 ? '#28a745' : '#dc3545'}
            />
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>This Month</h2>
        <div className="row">
          <div className="col-md-3">
            <StatCard
              title="Monthly Orders"
              value={monthly.orders}
              icon={FiShoppingCart}
              color="#007bff"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              title="Monthly Revenue"
              value={formatCurrency(monthly.revenue)}
              icon={FiDollarSign}
              color="#28a745"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              title="Monthly Cost"
              value={formatCurrency(monthly.cost)}
              icon={FiDollarSign}
              color="#ffc107"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              title="Monthly Profit"
              value={formatCurrency(monthly.profit)}
              icon={monthly.profit >= 0 ? FiTrendingUp : FiTrendingDown}
              color={monthly.profit >= 0 ? '#28a745' : '#dc3545'}
              subtitle={`${((monthly.profit / monthly.revenue) * 100 || 0).toFixed(1)}% margin`}
            />
          </div>
        </div>
      </div>

      {/* Yearly Stats */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>This Year</h2>
        <div className="row">
          <div className="col-md-3">
            <StatCard
              title="Yearly Orders"
              value={yearly.orders}
              icon={FiShoppingCart}
              color="#007bff"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              title="Yearly Revenue"
              value={formatCurrency(yearly.revenue)}
              icon={FiDollarSign}
              color="#28a745"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              title="Yearly Cost"
              value={formatCurrency(yearly.cost)}
              icon={FiDollarSign}
              color="#ffc107"
            />
          </div>
          <div className="col-md-3">
            <StatCard
              title="Yearly Profit"
              value={formatCurrency(yearly.profit)}
              icon={yearly.profit >= 0 ? FiTrendingUp : FiTrendingDown}
              color={yearly.profit >= 0 ? '#28a745' : '#dc3545'}
              subtitle={`${((yearly.profit / yearly.revenue) * 100 || 0).toFixed(1)}% margin`}
            />
          </div>
        </div>
      </div>

      {/* Business Overview */}
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Inventory Overview</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '18px', margin: '10px 0' }}>
                  <FiPackage style={{ marginRight: '8px' }} />
                  Total Products: <strong>{inventory.totalProducts}</strong>
                </p>
                <p style={{ fontSize: '16px', margin: '10px 0', color: inventory.lowStockProducts > 0 ? '#dc3545' : '#28a745' }}>
                  Low Stock Items: <strong>{inventory.lowStockProducts}</strong>
                </p>
              </div>
              <FiPackage size={60} color="#007bff" style={{ opacity: 0.3 }} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Team Overview</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '18px', margin: '10px 0' }}>
                  <FiUsers style={{ marginRight: '8px' }} />
                  Active Employees: <strong>{employees.total}</strong>
                </p>
                <p style={{ fontSize: '14px', margin: '10px 0', color: '#6c757d' }}>
                  Manage your team and calculate salaries
                </p>
              </div>
              <FiUsers size={60} color="#28a745" style={{ opacity: 0.3 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="row">
          <div className="col-md-3">
            <a href="/products" className="btn btn-primary" style={{ width: '100%', marginBottom: '10px' }}>
              Add New Product
            </a>
          </div>
          <div className="col-md-3">
            <a href="/orders" className="btn btn-success" style={{ width: '100%', marginBottom: '10px' }}>
              Create New Order
            </a>
          </div>
          <div className="col-md-3">
            <a href="/employees" className="btn btn-warning" style={{ width: '100%', marginBottom: '10px' }}>
              Manage Employees
            </a>
          </div>
          <div className="col-md-3">
            <a href="/analytics" className="btn btn-secondary" style={{ width: '100%', marginBottom: '10px' }}>
              View Analytics
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
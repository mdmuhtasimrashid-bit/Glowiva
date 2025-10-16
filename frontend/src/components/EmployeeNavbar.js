import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutButton from './LogoutButton';

// Logo component that matches your Glowiva branding
const GlowivaLogo = () => (
  <div style={logoStyles.logoContainer}>
    <div style={logoStyles.logoIcon}>
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
        {/* Plant leaves */}
        <path d="M20 8C18 10 16 12 16 16C16 18 17 19 18 20C19 19 20 18 20 16V8Z" 
              stroke="#6B8E6B" strokeWidth="2" fill="none"/>
        <path d="M20 8C22 10 24 12 24 16C24 18 23 19 22 20C21 19 20 18 20 16V8Z" 
              stroke="#6B8E6B" strokeWidth="2" fill="none"/>
        {/* Sun */}
        <circle cx="28" cy="12" r="3" stroke="#6B8E6B" strokeWidth="2" fill="none"/>
        <path d="M28 6v2M34 12h-2M28 18v2M22 12h2M31.5 8.5l-1.4 1.4M31.5 15.5l-1.4-1.4M24.5 15.5l1.4-1.4M24.5 8.5l1.4 1.4" 
              stroke="#6B8E6B" strokeWidth="1.5"/>
        {/* Smile/ground */}
        <path d="M12 28C16 24 24 24 28 28" stroke="#6B8E6B" strokeWidth="2" fill="none"/>
      </svg>
    </div>
    <div style={logoStyles.logoText}>
      <div style={logoStyles.brandName}>GLOWIVA</div>
      <div style={logoStyles.tagline}>Authentic skincare & makeup</div>
    </div>
  </div>
);

const logoStyles = {
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#6B8E6B',
    letterSpacing: '1px',
    lineHeight: '1',
  },
  tagline: {
    fontSize: '9px',
    color: '#8A8A8A',
    marginTop: '1px',
    fontWeight: '400',
  },
};

const EmployeeNavbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="employee-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/employee/orders" className="brand-link">
            <GlowivaLogo />
            <span className="employee-badge">Employee Portal</span>
          </Link>
        </div>

        <div className="navbar-menu">
          <Link 
            to="/employee/orders" 
            className={`nav-link ${isActive('/employee/orders') ? 'active' : ''}`}
          >
            My Orders
          </Link>
          <Link 
            to="/employee/products" 
            className={`nav-link ${isActive('/employee/products') ? 'active' : ''}`}
          >
            Products
          </Link>
          <Link 
            to="/employee/profile" 
            className={`nav-link ${isActive('/employee/profile') ? 'active' : ''}`}
          >
            Profile
          </Link>
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="user-role">Employee</span>
          </div>
          <LogoutButton 
            className="logout-button"
            style={{
              background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(255, 65, 108, 0.3)',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .employee-navbar {
          background: rgba(255, 255, 255, 0.95);
          backdropFilter: blur(20px);
          color: #333;
          padding: 0 20px;
          boxShadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          zIndex: 1000;
          border: 1px solid rgba(255, 255, 255, 0.2);
          borderTop: none;
        }

        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1400px;
          margin: 0 auto;
          height: 80px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
        }

        .brand-link {
          text-decoration: none;
          color: #667eea;
          display: flex;
          align-items: center;
          gap: 12px;
        }



        .employee-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .navbar-menu {
          display: flex;
          gap: 30px;
          align-items: center;
        }

        .nav-link {
          color: #1a1a1a;
          text-decoration: none;
          font-weight: 700;
          padding: 12px 20px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .nav-link:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          transform: translateY(-1px);
        }

        .nav-link.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #1a1a1a;
        }

        .user-role {
          font-size: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 500;
        }



        @media (max-width: 768px) {
          .navbar-container {
            padding: 0 15px;
            height: 60px;
          }



          .employee-badge {
            display: none;
          }

          .navbar-menu {
            gap: 15px;
          }

          .nav-link {
            padding: 6px 12px;
            font-size: 14px;
          }

          .user-info {
            display: none;
          }

          .logout-button {
            padding: 6px 12px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .navbar-menu {
            gap: 10px;
          }

          .nav-link {
            padding: 4px 8px;
            font-size: 12px;
          }
        }
      `}</style>
    </nav>
  );
};

export default EmployeeNavbar;
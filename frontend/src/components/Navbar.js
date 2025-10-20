import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiPackage, FiShoppingCart, FiUsers, FiBarChart2 } from 'react-icons/fi';
import LogoutButton from './LogoutButton';

// Logo component that matches your Glowiva branding
const GlowivaLogo = () => (
  <div style={styles.logoContainer}>
    <div style={styles.logoIcon}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
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
    <div style={styles.logoText}>
      <div style={styles.brandName}>GLOWIVA</div>
      <div style={styles.tagline}>Authentic skincare & makeup</div>
    </div>
  </div>
);

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/products', label: 'Products', icon: FiPackage },
    { path: '/orders', label: 'Orders', icon: FiShoppingCart },
    { path: '/employees', label: 'Employees', icon: FiUsers },
    { path: '/analytics', label: 'Analytics', icon: FiBarChart2 },
  ];

  return (
    <>
      <style>{`
        .logout-btn:hover {
          background: linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(255, 65, 108, 0.5) !important;
        }
        .logout-btn:active {
          transform: translateY(0) !important;
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .navbar-mobile {
            height: 70px !important;
            padding: 0 12px !important;
          }
          
          .nav-container-mobile {
            gap: 8px !important;
          }
          
          .logo-container-mobile {
            gap: 8px !important;
          }
          
          .logo-text-mobile .brand-name {
            font-size: 18px !important;
          }
          
          .logo-text-mobile .tagline {
            font-size: 9px !important;
          }
          
          .nav-items-mobile {
            gap: 8px !important;
            overflow-x: auto;
            padding: 0 4px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .nav-items-mobile::-webkit-scrollbar {
            display: none;
          }
          
          .nav-item-mobile {
            padding: 8px 12px !important;
            border-radius: 8px !important;
            white-space: nowrap;
            flex-shrink: 0;
          }
          
          .nav-item-text-mobile {
            font-size: 12px !important;
            display: none;
          }
          
          .logout-button-mobile {
            padding: 8px 12px !important;
            font-size: 12px !important;
            margin-left: 8px !important;
            border-radius: 8px !important;
            min-width: auto !important;
          }
        }
        
        @media (max-width: 480px) {
          .navbar-mobile {
            height: 60px !important;
            padding: 0 8px !important;
          }
          
          .logo-text-mobile .brand-name {
            font-size: 16px !important;
          }
          
          .logo-text-mobile .tagline {
            display: none !important;
          }
          
          .nav-items-mobile {
            gap: 6px !important;
          }
          
          .nav-item-mobile {
            padding: 6px 8px !important;
          }
          
          .logout-button-mobile {
            padding: 6px 8px !important;
            margin-left: 6px !important;
          }
        }
      `}</style>
      <nav style={styles.navbar} className="navbar-mobile">
        <div className="container nav-container-mobile" style={styles.navContainer}>
          <Link to="/" style={styles.brand}>
            <div style={styles.logoContainer} className="logo-container-mobile">
              <div style={styles.logoIcon}>
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
              <div style={styles.logoText} className="logo-text-mobile">
                <div style={styles.brandName} className="brand-name">GLOWIVA</div>
                <div style={styles.tagline} className="tagline">Authentic skincare & makeup</div>
              </div>
            </div>
          </Link>
          <div style={styles.navItems} className="nav-items-mobile">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="nav-item-mobile"
                  style={{
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {}),
                  }}
                >
                  <Icon size={16} />
                  <span style={styles.navItemText} className="nav-item-text-mobile">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <LogoutButton 
              style={styles.logoutButton} 
              className="logout-btn logout-button-mobile" 
            />
          </div>
        </div>
      </nav>
    </>
  );
};

const styles = {
  navbar: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: '80px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderTop: 'none',
  },
  navContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  brand: {
    textDecoration: 'none',
    color: '#6B8E6B',
    fontWeight: 'bold',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#6B8E6B',
    letterSpacing: '1px',
    lineHeight: '1',
  },
  tagline: {
    fontSize: '11px',
    color: '#8A8A8A',
    marginTop: '2px',
    fontWeight: '400',
  },
  navItems: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: '#1a1a1a',
    padding: '12px 20px',
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    fontWeight: '700',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
  },
  navItemText: {
    fontSize: '14px',
    fontWeight: '700',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    marginLeft: '20px',
    boxShadow: '0 4px 15px rgba(255, 65, 108, 0.3)',
  },
};

export default Navbar;
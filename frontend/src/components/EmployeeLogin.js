import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

// Styles for the logo component
const styles = {
  logoSection: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
    paddingTop: '20px',
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
};

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

const EmployeeLogin = ({ onSwitchToAdmin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(credentials, false); // false for employee login

    if (result.success) {
      // Redirect will be handled by App.js based on authentication state
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={styles.logoSection}>
          <GlowivaLogo />
        </div>
        <div className="auth-header">
          <h2>Employee Login</h2>
          <p>Access your Glowiva employee portal</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              placeholder="Enter your username or email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login as Employee'}
          </button>
        </form>

        <div className="auth-links">
          <button 
            type="button" 
            onClick={onSwitchToAdmin}
            className="link-button"
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
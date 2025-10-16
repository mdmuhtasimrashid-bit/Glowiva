import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiX } from 'react-icons/fi';

const LogoutButton = ({ className = '', style = {} }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    setShowConfirm(false);
    // Re-enable scroll
    document.body.style.overflow = 'unset';
  };

  const handleCancel = () => {
    setShowConfirm(false);
    // Re-enable scroll
    document.body.style.overflow = 'unset';
  };

  const handleShowConfirm = () => {
    setShowConfirm(true);
    // Disable body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Cleanup effect to re-enable scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showConfirm) {
        handleCancel();
      }
    };

    if (showConfirm) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showConfirm]);

  return (
    <>
      <button 
        onClick={handleShowConfirm} 
        style={style} 
        className={className}
      >
        <FiLogOut size={16} />
        <span>Logout</span>
      </button>

      {showConfirm && createPortal(
        <div className="logout-modal-backdrop" onClick={handleCancel}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h3>Confirm Logout</h3>
              <button onClick={handleCancel} className="close-button">
                <FiX size={20} />
              </button>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to logout, <strong>{user?.firstName}</strong>?</p>
              <p>You'll need to sign in again to access your account.</p>
            </div>
            <div className="logout-modal-footer">
              <button onClick={handleCancel} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleLogout} className="confirm-logout-button">
                <FiLogOut size={16} />
                Yes, Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        .logout-modal-backdrop {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(0, 0, 0, 0.7) !important;
          backdrop-filter: blur(12px) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 2147483647 !important;
          animation: fadeIn 0.3s ease-out;
          margin: 0 !important;
          padding: 20px !important;
          box-sizing: border-box !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .logout-modal {
          background: white !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 24px !important;
          width: 100% !important;
          max-width: 450px !important;
          min-height: 200px !important;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3) !important;
          border: 2px solid rgba(102, 126, 234, 0.2) !important;
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden !important;
          position: relative !important;
          z-index: 2147483647 !important;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logout-modal-header {
          padding: 30px 30px 20px 30px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%) !important;
          border-bottom: 1px solid rgba(102, 126, 234, 0.1) !important;
        }

        .logout-modal-header h3 {
          margin: 0 !important;
          color: #333 !important;
          font-size: 22px !important;
          font-weight: 700 !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
        }

        .close-button {
          background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%) !important;
          border: none !important;
          color: white !important;
          cursor: pointer !important;
          padding: 8px !important;
          border-radius: 50% !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 36px !important;
          height: 36px !important;
          box-shadow: 0 4px 15px rgba(255, 65, 108, 0.3) !important;
        }

        .close-button:hover {
          background: linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(255, 65, 108, 0.5) !important;
        }

        .logout-modal-body {
          padding: 30px !important;
          text-align: center !important;
        }

        .logout-modal-body p {
          margin: 0 0 16px 0 !important;
          color: #555 !important;
          line-height: 1.6 !important;
          font-size: 16px !important;
        }

        .logout-modal-body p:first-child {
          font-size: 18px !important;
          font-weight: 600 !important;
          color: #333 !important;
        }

        .logout-modal-body p:last-child {
          margin-bottom: 0 !important;
          color: #666 !important;
          font-size: 14px !important;
        }

        .logout-modal-body strong {
          color: #667eea !important;
          font-weight: 700 !important;
        }

        .logout-modal-footer {
          padding: 20px 30px 30px 30px !important;
          display: flex !important;
          gap: 15px !important;
          justify-content: center !important;
          background: rgba(248, 250, 252, 0.8) !important;
          border-top: 1px solid rgba(102, 126, 234, 0.1) !important;
        }

        .cancel-button {
          background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%) !important;
          border: none !important;
          color: white !important;
          padding: 14px 28px !important;
          border-radius: 16px !important;
          cursor: pointer !important;
          font-weight: 700 !important;
          font-size: 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          backdrop-filter: blur(10px) !important;
          box-shadow: 0 4px 15px rgba(102, 166, 255, 0.3) !important;
          min-width: 120px !important;
        }

        .cancel-button:hover {
          background: linear-gradient(135deg, #66a6ff 0%, #89f7fe 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(102, 166, 255, 0.4) !important;
        }

        .confirm-logout-button {
          background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%) !important;
          border: none !important;
          color: white !important;
          padding: 14px 28px !important;
          border-radius: 16px !important;
          cursor: pointer !important;
          font-weight: 700 !important;
          font-size: 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 10px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          backdrop-filter: blur(10px) !important;
          box-shadow: 0 4px 15px rgba(255, 65, 108, 0.3) !important;
          min-width: 150px !important;
        }

        .confirm-logout-button:hover {
          background: linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(255, 65, 108, 0.5) !important;
        }

        @media (max-width: 480px) {
          .logout-modal {
            margin: 20px;
          }
          
          .logout-modal-footer {
            flex-direction: column-reverse;
          }
          
          .cancel-button,
          .confirm-logout-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
};

export default LogoutButton;
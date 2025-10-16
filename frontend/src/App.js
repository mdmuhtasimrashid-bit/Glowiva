import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import Navbar from './components/Navbar';
import EmployeeNavbar from './components/EmployeeNavbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Employees from './pages/Employees';
import Analytics from './pages/Analytics';
import EmployeeProfile from './pages/EmployeeProfile';
import EmployeeProducts from './pages/EmployeeProducts';

// Protected Route Component for Admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>Loading...</div>;
  }
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// Protected Route Component for Employee
const EmployeeRoute = ({ children }) => {
  const { isAuthenticated, isEmployee, loading } = useAuth();
  
  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>Loading...</div>;
  }
  
  if (!isAuthenticated || !isEmployee) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// Main App Content
const AppContent = () => {
  const { isAuthenticated, isAdmin, isEmployee, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="App">
      {isAdmin && <Navbar />}
      {isEmployee && <EmployeeNavbar />}
      
      <div className="main-content">
        <Routes>
          {/* Admin Routes */}
          <Route path="/" element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          } />
          <Route path="/products" element={
            <AdminRoute>
              <Products />
            </AdminRoute>
          } />
          <Route path="/orders" element={
            <AdminRoute>
              <Orders />
            </AdminRoute>
          } />
          <Route path="/employees" element={
            <AdminRoute>
              <Employees />
            </AdminRoute>
          } />
          <Route path="/analytics" element={
            <AdminRoute>
              <Analytics />
            </AdminRoute>
          } />

          {/* Employee Routes */}
          <Route path="/employee/orders" element={
            <EmployeeRoute>
              <Orders />
            </EmployeeRoute>
          } />
          <Route path="/employee/products" element={
            <EmployeeRoute>
              <EmployeeProducts />
            </EmployeeRoute>
          } />
          <Route path="/employee/profile" element={
            <EmployeeRoute>
              <EmployeeProfile />
            </EmployeeRoute>
          } />

          {/* Redirect based on role */}
          <Route path="/auth" element={
            isAuthenticated ? 
              (isAdmin ? <Navigate to="/" replace /> : <Navigate to="/employee/orders" replace />) :
              <AuthPage />
          } />

          {/* Default redirects */}
          <Route path="*" element={
            isAdmin ? <Navigate to="/" replace /> : <Navigate to="/employee/orders" replace />
          } />
        </Routes>
      </div>

      <ToastContainer 
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '14px',
          fontWeight: '500'
        }}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
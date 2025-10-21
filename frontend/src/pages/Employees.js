import React, { useState, useEffect } from 'react';
import { employeesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit, FiUserX, FiUsers, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Employees = () => {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryData, setSalaryData] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [resettingCommission, setResettingCommission] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    position: '',
    department: 'sales', // Default to sales since it's commission-based
    baseSalary: '0', // Set to 0 since salary is commission-based
    commissionPerOrder: '0',
    hireDate: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });

  const positions = ['manager', 'sales_associate', 'inventory_clerk', 'customer_service', 'admin', 'other'];
  const departments = ['sales', 'inventory', 'customer_service', 'administration', 'marketing', 'other'];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getAll({ isActive: true });
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to fetch employees');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const requiredFields = ['firstName', 'lastName', 'email', 'username', 'phone', 'position', 'department', 'hireDate'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    if (!editingEmployee && (!formData.password || formData.password.length < 6)) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (editingEmployee && formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Validate username (no spaces, minimum 3 characters)
    if (!formData.username || formData.username.length < 3 || formData.username.includes(' ')) {
      toast.error('Username must be at least 3 characters long and contain no spaces');
      return;
    }
    
    try {
      console.log('Submitting form data:', formData);
      
      if (editingEmployee) {
        // When editing, don't include password if it's empty
        const updateData = { ...formData };
        if (!updateData.password || updateData.password.trim() === '') {
          delete updateData.password;
        }
        console.log('Updating employee:', editingEmployee._id, updateData);
        await employeesAPI.update(editingEmployee._id, updateData);
        toast.success('Employee updated successfully');
      } else {
        console.log('Creating new employee:', formData);
        await employeesAPI.create(formData);
        toast.success('Employee added successfully');
      }
      fetchEmployees();
      closeModal();
    } catch (error) {
      console.error('Employee submit error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save employee';
      toast.error(errorMessage);
    }
  };

  const handleTerminate = async (id) => {
    if (!isAdmin) {
      toast.error('Admin access required to terminate employees');
      return;
    }
    
    if (window.confirm('Are you sure you want to terminate this employee?')) {
      try {
        await employeesAPI.terminate(id, { terminationDate: new Date() });
        toast.success('Employee terminated successfully');
        fetchEmployees();
      } catch (error) {
        console.error('Terminate error:', error);
        if (error.response?.status === 403) {
          toast.error('Admin access required to terminate employees');
        } else if (error.response?.status === 404) {
          toast.error('Employee not found');
        } else {
          toast.error(error.response?.data?.message || 'Failed to terminate employee');
        }
      }
    }
  };

  const viewEmployeeSalary = async (employee) => {
    try {
      setSelectedEmployee(employee);
      // Get employee orders to calculate total salary
      const response = await employeesAPI.getEmployeeOrders(employee._id);
      setSalaryData(response.data);
      setShowSalaryModal(true);
    } catch (error) {
      toast.error('Failed to load salary data');
      console.error('Salary error:', error);
    }
  };

  const handleResetCommission = async () => {
    if (!selectedEmployee || !isAdmin) {
      toast.error('Admin access required to reset commission');
      return;
    }

    const confirmMessage = `Are you sure you want to reset commission for ${selectedEmployee.firstName} ${selectedEmployee.lastName}?\n\nThis will:\n• Mark current date as commission payment point\n• Reset their unpaid commission to ৳0\n• Keep all order history and employee assignments intact\n• Start fresh commission calculations from today\n\nPrevious order history will remain visible for reference.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setResettingCommission(true);
        const response = await employeesAPI.resetCommission(selectedEmployee._id);
        
        toast.success(`✅ Commission reset successful!\n${response.data.message}`);
        
        // Update the selected employee with the new commission paid date
        const updatedEmployee = {
          ...selectedEmployee,
          commissionPaidDate: response.data.resetDate
        };
        setSelectedEmployee(updatedEmployee);
        
        // Immediately update salary data with reset values
        const updatedSalaryData = {
          ...salaryData,
          commissionEligibleOrderCount: 0,
          totalCommission: 0,
          commissionPaidDate: response.data.resetDate
        };
        setSalaryData(updatedSalaryData);
        
        // Refresh the employee list and salary data to ensure consistency
        fetchEmployees();
        setTimeout(async () => {
          await viewEmployeeSalary(updatedEmployee);
        }, 200);
        
      } catch (error) {
        console.error('Reset commission error:', error);
        const errorMessage = error.response?.data?.message || 'Failed to reset commission';
        toast.error(`❌ ${errorMessage}`);
      } finally {
        setResettingCommission(false);
      }
    }
  };

  const openModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        username: employee.username,
        password: '', // Don't pre-fill password for security
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        baseSalary: employee.baseSalary,
        commissionPerOrder: employee.commissionPerOrder || 0,
        hireDate: new Date(employee.hireDate).toISOString().split('T')[0],
        address: employee.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        emergencyContact: employee.emergencyContact || {
          name: '',
          phone: '',
          relationship: '',
        },
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        phone: '',
        position: '',
        department: 'sales', // Default to sales
        baseSalary: '0', // Set to 0 for commission-based salary
        commissionPerOrder: '0',
        hireDate: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        emergencyContact: {
          name: '',
          phone: '',
          relationship: '',
        },
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => {
        const updatedFormData = {
          ...prev,
          [name]: value
        };
        
        // Auto-suggest username when first name or last name changes (only for new employees)
        if (!editingEmployee && (name === 'firstName' || name === 'lastName') && updatedFormData.firstName && updatedFormData.lastName) {
          const suggestedUsername = `${updatedFormData.firstName.toLowerCase()}.${updatedFormData.lastName.toLowerCase()}`;
          if (!prev.username || prev.username.includes(prev.firstName?.toLowerCase()) || prev.username.includes(prev.lastName?.toLowerCase())) {
            updatedFormData.username = suggestedUsername;
          }
        }
        
        return updatedFormData;
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount || 0);
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading employees...</div></div>;
  }

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Employees</h1>
        {isAdmin && (
          <div>
            <button className="btn btn-primary" onClick={() => openModal()}>
              <FiPlus style={{ marginRight: '8px' }} />
              Add Employee
            </button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="alert alert-info" style={{ marginBottom: '20px' }}>
          <strong>Employee View:</strong> You can view employee details and salary information. Administrative functions like adding or terminating employees require admin access.
        </div>
      )}

      {employees.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px' }}>
          <FiUsers size={60} color="#6c757d" style={{ marginBottom: '20px' }} />
          <h3>No employees found</h3>
          <p>Start by adding your first team member.</p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => openModal()}>
              Add Your First Employee
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{
          border: '2px solid #667eea',
          borderRadius: '15px',
          overflow: 'hidden',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
        }}>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  <th style={{
                    padding: '18px 20px',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: 'white',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    borderBottom: 'none'
                  }}>👤 Name</th>
                  <th style={{
                    padding: '18px 20px',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: 'white',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    borderBottom: 'none'
                  }}>💼 Position</th>
                  <th style={{
                    padding: '18px 20px',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: 'white',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    borderBottom: 'none'
                  }}>💰 Commission Per Order</th>
                  <th style={{
                    padding: '18px 20px',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: 'white',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    borderBottom: 'none'
                  }}>📅 Hire Date</th>
                  <th style={{
                    padding: '18px 20px',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: 'white',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    borderBottom: 'none'
                  }}>⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => (
                  <tr key={employee._id} style={{
                    backgroundColor: index % 2 === 0 ? 'rgba(102, 126, 234, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.15)';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'rgba(102, 126, 234, 0.05)' : 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}>
                    <td style={{
                      padding: '15px 20px',
                      borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                    }}>
                      <div>
                        <div style={{ 
                          fontWeight: '700', 
                          fontSize: '15px',
                          color: '#2d3748',
                          marginBottom: '4px'
                        }}>
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#4a5568',
                          fontWeight: '600'
                        }}>
                          📞 {employee.phone}
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '15px 20px',
                      borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                    }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #805ad5, #9f7aea)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(128, 90, 213, 0.3)'
                      }}>
                        {employee.position.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{
                      padding: '15px 20px',
                      textAlign: 'center',
                      borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #48bb78, #38a169)',
                        color: 'white',
                        padding: '8px 15px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '800',
                        display: 'inline-block',
                        boxShadow: '0 3px 10px rgba(56, 161, 105, 0.3)'
                      }}>
                        ৳{employee.commissionPerOrder || 0} per order
                      </div>
                    </td>
                    <td style={{
                      padding: '15px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4a5568',
                      borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                    }}>{new Date(employee.hireDate).toLocaleDateString()}</td>
                    <td style={{
                      padding: '15px 20px',
                      borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                    }}>
                      {isAdmin && (
                        <button
                          className="btn btn-sm btn-primary mr-2"
                          onClick={() => openModal(employee)}
                          title="Edit Employee"
                        >
                          <FiEdit size={14} />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-success mr-2"
                        onClick={() => viewEmployeeSalary(employee)}
                        title="View Salary"
                      >
                        <FiDollarSign size={14} />
                      </button>
                      {isAdmin && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleTerminate(employee._id)}
                          title="Terminate Employee"
                        >
                          <FiUserX size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={closeModal} style={modalStyles.closeButton}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="modal-scroll" style={{ 
                padding: '20px', 
                flex: '1 1 auto', 
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 300px)',
                scrollBehavior: 'smooth',
                minHeight: '300px'
              }}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">First Name <span style={{color: 'red'}}>*</span></label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        placeholder="Enter first name"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Last Name <span style={{color: 'red'}}>*</span></label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Email <span style={{color: 'red'}}>*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Phone <span style={{color: 'red'}}>*</span></label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Username <span style={{color: 'red'}}>*</span></label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        placeholder="e.g., john.doe, mary_smith"
                        minLength="3"
                      />
                      <small className="form-text text-muted">
                        Must be unique. Employee will use this to login. No spaces allowed.
                      </small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">
                        Password {!editingEmployee && <span style={{color: 'red'}}>*</span>}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="form-control"
                        required={!editingEmployee}
                        placeholder={editingEmployee ? "Leave empty to keep current password" : "Minimum 6 characters"}
                        minLength="6"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Position <span style={{color: 'red'}}>*</span></label>
                      <select
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      >
                        <option value="">Select Position</option>
                        {positions.map(pos => (
                          <option key={pos} value={pos}>
                            {pos.replace('_', ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Department <span style={{color: 'red'}}>*</span></label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>
                            {dept.replace('_', ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Hire Date <span style={{color: 'red'}}>*</span></label>
                      <input
                        type="date"
                        name="hireDate"
                        value={formData.hireDate}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Base Salary (Annual) - Taka <span style={{color: 'red'}}>*</span></label>
                      <input
                        type="number"
                        name="baseSalary"
                        value={formData.baseSalary}
                        onChange={handleInputChange}
                        className="form-control"
                        min="0"
                        placeholder="0 (Commission based)"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Commission Per Order (৳)</label>
                      <input
                        type="number"
                        name="commissionPerOrder"
                        value={formData.commissionPerOrder}
                        onChange={handleInputChange}
                        className="form-control"
                        min="0"
                        step="1"
                        placeholder="e.g., 20, 30"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <div style={{ 
                        padding: '15px', 
                        backgroundColor: '#e8f5e8', 
                        border: '1px solid #28a745', 
                        borderRadius: '5px',
                        textAlign: 'center'
                      }}>
                        <h5 style={{ color: '#28a745', margin: '0' }}>
                          💰 Salary Structure: Custom Commission Per Order
                        </h5>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#155724' }}>
                          Each employee earns a custom amount (e.g., 20-30 taka) for every order they process
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={modalStyles.footer}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModal}
                  style={{
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Salary Modal */}
      {showSalaryModal && selectedEmployee && salaryData && (
        <>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div style={modalStyles.overlay}>
            <div style={modalStyles.salaryModal}>
            <div style={modalStyles.header}>
              <h3>Salary Details - {selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
              <button onClick={() => setShowSalaryModal(false)} style={modalStyles.closeButton}>×</button>
            </div>
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              {/* Employee Info */}
              <div className="card mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                <div style={{ padding: '15px' }}>
                  <div className="row">
                    <div className="col-md-6">
                      <h5>{selectedEmployee.firstName} {selectedEmployee.lastName}</h5>
                      <p className="mb-1"><strong>Position:</strong> {selectedEmployee.position.replace('_', ' ')}</p>
                      <p className="mb-1"><strong>Commission Rate:</strong> ৳{selectedEmployee.commissionPerOrder || 0} per order</p>
                    </div>
                    <div className="col-md-6">
                      <div style={{ textAlign: 'right' }}>
                        <h4 style={{ color: '#28a745', margin: '0' }}>
                          Total Orders: {salaryData.orderCount}
                        </h4>
                        <h4 style={{ color: '#17a2b8', margin: '5px 0' }}>
                          Unpaid Orders: {salaryData.commissionEligibleOrderCount !== undefined ? salaryData.commissionEligibleOrderCount : salaryData.orderCount}
                        </h4>
                        <h3 style={{ color: '#007bff', margin: '10px 0' }}>
                          Unpaid Commission: {formatCurrency(salaryData.totalCommission)}
                        </h3>
                        {salaryData.commissionPaidDate && (
                          <p style={{ color: '#6c757d', fontSize: '0.9em', margin: '5px 0' }}>
                            Last Reset: {new Date(salaryData.commissionPaidDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <h4>Order History</h4>
              {salaryData.orders && salaryData.orders.length > 0 ? (
                <div style={{ 
                  overflowX: 'auto', 
                  maxWidth: '100%',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  marginTop: '15px',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
                }}>
                  <table className="table table-sm" style={{ margin: 0, minWidth: '600px' }}>
                    <thead>
                      <tr style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                      }}>
                        <th style={{ 
                          padding: '15px 12px', 
                          fontSize: '14px', 
                          fontWeight: '800', 
                          color: 'white', 
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                          borderBottom: 'none'
                        }}>📋 Order #</th>
                        <th style={{ 
                          padding: '15px 12px', 
                          fontSize: '14px', 
                          fontWeight: '800', 
                          color: 'white', 
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                          borderBottom: 'none'
                        }}>👤 Customer</th>
                        <th style={{ 
                          padding: '15px 12px', 
                          fontSize: '14px', 
                          fontWeight: '800', 
                          color: 'white', 
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                          borderBottom: 'none'
                        }}>📅 Date</th>
                        <th style={{ 
                          padding: '15px 12px', 
                          fontSize: '14px', 
                          fontWeight: '800', 
                          color: 'white', 
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                          borderBottom: 'none'
                        }}>📦 Items</th>
                        <th style={{ 
                          padding: '15px 12px', 
                          fontSize: '14px', 
                          fontWeight: '800', 
                          color: 'white', 
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                          borderBottom: 'none'
                        }}>💰 Total</th>
                        <th style={{ 
                          padding: '15px 12px', 
                          fontSize: '14px', 
                          fontWeight: '800', 
                          color: 'white', 
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                          borderBottom: 'none'
                        }}>💵 Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryData.orders.map((order, index) => (
                        <tr key={index} style={{
                          backgroundColor: index % 2 === 0 ? 'rgba(102, 126, 234, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.15)';
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'rgba(102, 126, 234, 0.05)' : 'rgba(255, 255, 255, 0.9)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}>
                          <td style={{ 
                            padding: '12px 10px', 
                            fontWeight: '700', 
                            fontSize: '13px', 
                            color: '#667eea',
                            borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                          }}>{order.orderNumber}</td>
                          <td style={{ 
                            padding: '12px 10px', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                          }}>{order.customerName}</td>
                          <td style={{ 
                            padding: '12px 10px', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#4a5568',
                            borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                          }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td style={{ 
                            padding: '12px 10px', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#805ad5',
                            borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                          }}>
                            <span style={{
                              background: 'linear-gradient(135deg, #805ad5, #9f7aea)',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              {order.items.length} items
                            </span>
                          </td>
                          <td style={{ 
                            padding: '12px 10px', 
                            fontSize: '13px', 
                            fontWeight: '700', 
                            color: '#38a169',
                            borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                          }}>{formatCurrency(order.total)}</td>
                          <td style={{ 
                            padding: '12px 10px', 
                            fontWeight: '800', 
                            fontSize: '14px',
                            borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
                          }}>
                            <span style={{
                              background: 'linear-gradient(135deg, #48bb78, #38a169)',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '15px',
                              fontSize: '12px',
                              fontWeight: '700',
                              boxShadow: '0 2px 8px rgba(56, 161, 105, 0.3)'
                            }}>
                              ৳{selectedEmployee.commissionPerOrder || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center" style={{ padding: '40px' }}>
                  <FiDollarSign size={60} color="#6c757d" style={{ marginBottom: '20px' }} />
                  <h5>No orders found</h5>
                  <p>This employee hasn't processed any orders yet.</p>
                </div>
              )}
            </div>
            <div style={modalStyles.footer}>
              {isAdmin && (
                <button 
                  className="btn btn-warning mr-3" 
                  onClick={handleResetCommission}
                  disabled={resettingCommission}
                  style={{
                    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                    border: 'none',
                    color: '#333',
                    fontWeight: '700',
                    boxShadow: '0 4px 15px rgba(255, 154, 158, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  title="Reset unpaid commission to ৳0 while preserving order history and employee assignments"
                >
                  <FiRefreshCw 
                    size={16} 
                    style={{ 
                      marginRight: '8px',
                      animation: resettingCommission ? 'spin 1s linear infinite' : 'none'
                    }} 
                  />
                  {resettingCommission ? 'Resetting...' : 'Reset Commission'}
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowSalaryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1050,
    padding: '100px 20px 20px 20px',
    overflowY: 'auto',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: 'calc(100vh - 120px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
  },
  salaryModal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: 'calc(100vh - 120px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e9ecef',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'flex-end',
    flexShrink: 0,
    backgroundColor: 'rgba(248, 249, 250, 0.95)',
    backdropFilter: 'blur(10px)',
    gap: '10px'
  },
};

export default Employees;
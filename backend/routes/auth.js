const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const { auth, adminAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Admin signup (only for initial setup or super admin)
router.post('/admin/signup', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role = 'admin' } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Admin with this email or username already exists' 
      });
    }

    // Create new admin
    const admin = new Admin({
      username,
      email,
      password,
      firstName,
      lastName,
      role
    });

    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin created successfully',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ message: 'Server error during admin signup' });
  }
});

// Unified login - checks admin first, then employee
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // First check if this is the admin account
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (admin) {
      // Check admin password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate JWT token for admin
      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Admin login successful',
        token,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role
        }
      });
    }

    // If not admin, check employee accounts
    const employee = await Employee.findOne({ email: email.toLowerCase() });

    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!employee.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check employee password
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    employee.lastLogin = new Date();
    await employee.save();

    // Generate JWT token for employee
    const token = jwt.sign(
      { id: employee._id, role: 'employee' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Employee login successful',
      token,
      user: {
        id: employee._id,
        username: employee.username,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        department: employee.department,
        role: 'employee'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Unified signup - creates employee accounts
router.post('/signup', async (req, res) => {
  try {
    const { 
      email, password, firstName, lastName, 
      phone, position, department 
    } = req.body;

    // Check if user already exists (both admin and employee)
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    
    if (existingAdmin || existingEmployee) {
      return res.status(400).json({ 
        message: 'An account with this email already exists' 
      });
    }

    // Generate username from email
    const username = email.split('@')[0] + '_' + Date.now();

    // Create new employee account
    const employee = new Employee({
      username,
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone: phone || '',
      position: position || 'sales_associate',
      department: department || 'sales',
      baseSalary: 25000, // Default base salary
      commissionPerOrder: 50, // Default commission per order
      hireDate: new Date()
    });

    await employee.save();

    // Generate JWT token for the new employee
    const token = jwt.sign(
      { id: employee._id, role: 'employee' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Employee account created successfully',
      token,
      user: {
        id: employee._id,
        username: employee.username,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        department: employee.department,
        role: 'employee'
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Legacy employee login (for backwards compatibility)
router.post('/employee/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find employee by username or email
    const employee = await Employee.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!employee.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    employee.lastLogin = new Date();
    await employee.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: employee._id, role: 'employee' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: employee._id,
        username: employee.username,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        department: employee.department,
        role: 'employee'
      }
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: req.user,
      role: req.userRole
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update employee profile (employee can update their own profile)
router.put('/employee/profile', auth, async (req, res) => {
  try {
    if (req.userRole !== 'employee') {
      return res.status(403).json({ message: 'Employee access required' });
    }

    const { firstName, lastName, phone, salaryToggle } = req.body;
    
    const employee = await Employee.findById(req.user._id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update allowed fields
    if (firstName) employee.firstName = firstName;
    if (lastName) employee.lastName = lastName;
    if (phone) employee.phone = phone;
    if (typeof salaryToggle === 'boolean') employee.salaryToggle = salaryToggle;

    await employee.save();

    res.json({
      message: 'Profile updated successfully',
      employee: {
        id: employee._id,
        username: employee.username,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        salaryToggle: employee.salaryToggle
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', auth, async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;
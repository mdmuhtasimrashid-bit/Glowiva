const express = require('express');
const Employee = require('../models/Employee');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get all employees (accessible by both admin and employees)
router.get('/', auth, async (req, res) => {
  try {
    const { department, position, isActive } = req.query;
    let filter = {};
    
    if (department) filter.department = department;
    if (position) filter.position = position;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single employee
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new employee (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    console.log('Employee creation request:', req.body);
    console.log('User role:', req.userRole);
    
    // Validate required fields
    const { firstName, lastName, email, username, password, phone, position, department, hireDate } = req.body;
    
    if (!firstName || !lastName || !email || !username || !password || !phone || !position || !department || !hireDate) {
      return res.status(400).json({ 
        message: 'All required fields must be provided: firstName, lastName, email, username, password, phone, position, department, hireDate' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const employee = new Employee(req.body);
    const savedEmployee = await employee.save();
    
    console.log('Employee created successfully:', savedEmployee._id);
    res.status(201).json(savedEmployee);
  } catch (error) {
    console.error('Employee creation error:', error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      res.status(400).json({ message: `${duplicateField} already exists` });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Update employee (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    console.log('Employee update request:', req.params.id, req.body);
    console.log('User role:', req.userRole);
    
    // If password is being updated, validate it
    if (req.body.password && req.body.password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    console.log('Employee updated successfully');
    res.json(employee);
  } catch (error) {
    console.error('Employee update error:', error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      res.status(400).json({ message: `${duplicateField} already exists` });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Terminate employee (admin only)
router.patch('/:id/terminate', adminAuth, async (req, res) => {
  try {
    console.log('Terminate request received for employee ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('User role:', req.userRole);
    
    const { terminationDate } = req.body;
    
    // Use findByIdAndUpdate to avoid validation issues
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
        terminationDate: terminationDate || new Date()
      },
      { new: true, runValidators: false } // Disable validators to avoid username/password validation
    );
    
    if (!employee) {
      console.log('Employee not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    console.log('Employee terminated successfully:', employee.fullName);
    res.json(employee);
  } catch (error) {
    console.error('Employee termination error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Calculate employee salary for a specific month
router.get('/:id/salary/:year/:month', async (req, res) => {
  try {
    const { id, year, month } = req.params;
    const employee = await Employee.findById(id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Get orders assigned to this employee for commission calculation
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Count orders assigned to this employee
    const orderCount = await Order.countDocuments({
      employee: id,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Get the orders for detailed view
    const orders = await Order.find({
      employee: id,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('items.product', 'name');
    
    const baseSalary = employee.baseSalary / 12;
    const commissionAmount = orderCount * (employee.commissionPerOrder || 0);
    const totalSalary = baseSalary + commissionAmount;
    
    res.json({
      employee: {
        id: employee._id,
        name: employee.fullName,
        position: employee.position,
        department: employee.department
      },
      period: { year: parseInt(year), month: parseInt(month) },
      baseSalary,
      commissionPerOrder: employee.commissionPerOrder || 0,
      orderCount,
      commissionAmount,
      totalSalary,
      orders: orders.map(order => ({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        total: order.total,
        date: order.createdAt,
        items: order.items.length
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders for a specific employee
router.get('/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;
    
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    let filter = { employee: id };
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await Order.find(filter)
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Calculate commission only for orders after the last commission reset date
    let commissionEligibleOrders = orders;
    if (employee.commissionPaidDate) {
      commissionEligibleOrders = orders.filter(order => 
        new Date(order.createdAt) > new Date(employee.commissionPaidDate)
      );
    }
      
    const totalCommission = commissionEligibleOrders.length * (employee.commissionPerOrder || 0);
    
    res.json({
      employee: {
        id: employee._id,
        name: employee.fullName,
        commissionPerOrder: employee.commissionPerOrder || 0,
        commissionPaidDate: employee.commissionPaidDate
      },
      orderCount: orders.length,
      commissionEligibleOrderCount: commissionEligibleOrders.length,
      totalCommission,
      commissionPaidDate: employee.commissionPaidDate,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get salary summary for all employees for a specific month
router.get('/salary-summary/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const employees = await Employee.find({ isActive: true });
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' }
        }
      }
    ]);
    
    const monthlySales = salesData[0]?.totalSales || 0;
    const salaryDetails = [];
    let totalSalaryExpense = 0;
    
    for (const employee of employees) {
      const baseSalary = employee.baseSalary / 12;
      const commissionAmount = (monthlySales * employee.commission) / 100;
      const totalSalary = baseSalary + commissionAmount;
      
      salaryDetails.push({
        employee: {
          id: employee._id,
          name: employee.fullName,
          position: employee.position,
          department: employee.department
        },
        baseSalary,
        commissionAmount,
        totalSalary
      });
      
      totalSalaryExpense += totalSalary;
    }
    
    res.json({
      period: { year: parseInt(year), month: parseInt(month) },
      monthlySales,
      totalEmployees: employees.length,
      totalSalaryExpense,
      salaryDetails
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset employee commission (admin only) - sets commission paid date to track reset point
router.post('/:id/reset-commission', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Commission reset request for employee ID:', id);
    console.log('User role:', req.userRole);
    
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Set commission paid date to current date to mark reset point
    // This preserves order history while resetting future commission calculations
    const resetDate = new Date();
    await Employee.findByIdAndUpdate(id, {
      commissionPaidDate: resetDate
    });
    
    // Count orders that were assigned to this employee (for reporting)
    const orderCount = await Order.countDocuments({ employee: id });
    
    console.log(`Reset commission for ${employee.fullName}: Commission reset to date ${resetDate.toISOString()}`);
    
    res.json({
      message: `Commission reset successfully for ${employee.fullName}`,
      resetDate: resetDate,
      totalOrdersKept: orderCount,
      employee: {
        id: employee._id,
        name: employee.fullName
      }
    });
  } catch (error) {
    console.error('Commission reset error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get employee meta data
router.get('/meta/positions', (req, res) => {
  const positions = ['manager', 'sales_associate', 'inventory_clerk', 'customer_service', 'admin', 'other'];
  res.json(positions);
});

router.get('/meta/departments', (req, res) => {
  const departments = ['sales', 'inventory', 'customer_service', 'administration', 'marketing', 'other'];
  res.json(departments);
});

module.exports = router;
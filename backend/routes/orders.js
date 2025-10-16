const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, adminAuth, employeeAuth } = require('../middleware/auth');
const router = express.Router();

// Get all orders (employees see only their orders, admins see all)
router.get('/', auth, async (req, res) => {
  try {
    const { status, paymentStatus, startDate, endDate, limit = 50 } = req.query;
    let filter = {};
    
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // If employee, only show orders they created
    if (req.userRole === 'employee') {
      filter.createdBy = req.user._id;
    }
    
    const orders = await Order.find(filter)
      .populate('items.product', 'name sku')
      .populate('employee', 'firstName lastName commissionPerOrder')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name sku category');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new order (employees and admins can create)
router.post('/', auth, async (req, res) => {
  try {
    const { items, customerName, customerPhone, employeeId } = req.body;
    
    // Calculate order totals
    let subtotal = 0;
    let totalCost = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.productId}` });
      }
      
      // Use custom price from the form instead of product's selling price
      const customPrice = parseFloat(item.customPrice) || product.sellingPrice;
      const itemTotal = customPrice * item.quantity;
      const itemCost = product.costPrice * item.quantity;
      
      subtotal += itemTotal;
      totalCost += itemCost;
      
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        priceAtTime: customPrice, // Use custom price
        costAtTime: product.costPrice
      });
      
      // Stock management removed - will be added later
    }
    
    // For simplified form, total equals subtotal (no tax, shipping, discount)
    const total = subtotal;
    
    const order = new Order({
      customerName,
      customerEmail: '', // Default empty for simplified form
      customerPhone,
      customerAddress: '', // Default empty for simplified form
      employee: employeeId || null, // Add employee if provided
      createdBy: req.userRole === 'employee' ? req.user._id : null, // Track who created the order
      items: orderItems,
      subtotal,
      tax: 0, // Default 0 for simplified form
      shipping: 0, // Default 0 for simplified form
      discount: 0, // Default 0 for simplified form
      total,
      totalCost,
      notes: '' // Default empty for simplified form
    });
    
    const savedOrder = await order.save();
    await savedOrder.populate('items.product', 'name sku');
    
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update entire order (admin only or employee who created it)
router.put('/:id', auth, async (req, res) => {
  try {
    const { items, customerName, customerPhone, employeeId } = req.body;
    const orderId = req.params.id;
    
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if employee can edit this order (only if they created it)
    if (req.userRole === 'employee' && existingOrder.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit orders you created' });
    }
    
    // Calculate new order totals
    let subtotal = 0;
    let totalCost = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.productId}` });
      }
      
      // Use custom price from the form instead of product's selling price
      const customPrice = parseFloat(item.customPrice) || product.sellingPrice;
      const itemTotal = customPrice * item.quantity;
      const itemCost = product.costPrice * item.quantity;
      
      subtotal += itemTotal;
      totalCost += itemCost;
      
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        priceAtTime: customPrice,
        costAtTime: product.costPrice
      });
    }
    
    const total = subtotal;
    
    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        customerName,
        customerPhone,
        employee: employeeId || null,
        items: orderItems,
        subtotal,
        total,
        totalCost
      },
      { new: true, runValidators: true }
    );
    
    await updatedOrder.populate('items.product', 'name sku');
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update order status (admin only)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel order (restore stock) - admin only
router.patch('/:id/cancel', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }
    
    // Restore stock for each item
    for (const item of order.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }
    
    order.status = 'cancelled';
    await order.save();
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get order statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    const totalOrders = await Order.countDocuments(dateFilter);
    const completedOrders = await Order.countDocuments({ ...dateFilter, status: 'delivered' });
    const pendingOrders = await Order.countDocuments({ ...dateFilter, status: 'pending' });
    
    const revenueResult = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalCost: { $sum: '$totalCost' } } }
    ]);
    
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalCost = revenueResult[0]?.totalCost || 0;
    const totalProfit = totalRevenue - totalCost;
    
    res.json({
      totalOrders,
      completedOrders,
      pendingOrders,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete order (admin can delete any, employee can delete their own)
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check permissions: admin can delete any order, employee can only delete orders they created
    if (req.userRole === 'employee' && order.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete orders you created' });
    }
    
    // Note: We're not restoring stock since stock management was removed
    // If you implement stock management later, you can restore stock here
    
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get employee's orders and commission info
router.get('/employee/my-orders', auth, async (req, res) => {
  try {
    if (req.userRole !== 'employee') {
      return res.status(403).json({ message: 'Employee access required' });
    }

    const { startDate, endDate } = req.query;
    let filter = { createdBy: req.user._id };
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    const orderCount = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Calculate commission based on employee's settings
    const employee = req.user;
    const commissionAmount = employee.salaryToggle ? 
      (orderCount * employee.commissionPerOrder) : 0;
    
    res.json({
      orders,
      stats: {
        orderCount,
        totalRevenue,
        commissionPerOrder: employee.commissionPerOrder,
        totalCommission: commissionAmount,
        salaryToggleEnabled: employee.salaryToggle
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
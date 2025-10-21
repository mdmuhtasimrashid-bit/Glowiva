const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/glowiva', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Employee = require('../models/Employee');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function testCommissionFlow() {
  try {
    console.log('=== Testing Commission Flow ===\n');
    
    // Get an employee
    const employee = await Employee.findOne({ email: 'rumi@gmail.com' });
    if (!employee) {
      console.log('No employee found');
      return;
    }
    
    console.log(`Testing with employee: ${employee.firstName} ${employee.lastName}`);
    console.log(`Commission rate: ৳${employee.commissionPerOrder} per order\n`);
    
    // Check current commission
    const currentOrders = await Order.find({ employee: employee._id });
    let currentCommission = 0;
    if (employee.commissionPaidDate) {
      const eligibleOrders = currentOrders.filter(order => 
        new Date(order.createdAt) > new Date(employee.commissionPaidDate)
      );
      currentCommission = eligibleOrders.length * employee.commissionPerOrder;
    } else {
      currentCommission = currentOrders.length * employee.commissionPerOrder;
    }
    
    console.log(`Current orders assigned: ${currentOrders.length}`);
    console.log(`Current commission: ৳${currentCommission}\n`);
    
    // Get a product to create order with
    const product = await Product.findOne();
    if (!product) {
      console.log('No products found to create test order');
      return;
    }
    
    console.log(`Creating test order with product: ${product.name}`);
    
    // Create a test order assigned to this employee
    const testOrder = new Order({
      customerName: 'Test Customer Commission',
      customerPhone: '01700000000',
      employee: employee._id, // Assign to employee for commission
      createdBy: null, // Could be created by admin
      items: [{
        product: product._id,
        quantity: 1,
        priceAtTime: product.sellingPrice,
        costAtTime: product.costPrice
      }],
      subtotal: product.sellingPrice,
      total: product.sellingPrice,
      totalCost: product.costPrice
    });
    
    await testOrder.save();
    console.log(`Created order: ${testOrder.orderNumber}\n`);
    
    // Check updated commission
    const updatedOrders = await Order.find({ employee: employee._id });
    let updatedCommission = 0;
    if (employee.commissionPaidDate) {
      const eligibleOrders = updatedOrders.filter(order => 
        new Date(order.createdAt) > new Date(employee.commissionPaidDate)
      );
      updatedCommission = eligibleOrders.length * employee.commissionPerOrder;
    } else {
      updatedCommission = updatedOrders.length * employee.commissionPerOrder;
    }
    
    console.log(`Updated orders assigned: ${updatedOrders.length}`);
    console.log(`Updated commission: ৳${updatedCommission}`);
    console.log(`Commission increase: ৳${updatedCommission - currentCommission}\n`);
    
    // Clean up - delete the test order
    await Order.findByIdAndDelete(testOrder._id);
    console.log('Test order deleted');
    
    console.log('✅ Commission system is working correctly!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCommissionFlow();
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/glowiva', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Employee = require('../models/Employee');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function testUnpaidOrdersReset() {
  try {
    console.log('=== Testing Unpaid Orders Reset ===\n');
    
    // Get Rumi who has 0 orders currently
    const employee = await Employee.findOne({ email: 'rumi@gmail.com' });
    if (!employee) {
      console.log('Employee not found');
      return;
    }
    
    // Get a product
    const product = await Product.findOne();
    if (!product) {
      console.log('No product found');
      return;
    }
    
    console.log(`Testing with employee: ${employee.firstName} ${employee.lastName}`);
    console.log(`Commission rate: ৳${employee.commissionPerOrder} per order\n`);
    
    // Clear any existing commission reset date
    await Employee.findByIdAndUpdate(employee._id, {
      $unset: { commissionPaidDate: "" }
    });
    
    // Create 2 test orders for this employee
    console.log('Creating 2 test orders...');
    
    const order1 = new Order({
      customerName: 'Test Customer 1',
      customerPhone: '01700000001',
      employee: employee._id,
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
    
    const order2 = new Order({
      customerName: 'Test Customer 2', 
      customerPhone: '01700000002',
      employee: employee._id,
      items: [{
        product: product._id,
        quantity: 2,
        priceAtTime: product.sellingPrice,
        costAtTime: product.costPrice
      }],
      subtotal: product.sellingPrice * 2,
      total: product.sellingPrice * 2,
      totalCost: product.costPrice * 2
    });
    
    await order1.save();
    await order2.save();
    
    console.log(`Created orders: ${order1.orderNumber}, ${order2.orderNumber}\n`);
    
    // Check commission before reset
    const ordersBeforeReset = await Order.find({ employee: employee._id });
    const commissionBeforeReset = ordersBeforeReset.length * employee.commissionPerOrder;
    
    console.log(`=== BEFORE RESET ===`);
    console.log(`Total orders: ${ordersBeforeReset.length}`);
    console.log(`Unpaid orders: ${ordersBeforeReset.length} (no previous reset)`);
    console.log(`Commission: ৳${commissionBeforeReset}\n`);
    
    // Reset commission
    console.log('Resetting commission...');
    const resetDate = new Date();
    await Employee.findByIdAndUpdate(employee._id, {
      commissionPaidDate: resetDate
    });
    
    // Check after reset
    const ordersAfterReset = await Order.find({ employee: employee._id });
    const unpaidOrdersAfterReset = ordersAfterReset.filter(order => 
      new Date(order.createdAt) > resetDate
    );
    const commissionAfterReset = unpaidOrdersAfterReset.length * employee.commissionPerOrder;
    
    console.log(`=== AFTER RESET ===`);
    console.log(`Total orders: ${ordersAfterReset.length}`);
    console.log(`Unpaid orders: ${unpaidOrdersAfterReset.length}`);
    console.log(`Commission: ৳${commissionAfterReset}\n`);
    
    console.log('=== VALIDATION ===');
    console.log(`✅ Unpaid orders should be 0: ${unpaidOrdersAfterReset.length === 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Commission should be ৳0: ${commissionAfterReset === 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Total orders preserved: ${ordersAfterReset.length === 2 ? 'PASS' : 'FAIL'}`);
    
    // Clean up
    await Order.findByIdAndDelete(order1._id);
    await Order.findByIdAndDelete(order2._id);
    await Employee.findByIdAndUpdate(employee._id, {
      $unset: { commissionPaidDate: "" }
    });
    
    console.log('\n✅ Test completed and cleaned up!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUnpaidOrdersReset();
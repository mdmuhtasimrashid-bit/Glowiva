const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/glowiva', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Employee = require('../models/Employee');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function fullCommissionTest() {
  try {
    console.log('=== COMPREHENSIVE COMMISSION RESET TEST ===\n');
    
    // Get Bushra who has 0 orders
    const employee = await Employee.findOne({ email: 'bushra@gmail.com' });
    const product = await Product.findOne();
    
    if (!employee || !product) {
      console.log('Required data not found');
      return;
    }
    
    console.log(`Testing employee: ${employee.firstName} ${employee.lastName}`);
    console.log(`Commission rate: ৳${employee.commissionPerOrder}\n`);
    
    // Ensure clean state
    await Order.deleteMany({ employee: employee._id });
    await Employee.findByIdAndUpdate(employee._id, { $unset: { commissionPaidDate: "" } });
    
    // Step 1: Create 3 orders
    console.log('STEP 1: Creating 3 orders for the employee');
    const orders = [];
    for (let i = 1; i <= 3; i++) {
      const order = new Order({
        customerName: `Customer ${i}`,
        customerPhone: `0170000000${i}`,
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
      await order.save();
      orders.push(order);
    }
    
    console.log(`Created 3 orders\n`);
    
    // Step 2: Check commission before reset
    console.log('STEP 2: Checking commission before reset');
    const ordersBeforeReset = await Order.find({ employee: employee._id });
    const commissionBeforeReset = ordersBeforeReset.length * employee.commissionPerOrder;
    
    console.log(`Total orders: ${ordersBeforeReset.length}`);
    console.log(`Commission eligible orders: ${ordersBeforeReset.length} (no reset yet)`);
    console.log(`Total commission: ৳${commissionBeforeReset}\n`);
    
    // Step 3: Reset commission
    console.log('STEP 3: Resetting commission');
    const resetDate = new Date();
    await Employee.findByIdAndUpdate(employee._id, {
      commissionPaidDate: resetDate
    });
    console.log(`Reset date set to: ${resetDate.toISOString()}\n`);
    
    // Step 4: Check commission after reset  
    console.log('STEP 4: Checking commission after reset');
    const ordersAfterReset = await Order.find({ employee: employee._id });
    const commissionEligibleAfterReset = ordersAfterReset.filter(order => 
      new Date(order.createdAt) > resetDate
    );
    const commissionAfterReset = commissionEligibleAfterReset.length * employee.commissionPerOrder;
    
    console.log(`Total orders: ${ordersAfterReset.length} (preserved)`);
    console.log(`Commission eligible orders: ${commissionEligibleAfterReset.length} (should be 0)`);
    console.log(`Total commission: ৳${commissionAfterReset} (should be ৳0)\n`);
    
    // Step 5: Create new order after reset
    console.log('STEP 5: Creating new order after reset');
    const newOrder = new Order({
      customerName: 'New Customer Post Reset',
      customerPhone: '01700000004',
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
    await newOrder.save();
    
    // Step 6: Check commission after new order
    console.log('STEP 6: Checking commission after new order');
    const finalOrders = await Order.find({ employee: employee._id });
    const finalCommissionEligible = finalOrders.filter(order => 
      new Date(order.createdAt) > resetDate
    );
    const finalCommission = finalCommissionEligible.length * employee.commissionPerOrder;
    
    console.log(`Total orders: ${finalOrders.length}`);
    console.log(`Commission eligible orders: ${finalCommissionEligible.length} (should be 1)`);
    console.log(`Total commission: ৳${finalCommission} (should be ৳${employee.commissionPerOrder})\n`);
    
    // Validation
    console.log('=== VALIDATION RESULTS ===');
    console.log(`✅ Before reset - Commission ৳${commissionBeforeReset}: ${commissionBeforeReset === (3 * employee.commissionPerOrder) ? 'PASS' : 'FAIL'}`);
    console.log(`✅ After reset - Commission ৳0: ${commissionAfterReset === 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ After reset - Eligible orders 0: ${commissionEligibleAfterReset.length === 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ After new order - Commission ৳${employee.commissionPerOrder}: ${finalCommission === employee.commissionPerOrder ? 'PASS' : 'FAIL'}`);
    console.log(`✅ After new order - Eligible orders 1: ${finalCommissionEligible.length === 1 ? 'PASS' : 'FAIL'}`);
    
    // Clean up
    await Order.deleteMany({ employee: employee._id });
    await Employee.findByIdAndUpdate(employee._id, { $unset: { commissionPaidDate: "" } });
    
    console.log('\n✅ Test completed and database cleaned up!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fullCommissionTest();
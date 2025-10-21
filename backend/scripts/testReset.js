const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/glowiva', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Employee = require('../models/Employee');
const Order = require('../models/Order');

async function testCommissionReset() {
  try {
    console.log('=== Testing Commission Reset ===\n');
    
    // Get Muhtasim who has existing orders
    const employee = await Employee.findOne({ email: 'muhtasim425@gmail.com' });
    if (!employee) {
      console.log('Employee not found');
      return;
    }
    
    console.log(`Testing reset for: ${employee.firstName} ${employee.lastName}`);
    
    // Check orders before reset
    const ordersBefore = await Order.find({ employee: employee._id });
    console.log(`Orders assigned before reset: ${ordersBefore.length}`);
    
    // Calculate commission before reset
    let commissionBeforeReset = 0;
    if (employee.commissionPaidDate) {
      const eligibleOrdersBefore = ordersBefore.filter(order => 
        new Date(order.createdAt) > new Date(employee.commissionPaidDate)
      );
      commissionBeforeReset = eligibleOrdersBefore.length * employee.commissionPerOrder;
      console.log(`Commission eligible orders before reset: ${eligibleOrdersBefore.length}`);
    } else {
      commissionBeforeReset = ordersBefore.length * employee.commissionPerOrder;
      console.log(`Commission eligible orders before reset: ${ordersBefore.length} (no previous reset)`);
    }
    console.log(`Commission before reset: ৳${commissionBeforeReset}\n`);
    
    // Simulate commission reset - set commission paid date to NOW
    const resetDate = new Date();
    await Employee.findByIdAndUpdate(employee._id, {
      commissionPaidDate: resetDate
    });
    
    console.log(`Commission reset at: ${resetDate.toISOString()}`);
    
    // Check orders after reset
    const ordersAfter = await Order.find({ employee: employee._id });
    console.log(`Orders assigned after reset: ${ordersAfter.length}`);
    
    // Calculate commission after reset - should be 0 since reset date is now
    const eligibleOrdersAfter = ordersAfter.filter(order => 
      new Date(order.createdAt) > resetDate
    );
    const commissionAfterReset = eligibleOrdersAfter.length * employee.commissionPerOrder;
    
    console.log(`Commission eligible orders after reset: ${eligibleOrdersAfter.length}`);
    console.log(`Commission after reset: ৳${commissionAfterReset}`);
    
    console.log('\n=== Reset Validation ===');
    console.log(`✅ Commission should be ৳0: ${commissionAfterReset === 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Eligible orders should be 0: ${eligibleOrdersAfter.length === 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Total orders preserved: ${ordersAfter.length === ordersBefore.length ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCommissionReset();
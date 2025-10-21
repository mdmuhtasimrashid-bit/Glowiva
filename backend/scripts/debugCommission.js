const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/glowiva', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Employee = require('../models/Employee');
const Order = require('../models/Order');

async function debugCommission() {
  try {
    console.log('=== Commission Debug Script ===\n');
    
    // Get all employees
    const employees = await Employee.find({}).select('firstName lastName email commissionPerOrder commissionPaidDate');
    console.log(`Found ${employees.length} employees:`);
    employees.forEach(emp => {
      console.log(`- ${emp.firstName} ${emp.lastName} (${emp.email}) - Commission: ৳${emp.commissionPerOrder}`);
    });
    
    console.log('\n=== Order Analysis ===');
    
    // Get all orders
    const orders = await Order.find({}).populate('employee', 'firstName lastName').populate('createdBy', 'firstName lastName');
    console.log(`Found ${orders.length} orders total\n`);
    
    // Group orders by employee assignment
    for (const employee of employees) {
      console.log(`\n--- ${employee.firstName} ${employee.lastName} ---`);
      
      // Orders assigned to this employee (for commission)
      const assignedOrders = orders.filter(order => 
        order.employee && order.employee._id.toString() === employee._id.toString()
      );
      
      // Orders created by this employee
      const createdOrders = orders.filter(order => 
        order.createdBy && order.createdBy._id.toString() === employee._id.toString()
      );
      
      console.log(`Orders assigned (for commission): ${assignedOrders.length}`);
      console.log(`Orders created by employee: ${createdOrders.length}`);
      
      if (assignedOrders.length > 0) {
        console.log('Assigned orders:');
        assignedOrders.forEach(order => {
          console.log(`  - ${order.orderNumber}: ${order.customerName} (৳${order.total})`);
        });
      }
      
      if (createdOrders.length > 0) {
        console.log('Created orders:');
        createdOrders.forEach(order => {
          console.log(`  - ${order.orderNumber}: ${order.customerName} (৳${order.total})`);
        });
      }
      
      // Calculate commission
      let commissionEligibleOrders = assignedOrders;
      if (employee.commissionPaidDate) {
        commissionEligibleOrders = assignedOrders.filter(order => 
          new Date(order.createdAt) > new Date(employee.commissionPaidDate)
        );
        console.log(`Commission eligible orders (after reset): ${commissionEligibleOrders.length}`);
      }
      
      const totalCommission = commissionEligibleOrders.length * (employee.commissionPerOrder || 0);
      console.log(`Total commission: ৳${totalCommission}`);
    }
    
    console.log('\n=== Summary ===');
    const ordersWithEmployee = orders.filter(order => order.employee);
    const ordersWithoutEmployee = orders.filter(order => !order.employee);
    console.log(`Orders WITH employee assigned: ${ordersWithEmployee.length}`);
    console.log(`Orders WITHOUT employee assigned: ${ordersWithoutEmployee.length}`);
    
    if (ordersWithoutEmployee.length > 0) {
      console.log('\nOrders without employee assignment:');
      ordersWithoutEmployee.forEach(order => {
        console.log(`- ${order.orderNumber}: ${order.customerName} (created by: ${order.createdBy?.firstName || 'Unknown'})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugCommission();
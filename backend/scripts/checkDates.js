const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/glowiva', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Employee = require('../models/Employee');
const Order = require('../models/Order');

async function checkDates() {
  try {
    const muhtasim = await Employee.findOne({ email: 'muhtasim425@gmail.com' });
    if (muhtasim) {
      console.log(`Employee: ${muhtasim.firstName} ${muhtasim.lastName}`);
      console.log(`Commission Paid Date: ${muhtasim.commissionPaidDate}`);
      
      const orders = await Order.find({ employee: muhtasim._id });
      console.log(`\nOrders assigned to this employee:`);
      orders.forEach(order => {
        console.log(`Order: ${order.orderNumber}`);
        console.log(`Created: ${order.createdAt}`);
        console.log(`Commission Paid Date: ${muhtasim.commissionPaidDate}`);
        console.log(`Order created after reset: ${new Date(order.createdAt) > new Date(muhtasim.commissionPaidDate)}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkDates();
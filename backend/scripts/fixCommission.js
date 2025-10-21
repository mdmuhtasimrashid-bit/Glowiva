const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/glowiva', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Employee = require('../models/Employee');

async function fixCommission() {
  try {
    // Clear the commission reset date for all employees so their existing orders count
    const result = await Employee.updateMany({}, { 
      $unset: { commissionPaidDate: "" } 
    });
    
    console.log(`Updated ${result.modifiedCount} employees`);
    console.log('Commission reset dates cleared - all existing orders will now count toward commission');
    
    // Show updated employee info
    const employees = await Employee.find({}).select('firstName lastName commissionPaidDate');
    employees.forEach(emp => {
      console.log(`${emp.firstName} ${emp.lastName}: Commission reset date = ${emp.commissionPaidDate || 'None (all orders count)'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixCommission();
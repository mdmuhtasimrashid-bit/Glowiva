const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true,
    enum: ['manager', 'sales_associate', 'inventory_clerk', 'customer_service', 'admin', 'other']
  },
  department: {
    type: String,
    required: true,
    enum: ['sales', 'inventory', 'customer_service', 'administration', 'marketing', 'other']
  },
  baseSalary: {
    type: Number,
    required: true,
    min: 0
  },
  commissionPerOrder: {
    type: Number,
    default: 0,
    min: 0 // fixed amount in taka per order
  },
  hireDate: {
    type: Date,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  terminationDate: {
    type: Date,
    default: null
  },
  salaryToggle: {
    type: Boolean,
    default: true // Employee can enable/disable commission-based salary
  },
  lastLogin: {
    type: Date,
    default: null
  },
  commissionPaidDate: {
    type: Date,
    default: null // Track when commission was last reset/paid
  }
}, {
  timestamps: true
});

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate monthly salary with commission
employeeSchema.methods.calculateMonthlySalary = function(orderCount = 0) {
  const baseMonthly = this.baseSalary / 12;
  const commissionAmount = this.salaryToggle ? (orderCount * this.commissionPerOrder) : 0;
  return baseMonthly + commissionAmount;
};

module.exports = mongoose.model('Employee', employeeSchema);
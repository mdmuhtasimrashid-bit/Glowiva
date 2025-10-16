const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: 'No description provided'
  },
  category: {
    type: String,
    default: 'other',
    enum: ['serum', 'facewash', 'sunscreen', 'moisturizer', 'cleanser', 'toner', 'mask', 'foundation', 'lipstick', 'eyeshadow', 'mascara', 'blush', 'concealer', 'primer', 'setting_spray', 'treatment', 'other']
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  minStock: {
    type: Number,
    default: 10
  },
  sku: {
    type: String,
    default: '',
    sparse: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for profit calculation
productSchema.virtual('profit').get(function() {
  return this.sellingPrice - this.costPrice;
});

// Virtual for profit margin percentage
productSchema.virtual('profitMargin').get(function() {
  return ((this.sellingPrice - this.costPrice) / this.sellingPrice * 100).toFixed(2);
});

// Pre-save middleware to set defaults
productSchema.pre('save', function(next) {
  // Set selling price if not provided or is 0
  if ((!this.sellingPrice || this.sellingPrice === 0) && this.costPrice) {
    this.sellingPrice = this.costPrice * 1.5;
  }
  
  // Generate SKU if not provided
  if (!this.sku) {
    this.sku = 'PRD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  
  next();
});

// Method to check if product is low stock
productSchema.methods.isLowStock = function() {
  return this.stock <= this.minStock;
};

module.exports = mongoose.model('Product', productSchema);
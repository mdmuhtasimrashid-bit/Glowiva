const express = require('express');
const Product = require('../models/Product');
const { auth, adminAuth, employeeAuth } = require('../middleware/auth');
const router = express.Router();

// Get all products (employees see limited info, admins see everything)
router.get('/', auth, async (req, res) => {
  try {
    const { category, isActive, lowStock } = req.query;
    let filter = {};
    
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    let products = await Product.find(filter).sort({ createdAt: -1 });
    
    if (lowStock === 'true') {
      products = products.filter(product => product.isLowStock());
    }
    
    // If employee, hide cost price and only show selling price
    if (req.userRole === 'employee') {
      products = products.map(product => ({
        _id: product._id,
        name: product.name,
        description: product.description,
        category: product.category,
        sellingPrice: product.sellingPrice,
        stock: product.stock,
        sku: product.sku,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }));
    }
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new product (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    console.log('Received product data:', req.body);
    
    // Validate required fields
    if (!req.body.name || !req.body.costPrice) {
      return res.status(400).json({ 
        message: 'Name and cost price are required',
        received: req.body 
      });
    }

    // Generate unique SKU
    const generateSKU = () => {
      return 'PRD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    };

    const costPrice = parseFloat(req.body.costPrice);
    if (isNaN(costPrice) || costPrice < 0) {
      return res.status(400).json({ message: 'Invalid cost price' });
    }

    // Validate category if provided
    const validCategories = ['serum', 'facewash', 'sunscreen', 'moisturizer', 'cleanser', 'toner', 'mask', 'cream', 'eye_cream', 'vaseline', 'lip_balm', 'micellar_water', 'night_cream', 'oil', 'shampoo', 'lotion', 'peeling_gel', 'shower_gel', 'other'];
    if (req.body.category && !validCategories.includes(req.body.category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const productData = {
      name: req.body.name.trim(),
      imageUrl: req.body.imageUrl ? req.body.imageUrl.trim() : '',
      costPrice: costPrice,
      description: req.body.description || 'No description provided',
      category: req.body.category !== undefined ? req.body.category : 'other',
      sellingPrice: req.body.sellingPrice !== undefined ? parseFloat(req.body.sellingPrice) : (costPrice * 1.5), // Use provided price or 50% markup default
      stock: req.body.stock !== undefined ? parseInt(req.body.stock) : 0,
      minStock: parseInt(req.body.minStock) || 10,
      sku: generateSKU(),
      isActive: true
    };
    
    console.log('Creating product with data:', productData);
    
    const product = new Product(productData);
    const savedProduct = await product.save();
    
    console.log('Product saved successfully:', savedProduct);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Product creation error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'SKU already exists', error: error.message });
    } else if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Update product (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update stock (admin only)
router.patch('/:id/stock', adminAuth, async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (operation === 'add') {
      product.stock += quantity;
    } else if (operation === 'subtract') {
      product.stock = Math.max(0, product.stock - quantity);
    } else {
      product.stock = quantity;
    }
    
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get product categories
router.get('/meta/categories', (req, res) => {
  console.log('Categories API called - returning updated skincare categories');
  const categories = ['serum', 'facewash', 'sunscreen', 'moisturizer', 'cleanser', 'toner', 'mask', 'cream', 'eye_cream', 'vaseline', 'lip_balm', 'micellar_water', 'night_cream', 'oil', 'shampoo', 'lotion', 'peeling_gel', 'shower_gel', 'other'];
  res.json(categories);
});

module.exports = router;
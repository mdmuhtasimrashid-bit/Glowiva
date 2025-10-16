const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createInitialAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glowiva', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.username);
      process.exit(0);
    }

    // Create initial admin
    const admin = new Admin({
      username: 'glowiva_admin',
      email: 'admin@glowiva.com',
      password: 'GlowivaAdmin2024!',
      firstName: 'Glowiva',
      lastName: 'Administrator',
      role: 'super_admin'
    });

    await admin.save();
    console.log('Initial admin created successfully!');
    console.log('Email: admin@glowiva.com');
    console.log('Password: GlowivaAdmin2024!');
    console.log('This is the ADMIN account - anyone else will be treated as employee');

  } catch (error) {
    console.error('Error creating initial admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

createInitialAdmin();
const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// Dashboard summary
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Today's stats
    const todayOrders = await Order.countDocuments({ 
      createdAt: { $gte: startOfToday } 
    });
    
    const todayRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$total' }, cost: { $sum: '$totalCost' } } }
    ]);
    
    // Monthly stats
    const monthlyStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, 
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' }, 
          totalCost: { $sum: '$totalCost' } 
        } 
      }
    ]);
    
    // Yearly stats
    const yearlyStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, 
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' }, 
          totalCost: { $sum: '$totalCost' } 
        } 
      }
    ]);
    
    // Product stats
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({ 
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true 
    });
    
    // Employee count
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    
    const todayData = todayRevenue[0] || { total: 0, cost: 0 };
    const monthlyData = monthlyStats[0] || { totalOrders: 0, totalRevenue: 0, totalCost: 0 };
    const yearlyData = yearlyStats[0] || { totalOrders: 0, totalRevenue: 0, totalCost: 0 };
    
    res.json({
      today: {
        orders: todayOrders,
        revenue: todayData.total,
        profit: todayData.total - todayData.cost
      },
      monthly: {
        orders: monthlyData.totalOrders,
        revenue: monthlyData.totalRevenue,
        cost: monthlyData.totalCost,
        profit: monthlyData.totalRevenue - monthlyData.totalCost
      },
      yearly: {
        orders: yearlyData.totalOrders,
        revenue: yearlyData.totalRevenue,
        cost: yearlyData.totalCost,
        profit: yearlyData.totalRevenue - yearlyData.totalCost
      },
      inventory: {
        totalProducts,
        lowStockProducts
      },
      employees: {
        total: totalEmployees
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sales analytics by period
router.get('/sales', adminAuth, async (req, res) => {
  try {
    const { period = 'monthly', year, month } = req.query;
    let groupBy, matchCondition = {};
    
    if (year) {
      matchCondition.createdAt = { 
        $gte: new Date(year, 0, 1), 
        $lt: new Date(parseInt(year) + 1, 0, 1) 
      };
    }
    
    if (month && year) {
      matchCondition.createdAt = {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1)
      };
    }
    
    switch (period) {
      case 'daily':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'monthly':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      case 'yearly':
        groupBy = {
          year: { $year: '$createdAt' }
        };
        break;
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
    }
    
    const salesData = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupBy,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalCost: { $sum: '$totalCost' },
          averageOrderValue: { $avg: '$total' }
        }
      },
      {
        $addFields: {
          profit: { $subtract: ['$totalRevenue', '$totalCost'] },
          profitMargin: {
            $multiply: [
              { $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalRevenue'] },
              100
            ]
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    res.json(salesData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Product performance analytics
router.get('/products/performance', adminAuth, async (req, res) => {
  try {
    const { limit = 10, sortBy = 'revenue' } = req.query;
    
    const productPerformance = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.priceAtTime'] } },
          totalCost: { $sum: { $multiply: ['$items.quantity', '$items.costAtTime'] } },
          orderCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          profit: { $subtract: ['$totalRevenue', '$totalCost'] },
          profitMargin: {
            $multiply: [
              { $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalRevenue'] },
              100
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $sort: sortBy === 'quantity' ? { totalQuantity: -1 } : 
               sortBy === 'profit' ? { profit: -1 } : { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json(productPerformance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Profit and loss report
router.get('/profit-loss', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;
    let matchCondition = {};
    
    if (startDate || endDate) {
      matchCondition.createdAt = {};
      if (startDate) matchCondition.createdAt.$gte = new Date(startDate);
      if (endDate) matchCondition.createdAt.$lte = new Date(endDate);
    }
    
    // Revenue from orders
    const revenueData = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalCOGS: { $sum: '$totalCost' }, // Cost of Goods Sold
          totalOrders: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate employee salary expenses for the period
    const employees = await Employee.find({ isActive: true });
    const totalMonthlySalaries = employees.reduce((sum, emp) => sum + (emp.baseSalary / 12), 0);
    
    // Calculate months in the period
    let monthsInPeriod = 1;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      monthsInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));
    }
    
    const salaryExpenses = totalMonthlySalaries * monthsInPeriod;
    
    const revenue = revenueData[0] || { totalRevenue: 0, totalCOGS: 0, totalOrders: 0 };
    const grossProfit = revenue.totalRevenue - revenue.totalCOGS;
    const netProfit = grossProfit - salaryExpenses;
    
    res.json({
      period: { startDate, endDate },
      revenue: {
        totalRevenue: revenue.totalRevenue,
        totalOrders: revenue.totalOrders,
        averageOrderValue: revenue.totalOrders > 0 ? revenue.totalRevenue / revenue.totalOrders : 0
      },
      costs: {
        costOfGoodsSold: revenue.totalCOGS,
        salaryExpenses,
        totalCosts: revenue.totalCOGS + salaryExpenses
      },
      profit: {
        grossProfit,
        grossProfitMargin: revenue.totalRevenue > 0 ? (grossProfit / revenue.totalRevenue * 100).toFixed(2) : 0,
        netProfit,
        netProfitMargin: revenue.totalRevenue > 0 ? (netProfit / revenue.totalRevenue * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Inventory analytics
router.get('/inventory', adminAuth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.find({ 
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true 
    });
    
    const inventoryValue = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalStockValue: { $sum: { $multiply: ['$stock', '$costPrice'] } },
          totalSellingValue: { $sum: { $multiply: ['$stock', '$sellingPrice'] } }
        }
      }
    ]);
    
    const categoryDistribution = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          stockValue: { $sum: { $multiply: ['$stock', '$costPrice'] } }
        }
      }
    ]);
    
    const value = inventoryValue[0] || { totalStockValue: 0, totalSellingValue: 0 };
    
    res.json({
      summary: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        totalStockValue: value.totalStockValue,
        potentialRevenue: value.totalSellingValue
      },
      lowStockProducts: lowStockProducts.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        currentStock: p.stock,
        minStock: p.minStock,
        category: p.category
      })),
      categoryDistribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
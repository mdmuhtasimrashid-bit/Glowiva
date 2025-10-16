import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiCalendar } from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Analytics = () => {
  const [salesData, setSalesData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [profitLossData, setProfitLossData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [salesResponse, productResponse, profitLossResponse, inventoryResponse] = await Promise.all([
        analyticsAPI.getSales({ period: 'monthly', year: new Date().getFullYear() }),
        analyticsAPI.getProductPerformance({ limit: 10, sortBy: 'revenue' }),
        analyticsAPI.getProfitLoss({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
        analyticsAPI.getInventory(),
      ]);

      setSalesData(salesResponse.data);
      setProductPerformance(productResponse.data);
      setProfitLossData(profitLossResponse.data);
      setInventoryData(inventoryResponse.data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount || 0);
  };

  const getMonthName = (monthNum) => {
    return new Date(2023, monthNum - 1, 1).toLocaleString('default', { month: 'short' });
  };

  // Sales Chart Data
  const salesChartData = {
    labels: salesData.map(item => getMonthName(item._id.month)),
    datasets: [
      {
        label: 'Revenue',
        data: salesData.map(item => item.totalRevenue),
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Profit',
        data: salesData.map(item => item.profit),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Product Performance Chart Data
  const productChartData = {
    labels: productPerformance.map(item => item.product?.name || 'Unknown').slice(0, 5),
    datasets: [
      {
        label: 'Revenue',
        data: productPerformance.map(item => item.totalRevenue).slice(0, 5),
        backgroundColor: [
          '#007bff',
          '#28a745',
          '#ffc107',
          '#dc3545',
          '#6c757d',
        ],
      },
    ],
  };

  // Category Distribution Chart Data
  const categoryChartData = inventoryData ? {
    labels: inventoryData.categoryDistribution.map(item => item._id),
    datasets: [
      {
        data: inventoryData.categoryDistribution.map(item => item.count),
        backgroundColor: [
          '#007bff',
          '#28a745',
          '#ffc107',
          '#dc3545',
          '#6c757d',
          '#17a2b8',
          '#fd7e14',
          '#e83e8c',
        ],
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading analytics...</div></div>;
  }

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Analytics & Reports</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <FiCalendar />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="form-control"
            style={{ width: '150px' }}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="form-control"
            style={{ width: '150px' }}
          />
        </div>
      </div>

      {/* Profit & Loss Summary */}
      {profitLossData && (
        <div className="row" style={{ marginBottom: '30px' }}>
          <div className="col-md-3">
            <div className="card" style={{ borderLeft: '4px solid #007bff' }}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ color: '#333', marginBottom: '8px' }}>Total Revenue</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
                      {formatCurrency(profitLossData.revenue.totalRevenue)}
                    </p>
                  </div>
                  <FiDollarSign size={40} color="#007bff" style={{ opacity: 0.8 }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card" style={{ borderLeft: '4px solid #ffc107' }}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ color: '#333', marginBottom: '8px' }}>Total Costs</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107', margin: 0 }}>
                      {formatCurrency(profitLossData.costs.totalCosts)}
                    </p>
                  </div>
                  <FiDollarSign size={40} color="#ffc107" style={{ opacity: 0.8 }} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card" style={{ borderLeft: `4px solid ${profitLossData.profit.grossProfit >= 0 ? '#28a745' : '#dc3545'}` }}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ color: '#333', marginBottom: '8px' }}>Gross Profit</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: profitLossData.profit.grossProfit >= 0 ? '#28a745' : '#dc3545', margin: 0 }}>
                      {formatCurrency(profitLossData.profit.grossProfit)}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6c757d', margin: '4px 0 0 0' }}>
                      {profitLossData.profit.grossProfitMargin}% margin
                    </p>
                  </div>
                  {profitLossData.profit.grossProfit >= 0 ? 
                    <FiTrendingUp size={40} color="#28a745" style={{ opacity: 0.8 }} /> :
                    <FiTrendingDown size={40} color="#dc3545" style={{ opacity: 0.8 }} />
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card" style={{ borderLeft: `4px solid ${profitLossData.profit.netProfit >= 0 ? '#28a745' : '#dc3545'}` }}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ color: '#333', marginBottom: '8px' }}>Net Profit</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: profitLossData.profit.netProfit >= 0 ? '#28a745' : '#dc3545', margin: 0 }}>
                      {formatCurrency(profitLossData.profit.netProfit)}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6c757d', margin: '4px 0 0 0' }}>
                      {profitLossData.profit.netProfitMargin}% margin
                    </p>
                  </div>
                  {profitLossData.profit.netProfit >= 0 ? 
                    <FiTrendingUp size={40} color="#28a745" style={{ opacity: 0.8 }} /> :
                    <FiTrendingDown size={40} color="#dc3545" style={{ opacity: 0.8 }} />
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="row" style={{ marginBottom: '30px' }}>
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Sales & Profit Trends</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {salesData.length > 0 ? (
                <Line data={salesChartData} options={chartOptions} />
              ) : (
                <div className="text-center" style={{ padding: '40px' }}>
                  <p>No sales data available for the selected period</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Product Categories</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {categoryChartData ? (
                <Doughnut data={categoryChartData} options={chartOptions} />
              ) : (
                <div className="text-center" style={{ padding: '40px' }}>
                  <p>No category data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Top Products by Revenue</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {productPerformance.length > 0 ? (
                <Bar data={productChartData} options={chartOptions} />
              ) : (
                <div className="text-center" style={{ padding: '40px' }}>
                  <p>No product performance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Inventory Summary</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {inventoryData ? (
                <div>
                  <div className="row">
                    <div className="col-md-6">
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h4 style={{ color: '#007bff' }}>{inventoryData.summary.totalProducts}</h4>
                        <p>Total Products</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h4 style={{ color: inventoryData.summary.lowStockCount > 0 ? '#dc3545' : '#28a745' }}>
                          {inventoryData.summary.lowStockCount}
                        </h4>
                        <p>Low Stock Items</p>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h4 style={{ color: '#28a745' }}>{formatCurrency(inventoryData.summary.totalStockValue)}</h4>
                        <p>Inventory Value</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h4 style={{ color: '#ffc107' }}>{formatCurrency(inventoryData.summary.potentialRevenue)}</h4>
                        <p>Potential Revenue</p>
                      </div>
                    </div>
                  </div>
                  {inventoryData.lowStockProducts.length > 0 && (
                    <div>
                      <h5 style={{ color: '#dc3545', marginBottom: '15px' }}>Low Stock Alert</h5>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {inventoryData.lowStockProducts.map(product => (
                          <div key={product.id} style={{ 
                            padding: '8px', 
                            backgroundColor: '#fff3cd', 
                            borderLeft: '3px solid #ffc107',
                            marginBottom: '5px',
                            fontSize: '14px'
                          }}>
                            <strong>{product.name}</strong> - Stock: {product.currentStock}/{product.minStock}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center" style={{ padding: '40px' }}>
                  <p>No inventory data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      {productPerformance.length > 0 && (
        <div className="card" style={{ marginTop: '30px' }}>
          <div className="card-header">
            <h3 className="card-title">Product Performance Details</h3>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                  <th>Profit Margin</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{item.product?.name || 'Unknown Product'}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>{item.product?.sku}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">
                        {item.product?.category || 'N/A'}
                      </span>
                    </td>
                    <td>{item.totalQuantity}</td>
                    <td>{formatCurrency(item.totalRevenue)}</td>
                    <td>
                      <span style={{ color: item.profit > 0 ? '#28a745' : '#dc3545' }}>
                        {formatCurrency(item.profit)}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: item.profitMargin > 0 ? '#28a745' : '#dc3545' }}>
                        {item.profitMargin?.toFixed(2) || '0.00'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
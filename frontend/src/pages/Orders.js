import React, { useState, useEffect } from 'react';
import { ordersAPI, productsAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiPlus, FiEye, FiX, FiShoppingCart, FiTrash2, FiEdit } from 'react-icons/fi';

const Orders = () => {
  const { user, isEmployee } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    employeeId: '',
    items: [{ productId: '', quantity: 1, customPrice: 0 }],
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchEmployees();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ isActive: true });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll({ isActive: true });
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOrder) {
        await ordersAPI.update(editingOrder._id, formData);
        toast.success('Order updated successfully');
      } else {
        await ordersAPI.create(formData);
        toast.success('Order created successfully');
      }
      fetchOrders();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save order');
    }
  };



  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (window.confirm(`Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`)) {
      try {
        await ordersAPI.delete(orderId);
        toast.success('Order deleted successfully');
        fetchOrders();
      } catch (error) {
        toast.error('Failed to delete order');
        console.error('Delete error:', error);
      }
    }
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setFormData({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      employeeId: order.employee?._id || '',
      items: order.items.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        customPrice: item.priceAtTime
      }))
    });
    setShowModal(true);
  };



  const openModal = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      employeeId: '',
      items: [{ productId: '', quantity: 1, customPrice: 0 }],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setViewOrder(null);
    setEditingOrder(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // When product is selected, auto-populate custom price with product's selling price
    if (field === 'productId' && value) {
      const product = products.find(p => p._id === value);
      if (product) {
        newItems[index]['customPrice'] = product.sellingPrice;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, customPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: newItems
      }));
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      const customPrice = parseFloat(item.customPrice) || 0;
      return sum + (customPrice * item.quantity);
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount || 0);
  };



  if (loading) {
    return <div className="container"><div className="loading">Loading orders...</div></div>;
  }

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Orders</h1>
        <button className="btn btn-primary" onClick={openModal}>
          <FiPlus style={{ marginRight: '8px' }} />
          Create Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px' }}>
          <FiShoppingCart size={60} color="#6c757d" style={{ marginBottom: '20px' }} />
          <h3>No orders found</h3>
          <p>Start by creating your first order.</p>
          <button className="btn btn-primary" onClick={openModal}>
            Create Your First Order
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  {!isEmployee && <th>Profit</th>}
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: '600' }}>{order.orderNumber}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{order.customerName}</div>
                      </div>
                    </td>
                    <td>{order.items.length} items</td>
                    <td>{formatCurrency(order.total)}</td>
                    {!isEmployee && (
                      <td>
                        <span style={{ color: order.total - order.totalCost > 0 ? '#28a745' : '#dc3545' }}>
                          {formatCurrency(order.total - order.totalCost)}
                        </span>
                      </td>
                    )}
                    <td>
                      {order.employee ? (
                        <div>
                          <div style={{ fontWeight: '500', color: '#28a745' }}>
                            {order.employee.firstName} {order.employee.lastName}
                          </div>
                          {!isEmployee && (
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                              ৳{order.employee.commissionPerOrder || 0} commission
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#6c757d', fontStyle: 'italic' }}>No employee</span>
                      )}
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary mr-2"
                        onClick={() => setViewOrder(order)}
                        title="View Order"
                      >
                        <FiEye size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-secondary mr-2"
                        onClick={() => openEditModal(order)}
                        title="Edit Order"
                      >
                        <FiEdit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteOrder(order._id, order.orderNumber)}
                        title="Delete Order"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showModal && (
        <>
          <style>{`
            .modal-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .modal-scroll::-webkit-scrollbar-track {
              background: rgba(102, 126, 234, 0.1);
              border-radius: 4px;
            }
            .modal-scroll::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 4px;
            }
            .modal-scroll::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            }
          `}</style>
          <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h3>{editingOrder ? 'Edit Order' : 'Create New Order'}</h3>
              <button onClick={closeModal} style={modalStyles.closeButton}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="modal-scroll" style={{ 
                padding: '20px 30px', 
                overflowY: 'auto', 
                flex: 1,
                maxHeight: 'calc(85vh - 140px)' 
              }}>
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Customer Name</label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Employee (Optional)</label>
                      <select
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="">No Employee</option>
                        {employees.map(employee => (
                          <option key={employee._id} value={employee._id}>
                            {employee.firstName} {employee.lastName}
                            {!isEmployee && ` - ${employee.commissionPerOrder || 0}৳/order`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <h4>Order Items</h4>
                {formData.items.map((item, index) => (
                  <div key={index} className="card" style={{ marginBottom: '15px', padding: '15px' }}>
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="form-control"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product._id} value={product._id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Custom Price (৳)</label>
                        <input
                          type="number"
                          value={item.customPrice}
                          onChange={(e) => handleItemChange(index, 'customPrice', parseFloat(e.target.value) || 0)}
                          className="form-control"
                          min="0"
                          step="0.01"
                          required
                          placeholder="Enter price"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="form-control"
                          min="1"
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">&nbsp;</label>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          style={{ width: '100%' }}
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                    {item.productId && item.customPrice > 0 && (
                      <div className="row mt-2">
                        <div className="col-12">
                          <small className="text-muted">
                            Item Total: <strong>{formatCurrency(item.customPrice * item.quantity)}</strong>
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <button type="button" className="btn btn-secondary mb-3" onClick={addItem}>
                  Add Item
                </button>

                <div className="card" style={{ backgroundColor: '#f8f9fa', marginTop: '20px' }}>
                  <div style={{ padding: '15px' }}>
                    <h4>Total Bill</h4>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff', margin: '10px 0' }}>
                      {formatCurrency(calculateTotal())}
                    </p>
                  </div>
                </div>
              </div>

              <div style={modalStyles.footer}>
                <button type="button" className="btn btn-secondary mr-2" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingOrder ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h3>Order Details - {viewOrder.orderNumber}</h3>
              <button onClick={closeModal} style={modalStyles.closeButton}>×</button>
            </div>
            <div style={modalStyles.scrollableContent}>
              {/* Customer and Order Information Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', 
                gap: '24px', 
                marginBottom: '32px' 
              }}>
                {/* Customer Information Card */}
                <div style={modalStyles.infoCard}>
                  <div style={modalStyles.cardHeader}>
                    <h4 style={modalStyles.cardTitle}>👤 Customer Information</h4>
                  </div>
                  <div style={modalStyles.cardContent}>
                    <div style={modalStyles.infoItem}>
                      <span style={modalStyles.infoLabel}>Name:</span>
                      <span style={modalStyles.infoValue}>{viewOrder.customerName}</span>
                    </div>
                    <div style={modalStyles.infoItem}>
                      <span style={modalStyles.infoLabel}>Phone:</span>
                      <span style={modalStyles.infoValue}>{viewOrder.customerPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Order Information Card */}
                <div style={modalStyles.infoCard}>
                  <div style={modalStyles.cardHeader}>
                    <h4 style={modalStyles.cardTitle}>📋 Order Information</h4>
                  </div>
                  <div style={modalStyles.cardContent}>
                    <div style={modalStyles.infoItem}>
                      <span style={modalStyles.infoLabel}>Employee:</span>
                      <span style={modalStyles.infoValue}>
                        {viewOrder.employee ? `${viewOrder.employee.firstName} ${viewOrder.employee.lastName}` : 'No employee assigned'}
                      </span>
                    </div>
                    {viewOrder.employee && !isEmployee && (
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Commission:</span>
                        <span style={modalStyles.infoValue}>৳{viewOrder.employee.commissionPerOrder || 0}</span>
                      </div>
                    )}
                    <div style={modalStyles.infoItem}>
                      <span style={modalStyles.infoLabel}>Date:</span>
                      <span style={modalStyles.infoValue}>{new Date(viewOrder.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Order Items Section */}
              <div style={modalStyles.section}>
                <h4 style={modalStyles.sectionTitle}>🛍️ Order Items</h4>
                <div style={modalStyles.itemsContainer}>
                  <div style={modalStyles.itemsHeader}>
                    <div style={modalStyles.headerCell}>PRODUCT</div>
                    <div style={modalStyles.headerCell}>QUANTITY</div>
                    <div style={modalStyles.headerCell}>PRICE</div>
                    <div style={modalStyles.headerCell}>TOTAL</div>
                  </div>
                  {viewOrder.items.map((item, index) => (
                    <div key={index} style={modalStyles.itemRow}>
                      <div style={modalStyles.itemCell}>
                        <div style={modalStyles.productName}>{item.product?.name || 'Unknown Product'}</div>
                      </div>
                      <div style={modalStyles.itemCell}>
                        <span style={modalStyles.quantityBadge}>{item.quantity}</span>
                      </div>
                      <div style={modalStyles.itemCell}>
                        <span style={modalStyles.priceText}>{formatCurrency(item.priceAtTime)}</span>
                      </div>
                      <div style={modalStyles.itemCell}>
                        <span style={modalStyles.totalText}>{formatCurrency(item.priceAtTime * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary and Notes */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth > 768 ? (viewOrder.notes ? '1fr 400px' : '1fr 400px') : '1fr', 
                gap: '24px', 
                marginTop: '32px' 
              }}>
                {/* Notes Section - Only show if there are notes */}
                {viewOrder.notes && (
                  <div style={modalStyles.notesCard}>
                    <div style={modalStyles.cardHeader}>
                      <h4 style={modalStyles.cardTitle}>📝 Notes</h4>
                    </div>
                    <div style={modalStyles.cardContent}>
                      <p style={modalStyles.notesText}>{viewOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Order Summary Card */}
                <div style={modalStyles.summaryCard}>
                  <div style={modalStyles.cardHeader}>
                    <h4 style={modalStyles.cardTitle}>💰 Order Summary</h4>
                  </div>
                  <div style={modalStyles.cardContent}>
                    <div style={modalStyles.summaryItem}>
                      <span style={modalStyles.summaryLabel}>Subtotal:</span>
                      <span style={modalStyles.summaryValue}>{formatCurrency(viewOrder.subtotal)}</span>
                    </div>
                    <div style={modalStyles.summaryItem}>
                      <span style={modalStyles.summaryLabel}>Tax:</span>
                      <span style={modalStyles.summaryValue}>{formatCurrency(viewOrder.tax)}</span>
                    </div>
                    <div style={modalStyles.summaryItem}>
                      <span style={modalStyles.summaryLabel}>Shipping:</span>
                      <span style={modalStyles.summaryValue}>{formatCurrency(viewOrder.shipping)}</span>
                    </div>
                    <div style={modalStyles.summaryItem}>
                      <span style={modalStyles.summaryLabel}>Discount:</span>
                      <span style={modalStyles.summaryValue}>-{formatCurrency(viewOrder.discount)}</span>
                    </div>
                    <div style={modalStyles.summaryDivider}></div>
                    <div style={modalStyles.summaryItem}>
                      <span style={modalStyles.summaryLabelTotal}>Total:</span>
                      <span style={modalStyles.summaryValueTotal}>{formatCurrency(viewOrder.total)}</span>
                    </div>
                    {!isEmployee && (
                      <div style={modalStyles.summaryItem}>
                        <span style={modalStyles.summaryLabel}>Profit:</span>
                        <span style={{
                          ...modalStyles.summaryValue,
                          color: viewOrder.total - viewOrder.totalCost > 0 ? '#22c55e' : '#ef4444',
                          fontWeight: '700'
                        }}>
                          {formatCurrency(viewOrder.total - viewOrder.totalCost)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div style={modalStyles.footer}>
              <button className="btn btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    animation: 'fadeIn 0.3s ease-out',
  },
  modal: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    width: '95%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    animation: 'fadeIn 0.3s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '30px 30px 20px 30px',
    borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
  },
  closeButton: {
    background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    color: 'white',
    fontWeight: 'bold',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  footer: {
    padding: '20px 30px 30px 30px',
    borderTop: '1px solid rgba(102, 126, 234, 0.1)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    background: 'rgba(248, 250, 252, 0.8)',
    flexShrink: 0,
  },
  scrollableContent: {
    padding: '30px',
    overflowY: 'auto',
    maxHeight: 'calc(85vh - 140px)',
  },
  
  // Info Cards
  infoCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '16px',
    border: '1px solid rgba(102, 126, 234, 0.15)',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  cardHeader: {
    padding: '20px 24px 16px 24px',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
    borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardContent: {
    padding: '20px 24px',
  },
  
  // Info Items
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  infoLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    flex: '0 0 auto',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'right',
    flex: '1',
    marginLeft: '16px',
  },
  
  // Section Styles
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  
  // Items Container
  itemsContainer: {
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '16px',
    border: '1px solid rgba(102, 126, 234, 0.15)',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  itemsHeader: {
    display: 'grid',
    gridTemplateColumns: window.innerWidth > 768 ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr',
    gap: '16px',
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  headerCell: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  itemRow: {
    display: 'grid',
    gridTemplateColumns: window.innerWidth > 768 ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr',
    gap: '16px',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    transition: 'background-color 0.2s ease',
  },
  itemCell: {
    display: 'flex',
    alignItems: 'center',
  },
  productName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  quantityBadge: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
  },
  priceText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  totalText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#22c55e',
  },
  
  // Notes Card
  notesCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '16px',
    border: '1px solid rgba(102, 126, 234, 0.15)',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    height: 'fit-content',
  },
  notesText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#4b5563',
    margin: 0,
  },
  
  // Summary Card
  summaryCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    border: '1px solid rgba(102, 126, 234, 0.15)',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    height: 'fit-content',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  summaryLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryLabelTotal: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
  },
  summaryValueTotal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#667eea',
  },
  summaryDivider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent)',
    margin: '16px 0',
    overflowY: 'auto',
    flex: 1,
    maxHeight: 'calc(85vh - 140px)',
  },
};

export default Orders;
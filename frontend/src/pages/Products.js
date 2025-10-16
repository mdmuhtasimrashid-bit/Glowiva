import React, { useState, useEffect } from 'react';
import { productsAPI, uploadAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit, FiTrash2, FiPackage, FiUpload, FiImage, FiX } from 'react-icons/fi';
import { getAllProductImages } from '../data/productImages';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    imageUrl: '',
    costPrice: '',
    sellingPrice: '',
    stock: '',
    minStock: '',
  });
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [availableImages] = useState(getAllProductImages());
  const [imageFilter, setImageFilter] = useState('');
  const [categories, setCategories] = useState([]);
  // const [categories] = useState([
  //   'cleanser', 'moisturizer', 'serum', 'sunscreen', 'toner', 'mask', 'treatment', 'other'
  // ]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdateData, setStockUpdateData] = useState({
    productId: '',
    currentStock: 0,
    newStock: '',
    operation: 'set' // 'set', 'add', 'subtract'
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate form data
      if (!formData.name.trim()) {
        toast.error('Product name is required');
        return;
      }
      
      if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
        toast.error('Valid product cost is required');
        return;
      }

      const submitData = {
        name: formData.name.trim(),
        category: formData.category,
        imageUrl: formData.imageUrl.trim(),
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        stock: parseInt(formData.stock) || 0,
        minStock: parseInt(formData.minStock) || 10
      };

      console.log('Form Data before submit:', formData);
      console.log('Submitting product data:', {
        ...submitData,
        imageUrl: submitData.imageUrl.length > 50 ? `${submitData.imageUrl.substring(0, 50)}... (${submitData.imageUrl.length} chars)` : submitData.imageUrl
      });

      const loadingToast = toast.loading('Saving product...');

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, submitData);
        toast.dismiss(loadingToast);
        toast.success('Product updated successfully');
      } else {
        const response = await productsAPI.create(submitData);
        console.log('Product created successfully:', response.data);
        toast.dismiss(loadingToast);
        toast.success('Product created successfully');
      }
      fetchProducts();
      closeModal();
    } catch (error) {
      console.error('Submit error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Try to save with a placeholder image if the original fails due to size
      if (error.response?.status === 413 || error.response?.status === 500) {
        try {
          const fallbackData = {
            name: formData.name.trim(),
            category: formData.category,
            imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center', // Default image
            costPrice: parseFloat(formData.costPrice),
            sellingPrice: parseFloat(formData.sellingPrice) || 0,
            stock: parseInt(formData.stock) || 0,
            minStock: parseInt(formData.minStock) || 10
          };
          
          if (editingProduct) {
            await productsAPI.update(editingProduct._id, fallbackData);
            toast.success('Product updated successfully (with default image due to size limit)');
          } else {
            await productsAPI.create(fallbackData);
            toast.success('Product created successfully (with default image due to size limit)');
          }
          
          fetchProducts();
          closeModal();
          return;
        } catch (fallbackError) {
          toast.error('Failed to save product even with default image');
          return;
        }
      }
      
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category || 'other',
        imageUrl: product.imageUrl || '',
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice || '',
        stock: product.stock || '',
        minStock: product.minStock || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: 'other',
        imageUrl: '',
        costPrice: '',
        sellingPrice: '',
        stock: '',
        minStock: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const uploadToast = toast.loading('Uploading image...');
        
        try {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const base64String = event.target.result;
              const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
              
              // Upload to server
              console.log('Attempting to upload image to server...', { fileName, dataLength: base64String.length });
              const response = await uploadAPI.uploadImage(base64String, fileName);
              
              setFormData(prev => ({
                ...prev,
                imageUrl: `http://localhost:5000${response.data.imageUrl}`
              }));
              
              toast.dismiss(uploadToast);
              toast.success(`Image uploaded successfully (${Math.round(file.size / 1024)}KB)`);
            } catch (uploadError) {
              console.error('Upload error:', uploadError);
              toast.dismiss(uploadToast);
              
              // Fallback to base64 if upload fails
              const base64String = event.target.result;
              setFormData(prev => ({
                ...prev,
                imageUrl: base64String
              }));
              toast.warning('Using direct image data (upload service unavailable)');
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          toast.dismiss(uploadToast);
          toast.error('Failed to process image');
        }
      } else {
        toast.error('Please select a valid image file');
      }
    }
  };

  const selectImageFromGallery = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: imageUrl
    }));
    setShowImageSelector(false);
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
  };

  const filteredImages = availableImages.filter(image =>
    image.name.toLowerCase().includes(imageFilter.toLowerCase()) ||
    image.description.toLowerCase().includes(imageFilter.toLowerCase())
  );

  const handleStockUpdate = (productId, currentStock) => {
    setStockUpdateData({
      productId,
      currentStock,
      newStock: currentStock.toString(),
      operation: 'set'
    });
    setShowStockModal(true);
  };

  const submitStockUpdate = async (e) => {
    e.preventDefault();
    try {
      const { productId, newStock, operation } = stockUpdateData;
      const quantity = parseInt(newStock);
      
      if (isNaN(quantity) || quantity < 0) {
        toast.error('Please enter a valid stock quantity');
        return;
      }

      const updateData = operation === 'set' 
        ? { quantity, operation: 'set' }
        : { quantity: Math.abs(quantity), operation };

      await productsAPI.updateStock(productId, updateData);
      toast.success('Stock updated successfully');
      fetchProducts();
      setShowStockModal(false);
    } catch (error) {
      toast.error('Failed to update stock');
      console.error(error);
    }
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setStockUpdateData({
      productId: '',
      currentStock: 0,
      newStock: '',
      operation: 'set'
    });
  };

  // const formatCurrency = (amount) => {
  //   return new Intl.NumberFormat('en-BD', {
  //     style: 'currency',
  //     currency: 'BDT',
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 0,
  //   }).format(amount || 0).replace('৳', '৳ ');
  // };

  if (loading) {
    return <div className="container"><div className="loading">Loading products...</div></div>;
  }

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FiPlus style={{ marginRight: '8px' }} />
          Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px' }}>
          <FiPackage size={60} color="#6c757d" style={{ marginBottom: '20px' }} />
          <h3>No products found</h3>
          <p>Start by adding your first product to the inventory.</p>
          <button className="btn btn-primary" onClick={() => openModal()}>
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Product Cost</th>
                  <th>Selling Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          backgroundColor: '#e9ecef', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: '#6c757d',
                          border: '1px solid #e9ecef'
                        }}>
                          No Image
                        </div>
                      )}
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '16px' }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          SKU: {product.sku}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: '#e8f5e8',
                        color: '#155724',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #28a745'
                      }}>
                        {product.category ? (
                          product.category.charAt(0).toUpperCase() + product.category.slice(1).replace('_', ' ')
                        ) : (
                          'Other'
                        )}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', fontSize: '16px', color: '#333' }}>
                        ৳ {product.costPrice}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', fontSize: '16px', color: '#28a745' }}>
                        ৳ {product.sellingPrice || 0}
                      </span>
                      {product.sellingPrice && product.costPrice && (
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          Profit: ৳{product.sellingPrice - product.costPrice}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontWeight: '600', 
                          fontSize: '16px', 
                          color: product.stock <= product.minStock ? '#dc3545' : '#28a745' 
                        }}>
                          {product.stock || 0}
                        </span>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleStockUpdate(product._id, product.stock)}
                          title="Update Stock"
                          style={{ padding: '2px 6px', fontSize: '12px' }}
                        >
                          Update
                        </button>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        Min: {product.minStock || 10}
                        {product.stock <= product.minStock && (
                          <span style={{ color: '#dc3545', fontWeight: '600', marginLeft: '4px' }}>
                            (Low Stock!)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary mr-2"
                        onClick={() => openModal(product)}
                        title="Edit Product"
                      >
                        <FiEdit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(product._id)}
                        title="Delete Product"
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

      {/* Modal */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={closeModal} style={modalStyles.closeButton}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '0 30px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  Choose the appropriate category for this skincare or makeup product
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Product Image</label>
                
                {/* Image Preview */}
                {formData.imageUrl && (
                  <div style={{ marginBottom: '15px', position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={formData.imageUrl} 
                      alt="Product preview" 
                      style={{ 
                        width: '150px', 
                        height: '150px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        border: '2px solid #e9ecef'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                )}

                {/* Upload Options */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <label className="btn btn-outline-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiUpload size={16} />
                    Upload from PC
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowImageSelector(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <FiImage size={16} />
                    Choose from Gallery
                  </button>
                </div>

                <div style={{ 
                  fontSize: '12px', 
                  color: '#6c757d', 
                  marginBottom: '15px',
                  padding: '8px',
                  backgroundColor: '#e8f5e8',
                  borderRadius: '4px',
                  border: '1px solid #28a745'
                }}>
                  ✅ <strong>Upload any size image!</strong> Large images will automatically use a fallback if needed. 
                  Gallery images are optimized for best performance.
                </div>

                {/* Manual URL Input */}
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl.includes('localhost:5000') ? '[Uploaded Image]' : formData.imageUrl}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Or enter image URL directly"
                  disabled={formData.imageUrl.includes('localhost:5000') || formData.imageUrl.startsWith('data:image/')}
                />
                
                {(formData.imageUrl.includes('localhost:5000') || formData.imageUrl.startsWith('data:image/')) && (
                  <small className="text-muted" style={{ marginTop: '5px', display: 'block' }}>
                    📷 Image uploaded from your computer
                  </small>
                )}
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Product Cost (৳)</label>
                    <input
                      type="number"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleInputChange}
                      className="form-control"
                      step="1"
                      min="0"
                      required
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Selling Price (৳)</label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleInputChange}
                      className="form-control"
                      step="1"
                      min="0"
                      placeholder="0"
                    />
                    {formData.costPrice && formData.sellingPrice && (
                      <small className="text-muted">
                        Profit: ৳{formData.sellingPrice - formData.costPrice} 
                        ({(((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100).toFixed(1)}% margin)
                      </small>
                    )}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Initial Stock Quantity</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="form-control"
                      step="1"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Minimum Stock Alert</label>
                    <input
                      type="number"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleInputChange}
                      className="form-control"
                      step="1"
                      min="0"
                      placeholder="10"
                    />
                    <small className="text-muted">
                      Alert when stock falls below this level
                    </small>
                  </div>
                </div>
              </div>
              </div>

              <div style={modalStyles.footer}>
                <button type="button" className="btn btn-secondary mr-2" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Selector Modal */}
      {showImageSelector && (
        <div style={modalStyles.overlay}>
          <div style={{...modalStyles.modal, maxWidth: '900px'}}>
            <div style={modalStyles.header}>
              <h3>Choose Product Image</h3>
              <button onClick={() => setShowImageSelector(false)} style={modalStyles.closeButton}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              {/* Search Filter */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search images..."
                  value={imageFilter}
                  onChange={(e) => setImageFilter(e.target.value)}
                />
              </div>

              {/* Image Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: '15px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {filteredImages.map((image, index) => (
                  <div 
                    key={index}
                    onClick={() => selectImageFromGallery(image.url)}
                    style={{ 
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      ':hover': {
                        border: '2px solid #007bff'
                      }
                    }}
                    onMouseEnter={(e) => e.target.style.borderColor = '#007bff'}
                    onMouseLeave={(e) => e.target.style.borderColor = 'transparent'}
                  >
                    <img 
                      src={image.url} 
                      alt={image.name}
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f8f9fa',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}>
                      {image.name}
                    </div>
                  </div>
                ))}
              </div>

              {filteredImages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                  <FiImage size={48} />
                  <p style={{ marginTop: '10px' }}>No images found matching your search.</p>
                </div>
              )}
            </div>
            <div style={modalStyles.footer}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowImageSelector(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && (
        <div style={modalStyles.overlay}>
          <div style={{...modalStyles.modal, maxWidth: '500px'}}>
            <div style={modalStyles.header}>
              <h3>Update Stock</h3>
              <button onClick={closeStockModal} style={modalStyles.closeButton}>×</button>
            </div>
            <form onSubmit={submitStockUpdate}>
              <div style={{ padding: '20px 30px' }}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Current Stock:</label>
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: stockUpdateData.currentStock <= 10 ? '#dc3545' : '#28a745'
                  }}>
                    {stockUpdateData.currentStock} units
                    {stockUpdateData.currentStock <= 10 && (
                      <span style={{ marginLeft: '8px', fontSize: '14px' }}>(Low Stock!)</span>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Update Method:</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="radio"
                        name="operation"
                        value="set"
                        checked={stockUpdateData.operation === 'set'}
                        onChange={(e) => setStockUpdateData(prev => ({ ...prev, operation: e.target.value }))}
                      />
                      Set to exact amount
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="radio"
                        name="operation"
                        value="add"
                        checked={stockUpdateData.operation === 'add'}
                        onChange={(e) => setStockUpdateData(prev => ({ ...prev, operation: e.target.value }))}
                      />
                      Add stock
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="radio"
                        name="operation"
                        value="subtract"
                        checked={stockUpdateData.operation === 'subtract'}
                        onChange={(e) => setStockUpdateData(prev => ({ ...prev, operation: e.target.value }))}
                      />
                      Remove stock
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {stockUpdateData.operation === 'set' && 'New Stock Quantity:'}
                    {stockUpdateData.operation === 'add' && 'Add Quantity:'}
                    {stockUpdateData.operation === 'subtract' && 'Remove Quantity:'}
                  </label>
                  <input
                    type="number"
                    value={stockUpdateData.newStock}
                    onChange={(e) => setStockUpdateData(prev => ({ ...prev, newStock: e.target.value }))}
                    className="form-control"
                    step="1"
                    min="0"
                    required
                    placeholder="Enter quantity"
                  />
                  {stockUpdateData.operation !== 'set' && (
                    <small className="text-muted">
                      Result: {stockUpdateData.operation === 'add' 
                        ? stockUpdateData.currentStock + (parseInt(stockUpdateData.newStock) || 0)
                        : Math.max(0, stockUpdateData.currentStock - (parseInt(stockUpdateData.newStock) || 0))
                      } units
                    </small>
                  )}
                </div>
              </div>

              <div style={modalStyles.footer}>
                <button type="button" className="btn btn-secondary mr-2" onClick={closeStockModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Stock
                </button>
              </div>
            </form>
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
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease-out',
  },
  modal: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'hidden',
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
  },
};

export default Products;
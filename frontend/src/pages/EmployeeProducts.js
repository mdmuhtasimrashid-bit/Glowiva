import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const EmployeeProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const filterProducts = React.useCallback(() => {
    let filtered = products.filter(product => product.isActive);

    if (showOnlyAvailable) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, showOnlyAvailable]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/meta/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const formatCurrency = (amount) => {
    return `৳${amount.toLocaleString()}`;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleImageClick = (imageUrl, productName) => {
    setSelectedImage({ url: imageUrl, name: productName });
    setImageLoading(true);
    setShowImageModal(true);
    // Disable body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setImageLoading(false);
    // Re-enable body scroll
    document.body.style.overflow = 'unset';
  };

  const downloadImage = async () => {
    if (selectedImage) {
      try {
        // Fetch the image as a blob to handle CORS issues
        const response = await fetch(selectedImage.url);
        const blob = await response.blob();
        
        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${selectedImage.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Error downloading image:', error);
        // Fallback to opening in new tab if download fails
        window.open(selectedImage.url, '_blank');
      }
    }
  };

  // Cleanup effect to re-enable scroll on unmount
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Close modal on Escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showImageModal) {
        closeImageModal();
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showImageModal]);

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="employee-products">
      <div className="products-header">
        <h1>Product Catalog</h1>
        <p>Browse available products and their selling prices</p>
      </div>

      {/* Search and Filter */}
      <div className="products-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>

          <label className="availability-toggle">
            <input
              type="checkbox"
              checked={showOnlyAvailable}
              onChange={(e) => setShowOnlyAvailable(e.target.checked)}
            />
            <span className="toggle-text">Show only available products</span>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>No products found matching your criteria.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product._id} className={`product-card ${product.stock === 0 ? 'out-of-stock-card' : ''}`}>
              <div className="product-image">
                {product.imageUrl ? (
                  <div className="image-container" onClick={() => handleImageClick(product.imageUrl, product.name)}>
                    <img src={product.imageUrl} alt={product.name} />
                    <div className="image-overlay">
                      <div className="zoom-icon">🔍</div>
                      <div className="click-text">Click to view</div>
                    </div>
                  </div>
                ) : (
                  <div className="placeholder-image">
                    <span>No Image</span>
                  </div>
                )}
              </div>

              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-sku">SKU: {product.sku}</p>
                <p className="product-category">
                  Category: {product.category ? (
                    product.category.charAt(0).toUpperCase() + product.category.slice(1).replace('_', ' ')
                  ) : (
                    'Other'
                  )}
                </p>
                
                <div className="product-pricing">
                  <div className="selling-price">
                    <span className="price-label">Selling Price:</span>
                    <span className="price-value">{formatCurrency(product.sellingPrice || 0)}</span>
                  </div>
                </div>

                <div className="product-stock">
                  <div className={`stock-indicator ${
                    product.stock === 0 ? 'out-of-stock' : 
                    product.stock <= product.minStock ? 'low-stock' : 'in-stock'
                  }`}>
                    <div className="stock-number">{product.stock}</div>
                    <div className="stock-label">
                      {product.stock === 0 ? 'Out of Stock' : 
                       product.stock <= product.minStock ? 'Low Stock' : 'In Stock'}
                    </div>
                  </div>
                </div>

                {product.description && product.description !== 'No description provided' && (
                  <p className="product-description">{product.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Viewer Modal */}
      {showImageModal && selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3 className="image-modal-title">{selectedImage.name}</h3>
              <div className="image-modal-actions">
                <button 
                  className="close-btn" 
                  onClick={closeImageModal}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="image-modal-content">
              <button 
                className="save-btn-corner" 
                onClick={downloadImage}
                title="Save Image"
              >
                💾 Save
              </button>
              {imageLoading && (
                <div className="image-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading image...</p>
                </div>
              )}
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name}
                className="modal-image"
                style={{ display: imageLoading ? 'none' : 'block' }}
                onLoad={(e) => {
                  setImageLoading(false);
                  // Reset any inline styles to let CSS handle sizing
                  const img = e.target;
                  img.style.width = 'auto';
                  img.style.height = 'auto';
                  img.style.maxWidth = 'calc(100% - 80px)';
                  img.style.maxHeight = 'calc(100% - 40px)';
                  img.style.objectFit = 'contain';
                }}
                onError={() => {
                  setImageLoading(false);
                }}
              />
            </div>
            <div className="image-modal-footer">
              <p className="image-instructions">
                Click outside the image or press ESC to close • Use the Save button to download • Right-click for more options
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .employee-products {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .products-header {
          margin-bottom: 30px;
          text-align: center;
        }

        .products-header h1 {
          color: #333;
          margin-bottom: 8px;
        }

        .products-header p {
          color: #666;
          font-size: 16px;
        }

        .products-controls {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-bar {
          flex: 1;
          min-width: 250px;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .filter-section {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }

        .category-filter {
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          background: white;
          cursor: pointer;
        }

        .category-filter:focus {
          outline: none;
          border-color: #667eea;
        }

        .availability-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 8px 12px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
        }

        .availability-toggle:hover {
          border-color: #667eea;
          background: #f8f9ff;
        }

        .availability-toggle input[type="checkbox"] {
          margin: 0;
          cursor: pointer;
        }

        .toggle-text {
          font-size: 14px;
          color: #333;
          white-space: nowrap;
        }

        .image-container {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s ease;
          height: 100%;
          overflow: hidden;
        }

        .image-container:hover {
          transform: scale(1.02);
        }

        .image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.2s ease;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          color: white;
        }

        .image-container:hover .image-overlay {
          opacity: 1;
        }

        .zoom-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .click-text {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .image-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease-out;
        }

        .image-modal {
          background: white;
          border-radius: 16px;
          width: 95%;
          max-width: 1200px;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease-out;
          overflow: hidden;
        }

        .image-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        }

        .image-modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          flex: 1;
        }

        .image-modal-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .download-btn {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .download-btn:hover {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          transform: translateY(-1px);
        }

        .close-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-1px);
        }

        .image-modal-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: #f9fafb;
          min-height: 400px;
          overflow: auto;
          position: relative;
          box-sizing: border-box;
        }

        .modal-image {
          max-width: calc(100% - 80px);
          max-height: calc(100% - 40px);
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          cursor: default;
          display: block;
          margin: auto;
        }

        .save-btn-corner {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .save-btn-corner:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .image-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .image-modal-footer {
          padding: 16px 24px;
          background: #f3f4f6;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .image-instructions {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .image-modal {
            width: 98%;
            max-width: 100%;
            max-height: 98vh;
            margin: 1vh;
          }

          .image-modal-header {
            padding: 16px 20px;
          }

          .image-modal-title {
            font-size: 16px;
          }

          .save-btn-corner {
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            font-size: 12px;
          }

          .image-modal-content {
            min-height: 300px;
            padding: 5px;
          }

          .image-modal-footer {
            padding: 12px 20px;
          }

          .image-instructions {
            font-size: 11px;
          }
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .product-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .product-card.out-of-stock-card {
          opacity: 0.7;
          background: #f8f9fa;
          border: 2px solid #dee2e6;
        }

        .product-card.out-of-stock-card:hover {
          transform: none;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .product-image {
          height: 200px;
          overflow: hidden;
          background: #f8f9fa;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-image {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e9ecef;
          color: #6c757d;
          font-weight: 500;
        }

        .product-info {
          padding: 20px;
        }

        .product-name {
          font-size: 18px;
          font-weight: 700;
          color: #333;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .product-sku {
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
        }

        .product-category {
          font-size: 14px;
          color: #666;
          margin-bottom: 16px;
        }

        .product-pricing {
          margin-bottom: 16px;
        }

        .selling-price {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #e8f5e8;
          border-radius: 8px;
          border-left: 4px solid #22c55e;
        }

        .price-label {
          font-weight: 600;
          color: #166534;
        }

        .price-value {
          font-size: 20px;
          font-weight: 700;
          color: #166534;
        }

        .product-stock {
          margin-bottom: 12px;
        }

        .stock-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .stock-indicator.in-stock {
          background: #d1fae5;
          border-left-color: #22c55e;
        }

        .stock-indicator.low-stock {
          background: #fef3c7;
          border-left-color: #f59e0b;
        }

        .stock-indicator.out-of-stock {
          background: #fee2e2;
          border-left-color: #ef4444;
        }

        .stock-number {
          font-size: 20px;
          font-weight: 700;
          min-width: 30px;
        }

        .stock-indicator.in-stock .stock-number {
          color: #065f46;
        }

        .stock-indicator.low-stock .stock-number {
          color: #92400e;
        }

        .stock-indicator.out-of-stock .stock-number {
          color: #dc2626;
        }

        .stock-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stock-indicator.in-stock .stock-label {
          color: #065f46;
        }

        .stock-indicator.low-stock .stock-label {
          color: #92400e;
        }

        .stock-indicator.out-of-stock .stock-label {
          color: #dc2626;
        }

        .product-description {
          font-size: 14px;
          color: #666;
          line-height: 1.4;
          margin-top: 12px;
        }

        .no-products {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .loading {
          text-align: center;
          padding: 60px;
          color: #666;
          font-size: 18px;
        }

        @media (max-width: 768px) {
          .products-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-bar {
            min-width: auto;
          }

          .filter-section {
            justify-content: center;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeProducts;
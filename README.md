# Glowiva - Skincare Business Management System

A comprehensive MERN stack application for managing skincare business operations including product management, order tracking, profit/loss calculations, employee salary management, and financial reporting.

## Features

### 📦 Product Management
- Add, edit, and delete skincare products
- Track product costs, selling prices, and profit margins
- Manage inventory with low stock alerts
- Categorize products (cleanser, moisturizer, serum, etc.)
- SKU management and product images

### 🛒 Order Management
- Create and track customer orders
- Real-time inventory updates
- Order status tracking (pending → processing → shipped → delivered)
- Payment status management
- Automatic profit calculations per order

### 👥 Employee Management
- Add and manage team members
- Track employee positions and departments
- Calculate monthly salaries with base pay + commission
- Emergency contact information
- Employee termination handling

### 📊 Analytics & Reporting
- **Dashboard**: Real-time business overview
- **Sales Analytics**: Revenue and profit trends
- **Product Performance**: Best-selling products analysis
- **Profit & Loss Reports**: Comprehensive financial analysis
- **Inventory Reports**: Stock levels and valuations
- **Salary Reports**: Employee compensation summaries

### 💰 Financial Features
- Automatic profit/loss calculations
- Cost of goods sold (COGS) tracking
- Employee salary expense management
- Monthly and yearly financial summaries
- Profit margin analysis

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB

### Frontend
- **React.js** - UI library
- **React Router** - Navigation
- **Chart.js** - Data visualization
- **React Icons** - Icon library
- **React Toastify** - Notifications

## Project Structure

```
Glowiva/
├── backend/
│   ├── models/          # Database models
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── Employee.js
│   ├── routes/          # API routes
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── employees.js
│   │   └── analytics.js
│   ├── server.js        # Express server setup
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.js
│   ├── public/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Glowiva
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/glowiva
   JWT_SECRET=your_jwt_secret_key_here
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start MongoDB**
   
   Make sure MongoDB is running on your system.

6. **Run the Application**
   
   **Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/stock` - Update stock

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status
- `PATCH /api/orders/:id/cancel` - Cancel order

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Add new employee
- `PUT /api/employees/:id` - Update employee
- `PATCH /api/employees/:id/terminate` - Terminate employee
- `GET /api/employees/salary-summary/:year/:month` - Get salary summary

### Analytics
- `GET /api/analytics/dashboard` - Dashboard summary
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/products/performance` - Product performance
- `GET /api/analytics/profit-loss` - Profit & loss report
- `GET /api/analytics/inventory` - Inventory analytics

## Key Features Explained

### Automatic Calculations
- **Product Profit**: Selling Price - Cost Price
- **Order Profit**: Total Revenue - Total Cost (including product costs)
- **Profit Margins**: (Profit / Revenue) × 100
- **Employee Salaries**: Base Salary + Commission (based on sales)

### Inventory Management
- Real-time stock tracking
- Low stock alerts when inventory falls below minimum threshold
- Automatic stock updates when orders are placed or cancelled

### Financial Reporting
- Daily, monthly, and yearly summaries
- Gross profit vs. net profit calculations
- Employee salary expenses included in reports
- Cost of goods sold (COGS) tracking

## Business Logic

### Order Processing
1. **Order Creation**: 
   - Validates product availability
   - Calculates totals including tax, shipping, discount
   - Updates inventory levels
   - Records cost basis for profit calculations

2. **Status Updates**:
   - Pending → Processing → Shipped → Delivered
   - Payment tracking: Pending → Paid/Failed/Refunded

3. **Cancellation**:
   - Restores inventory levels
   - Updates order status

### Salary Calculations
- **Base Salary**: Annual salary ÷ 12 months
- **Commission**: (Monthly Sales × Commission Rate) ÷ 100
- **Total Monthly Salary**: Base Salary + Commission

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository.

---

**Built with ❤️ for skincare business owners who want to track their success!**
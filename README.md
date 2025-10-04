# Expense Management System with Surya OCR

A modern, enterprise-grade expense management system that leverages AI-powered OCR technology for automated receipt processing. Built with Node.js, Express, MongoDB, and Surya OCR for intelligent document analysis.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Multi-Company Support** - Separate expense tracking for different companies
- **Smart Receipt Processing** - AI-powered OCR using Surya for automatic data extraction
- **Approval Workflows** - Configurable multi-level approval processes
- **Currency Conversion** - Automatic currency conversion with real-time exchange rates
- **Expense Analytics** - Comprehensive reporting and dashboard insights
- **Data Export** - Export expenses to CSV format for accounting systems

### OCR Capabilities
- **Intelligent Text Recognition** - Extract text from receipt images using Surya OCR
- **Structured Data Extraction** - Automatic identification of amounts, dates, vendors, and categories
- **Multi-format Support** - Process various image formats (JPEG, PNG, PDF)
- **Validation & Correction** - Manual review and correction of OCR results
- **Reprocessing** - Re-analyze receipts with different settings if needed

### Security & Compliance
- **Rate Limiting** - API protection against abuse
- **Data Validation** - Comprehensive input validation and sanitization
- **Secure File Upload** - Safe handling of receipt images
- **Audit Trail** - Complete tracking of all expense operations
- **CORS Protection** - Secure cross-origin request handling

## 🏗️ Architecture

```
backend/
├── server.js              # Application entry point
├── config/                 # Configuration files
│   ├── database.js        # MongoDB connection
│   ├── email.js           # Email service configuration
│   └── surya.js           # Surya OCR configuration
├── controllers/           # Business logic
│   ├── adminController.js # Admin management
│   ├── authController.js  # Authentication
│   ├── expenseController.js # Expense operations
│   ├── ocrController.js   # OCR processing
│   └── userController.js  # User management
├── middleware/            # Express middleware
│   ├── auth.js           # Authentication middleware
│   ├── upload.js         # File upload handling
│   └── validation.js     # Input validation
├── models/               # MongoDB schemas
│   ├── ApprovalRule.js   # Approval workflow rules
│   ├── Company.js        # Company information
│   ├── Expense.js        # Expense records
│   └── User.js           # User accounts
├── python/               # Python OCR service
│   ├── requirements.txt  # Python dependencies
│   ├── setup.py         # OCR setup script
│   └── surya_ocr.py     # Surya OCR integration
├── routes/               # API routes
│   ├── admin.js         # Admin endpoints
│   ├── auth.js          # Authentication endpoints
│   ├── expenses.js      # Expense endpoints
│   ├── ocr.js           # OCR endpoints
│   └── users.js         # User endpoints
└── utils/                # Utility services
    ├── currencyService.js # Currency conversion
    ├── emailService.js   # Email notifications
    └── suryaOcrService.js # OCR service wrapper
```

## 📋 Prerequisites

### System Requirements
- **Node.js** >= 16.x
- **Python** >= 3.8
- **MongoDB** >= 5.0
- **npm** or **yarn**

### Python Dependencies
- PyTorch >= 1.9.0
- Surya OCR >= 0.4.0
- OpenCV >= 4.5.0
- Pillow >= 8.0.0
- Transformers >= 4.20.0

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/MihirPatel2105/odooXAmalthea_25.git
cd odooXAmalthea_25/backend
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Set Up Python Environment
```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
cd python
pip install -r requirements.txt

# Run setup script
python setup.py
```

### 4. Configure Environment Variables
Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/expense_management

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret
JWT_REFRESH_SECRET=your_super_secure_refresh_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# OCR Configuration
SURYA_MODEL_PATH=./python/models
OCR_CONFIDENCE_THRESHOLD=0.7
MAX_FILE_SIZE=10MB

# Currency API (Optional)
CURRENCY_API_KEY=your_currency_api_key
```

### 5. Start MongoDB
```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 🚀 Running the Application

### Development Mode
```bash
# Start the server with auto-reload
npm run dev
```

### Production Mode
```bash
# Start the server
npm start
```

### Test OCR Installation
```bash
# Verify Surya OCR setup
npm run test:ocr
```

### Set Up OCR Service
```bash
# Initialize OCR models and dependencies
npm run setup-ocr
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user and company
```json
{
  "email": "user@company.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp",
  "role": "admin"
}
```

#### POST `/api/auth/login`
User login
```json
{
  "email": "user@company.com",
  "password": "securePassword123"
}
```

### Expense Management

#### POST `/api/expenses`
Submit new expense with receipt
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "receipt=@/path/to/receipt.jpg" \
  -F "amount=25.99" \
  -F "currency=USD" \
  -F "category=meals" \
  -F "description=Business lunch"
```

#### GET `/api/expenses/my`
Get user's expenses with pagination
```bash
curl -X GET "http://localhost:3000/api/expenses/my?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### GET `/api/expenses/pending-approvals`
Get expenses pending approval (Managers/Admins)
```bash
curl -X GET http://localhost:3000/api/expenses/pending-approvals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### OCR Processing

#### POST `/api/ocr/process`
Process receipt image with OCR
```bash
curl -X POST http://localhost:3000/api/ocr/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "receipt=@/path/to/receipt.jpg"
```

#### POST `/api/ocr/validate`
Validate and correct OCR results
```json
{
  "ocrId": "ocr_result_id",
  "corrections": {
    "amount": 25.99,
    "vendor": "Restaurant ABC",
    "date": "2024-01-15"
  }
}
```

### Admin Operations

#### GET `/api/admin/dashboard`
Get company dashboard data
```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### POST `/api/admin/approval-rules`
Create approval workflow rule
```json
{
  "name": "High Value Expenses",
  "conditions": {
    "amountRange": { "min": 500, "max": 10000 },
    "categories": ["travel", "equipment"]
  },
  "approvalFlow": [
    {
      "sequence": 1,
      "approverType": "manager",
      "required": true
    },
    {
      "sequence": 2,
      "approverType": "specific_user",
      "approverId": "admin_user_id",
      "required": true
    }
  ]
}
```

## 🔧 Configuration

### OCR Settings
The Surya OCR service can be configured in `config/surya.js`:
```javascript
module.exports = {
  modelPath: process.env.SURYA_MODEL_PATH || './python/models',
  confidenceThreshold: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) || 0.7,
  maxImageSize: process.env.MAX_FILE_SIZE || '10MB',
  supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
  timeout: 30000 // 30 seconds
};
```

### Database Configuration
MongoDB connection settings in `config/database.js`:
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
```

## 🧪 Testing

### Run OCR Tests
```bash
npm run test:ocr
```

### Manual API Testing
Use the provided Postman collection or test with curl:
```bash
# Health check
curl http://localhost:3000/health

# Test OCR installation
curl http://localhost:3000/api/ocr/test
```

## 📊 Monitoring & Logging

The application includes comprehensive logging using Morgan:
- HTTP request logging
- Error tracking
- OCR processing logs
- Database operation logs

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate limiting** to prevent API abuse
- **Input validation** using express-validator
- **File upload security** with type and size restrictions
- **CORS protection** for cross-origin requests
- **Helmet.js** for HTTP header security

## 🚨 Troubleshooting

### Common Issues

#### OCR Installation Problems
```bash
# Reinstall Python dependencies
cd python
pip install --upgrade surya-ocr torch torchvision

# Test installation
python -c "import surya; print('Surya OCR installed successfully')"
```

#### MongoDB Connection Issues
```bash
# Check MongoDB status
systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

#### Memory Issues with OCR
If you encounter memory issues during OCR processing:
- Reduce image size before processing
- Adjust `OCR_CONFIDENCE_THRESHOLD` in `.env`
- Consider using CPU-only mode for PyTorch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support and questions:
- Create an issue on GitHub
- Email: support@example.com
- Documentation: [Project Wiki](https://github.com/MihirPatel2105/odooXAmalthea_25/wiki)

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with accounting software
- [ ] Multi-language OCR support
- [ ] Real-time notifications
- [ ] Advanced approval workflows
- [ ] API rate limiting improvements
- [ ] Docker containerization

---

Built with ❤️ using Node.js, Express, MongoDB, and Surya OCR
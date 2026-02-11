# Student Analysis Dashboard

A production-ready Next.js application for analyzing student performance and predicting academic outcomes using machine learning.

## 🚀 Features

- **Teacher Dashboard**: Manage students, grades, and view class analytics with full CRUD operations
- **Student Dashboard**: View grades, performance charts, and ML-powered predictions
- **ML-Powered Predictions**: Predict student grades using a Flask-based ML service
- **Role-Based Access Control**: Secure API routes with JWT authentication and RBAC
- **Real-Time Analytics**: Class averages, risk level distribution, and performance metrics

## 📋 Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- Python 3.8+ (for ML service)
- npm or yarn

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd student_analysis
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=student_analysis

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production

# Flask ML Service
FLASK_API_URL=http://127.0.0.1:5000/predict
```

### 3. Set Up Database

Run the migration script to create tables and seed initial data:

```bash
npm run migrate
```

This will:
- Create the database if it doesn't exist
- Create all required tables (users, students, grades, predictions)
- Seed initial data including a teacher account with hashed passwords

### 4. Start the ML Service

In a separate terminal:

```bash
cd ml-service
pip install flask pandas joblib scikit-learn
python predict_script.py
```

The ML service will run on `http://127.0.0.1:5000`

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@school.vps | password123 |
| Student | student@school.vps | password123 |

## 📚 API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user and get JWT token |

### Students

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/students` | GET | ✅ | Get all students |
| `/api/students` | POST | ✅ Teacher | Add new student |
| `/api/students/[id]` | GET | ✅ | Get student by ID |
| `/api/students/[id]` | PUT | ✅ Teacher | Update student |
| `/api/students/[id]` | DELETE | ✅ Teacher | Delete student |

### Grades

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/grades` | GET | ✅ | Get all grades |
| `/api/grades` | POST | ✅ Teacher | Add new grade |
| `/api/grades/[id]` | GET | ✅ | Get grade by ID |
| `/api/grades/[id]` | PUT | ✅ Teacher | Update grade |
| `/api/grades/[id]` | DELETE | ✅ Teacher | Delete grade |
| `/api/grades/student/[studentId]` | GET | ✅ | Get grades for student |

### Predictions

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/predictions` | POST | ✅ | Get ML prediction for student |
| `/api/predictions/save` | POST | ✅ | Save prediction to database |
| `/api/predictions/save?studentId=x` | GET | ✅ | Get latest prediction for student |
| `/api/predictions/student/[studentId]` | GET | ✅ | Get prediction history |

### Analytics

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/analytics/class-average` | GET | ✅ Teacher | Get class statistics |

## 🗄️ Database Schema

### Tables

- **users**: Authentication credentials and roles
- **students**: Student demographics and academic metadata
- **grades**: Individual grade records
- **predictions**: ML prediction history

See `schema.sql` for complete table definitions with constraints and indexes.

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt-based password storage
- **RBAC Middleware**: Server-side role enforcement
- **Input Validation**: All inputs validated before database operations
- **SQL Injection Prevention**: Parameterized queries throughout

## 📁 Project Structure

```
student_analysis/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication
│   │   ├── students/       # Student CRUD
│   │   ├── grades/         # Grade CRUD
│   │   ├── predictions/    # ML predictions
│   │   └── analytics/      # Analytics endpoints
│   ├── lib/                # Utility functions
│   │   ├── auth.ts        # Password hashing
│   │   └── jwt.ts         # JWT utilities
│   ├── student_dashboard/  # Student UI
│   └── teacher_dashboard/  # Teacher UI
├── ml-service/             # Flask ML service
│   └── predict_script.py
├── middleware.ts           # Auth & RBAC middleware
├── schema.sql              # Database schema
├── migrate.js              # Migration script
└── db.ts                   # Database connection
```

## 🧪 Testing

### Test Authentication

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@school.vps","password":"password123"}'
```

### Test Protected Endpoint

```bash
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🐛 Troubleshooting

### Database Connection Issues

1. Ensure MySQL is running
2. Verify credentials in `.env.local`
3. Check that the database exists: `npm run migrate`

### ML Service Not Responding

1. Ensure Flask service is running on port 5000
2. Check that model files exist in `ml-service/`:
   - `linear_regression_model.pkl`
   - `grade_scaler.pkl`


## 📝 License

MIT License

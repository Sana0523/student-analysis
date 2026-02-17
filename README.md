# 🎓 Student Analysis Dashboard

AI-powered student performance prediction system with explainable machine learning, interactive What-If analysis, and comprehensive reporting.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![Next.js](https://img.shields.io/badge/next.js-15-black)
![Tests](https://img.shields.io/badge/tests-passing-green)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Academic Contributions](#-academic-contributions)
- [License](#-license)

---

## 🎯 Overview

The Student Analysis Dashboard is a comprehensive academic performance prediction system that uses machine learning to identify at-risk students and provide actionable insights for educators.

**Problem Solved:** Traditional student management systems are reactive—they only report past performance. Our system is **proactive**, using AI to predict future outcomes and explain the underlying factors.

**Target Users:**
- **Teachers:** Get early warnings about struggling students with specific intervention recommendations
- **Students:** Understand what behaviors affect their grades through interactive What-If simulations

---

## ✨ Key Features

### 🤖 Explainable AI (XAI)
- **SHAP-based predictions:** Not just "what" but "why" a student is at risk
- **Feature importance visualization:** See which factors (study hours, absences, etc.) impact grades most
- **Natural language explanations:** "High Risk: Primary concerns are Absences (15) and Failures (2)"

### 🎯 Multi-Model Comparison
- **Three ML models:** Linear Regression, Random Forest, XGBoost
- **Real-time metrics:** Compare R² scores, MAE, RMSE across models
- **Model selection:** Choose the best model for your dataset

### 🔄 What-If Simulation
- **Interactive counseling tool:** Adjust study hours and absences with sliders
- **Real-time predictions:** See immediate impact of behavior changes
- **Actionable insights:** "If student increases study time to 8h/week, grade could improve by 12%"

### 📊 Advanced Visualizations
- **Correlation heatmap:** Understand relationships between study habits and performance
- **Attendance trends:** Track how attendance affects predicted grades over time
- **Feature importance charts:** Visual breakdown of prediction factors

### 📄 PDF Report Generation
- **Professional reports:** Download comprehensive student progress reports
- **AI insights included:** Predictions, risk levels, and recommendations
- **One-click export:** Generate and download PDFs instantly

### 🔒 Secure Authentication
- **JWT-based auth:** Secure token-based authentication
- **Role-based access:** Separate dashboards for teachers and students
- **bcrypt password hashing:** Industry-standard security

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Chart.js, React-Chartjs-2
- **Testing:** Jest, React Testing Library

### Backend
- **API:** Next.js API Routes
- **ML Service:** Flask (Python)
- **Models:** scikit-learn, XGBoost
- **Explainability:** SHAP
- **PDF Generation:** ReportLab

### Database
- **Development:** MySQL (local)
- **Production:** PlanetScale (serverless MySQL)

### Deployment
- **Frontend:** Vercel
- **ML Service:** Railway
- **Database:** PlanetScale

---

## 🏗️ System Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│   Next.js (Vercel)              │
│  ┌──────────────────────────┐   │
│  │  Pages & Components      │   │
│  │  - Teacher Dashboard     │   │
│  │  - Student Dashboard     │   │
│  │  - What-If Simulator     │   │
│  └──────────┬───────────────┘   │
│             │                    │
│  ┌──────────▼───────────────┐   │
│  │  API Routes              │   │
│  │  - /api/predictions      │   │
│  │  - /api/reports          │   │
│  │  - /api/auth             │   │
│  └──────────┬───────────────┘   │
│             │                    │
│  ┌──────────▼───────────────┐   │
│  │  JWT Middleware          │   │
│  │  (RBAC enforcement)      │   │
│  └──────────────────────────┘   │
└─────────┬───────────────────────┘
          │
          ├──────────────┐
          │              │
          ▼              ▼
┌────────────────┐  ┌───────────────┐
│ Flask ML       │  │ MySQL DB      │
│ (Railway)      │  │ (PlanetScale) │
│                │  │               │
│ - 3 Models     │  │ - Users       │
│ - SHAP         │  │ - Students    │
│ - PDF Gen      │  │ - Grades      │
└────────────────┘  └───────────────┘
```

See [System Architecture Diagram](docs/diagrams/system-architecture.md) for detailed Mermaid flow.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- MySQL 8.0+

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/student-analysis-dashboard.git
cd student-analysis-dashboard/student_analysis
```

#### 2. Setup Database

```bash
# Create database and run migrations
npm run migrate
```

Or manually:
```bash
mysql -u root -p
CREATE DATABASE student_dashboard;
mysql -u root -p student_dashboard < schema.sql
```

#### 3. Setup Backend (Flask ML Service)

```bash
cd ml-service

# Install dependencies
pip install -r requirements.txt

# Train models (if not already trained)
python train_all_models.py

# Start Flask server
python predict_script.py
```

Flask runs on `http://localhost:5000`

#### 4. Setup Frontend (Next.js)

```bash
# From student_analysis root
npm install

# Create .env.local
cp .env.example .env.local

# Edit .env.local with your config
# Then start development server
npm run dev
```

Next.js runs on `http://localhost:3000`

#### 5. Login

**Teacher Account:**
- Email: `teacher@school.vps`
- Password: `password123`

**Student Account:**
- Email: `student@school.vps`
- Password: `password123`

---

## 🧪 Testing

### Backend Tests (Python)

```bash
cd ml-service
pytest tests/ -v
pytest tests/ --cov=. --cov-report=html
```

**Test suites:** Predictions, Model Metrics, PDF Generation, Scaler & Features

### Frontend Tests (JavaScript)

```bash
npm test
npm run test:coverage
```

**Test suites:** FeatureImportanceChart, ModelSelector

### Test Files
- `ml-service/tests/test_predictions.py` - ML prediction logic, model validation, PDF generation
- `__tests__/components/FeatureImportanceChart.test.tsx` - Feature importance visualization
- `__tests__/components/ModelSelector.test.tsx` - Model selection component

---

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
| `/api/grades/[id]` | GET/PUT/DELETE | ✅ | CRUD by ID |
| `/api/grades/student/[studentId]` | GET | ✅ | Get grades for student |

### Predictions

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/predictions` | POST | ✅ | Get ML prediction for student |
| `/api/predictions/save` | POST | ✅ | Save prediction to database |
| `/api/predictions/simulate` | POST | ✅ | What-If simulation |
| `/api/predictions/student/[studentId]` | GET | ✅ | Get prediction history |

### Analytics & Reports

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/analytics/class-average` | GET | ✅ Teacher | Get class statistics |
| `/api/analytics/attendance-trend/[studentId]` | GET | ✅ | Attendance trend data |
| `/api/ml/model-metrics` | GET | ✅ | Get ML model performance metrics |
| `/api/reports/student/[studentId]` | GET | ✅ | Generate PDF report |

---

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete deployment guide.

### Quick Deploy

#### Deploy Flask to Railway

```bash
cd ml-service
railway login
railway init
railway up
```

#### Deploy Next.js to Vercel

```bash
vercel
vercel --prod
```

---

## 📖 Documentation

### Diagrams
- [ER Diagram](docs/diagrams/er-diagram.md) - Database schema
- [Login Sequence](docs/diagrams/login-sequence.md) - Authentication flow
- [Prediction Sequence](docs/diagrams/prediction-sequence.md) - ML prediction flow
- [System Architecture](docs/diagrams/system-architecture.md) - Overall architecture

---

## 🏗️ Project Structure

```
student_analysis/
├── app/
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication
│   │   ├── students/           # Student CRUD
│   │   ├── grades/             # Grade CRUD
│   │   ├── predictions/        # ML predictions + What-If
│   │   ├── analytics/          # Class analytics
│   │   ├── ml/                 # Model metrics
│   │   └── reports/            # PDF report generation
│   ├── components/             # React components
│   │   ├── FeatureImportanceChart.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── WhatIfSimulator.tsx
│   │   └── AttendanceTrendChart.tsx
│   ├── lib/                    # Utility functions
│   │   ├── auth.ts            # Password hashing
│   │   └── jwt.ts             # JWT utilities
│   ├── student_dashboard/      # Student UI
│   └── teacher_dashboard/      # Teacher UI
├── components/                  # Shared components
│   ├── GradeTable.tsx
│   ├── PredictionCard.tsx
│   └── StudentTable.tsx
├── ml-service/                  # Flask ML service
│   ├── predict_script.py       # Flask API server
│   ├── train_all_models.py     # Model training
│   ├── generate_report.py      # PDF generation
│   ├── grade_prediction.py     # Core prediction logic
│   ├── requirements.txt
│   ├── Procfile                # Railway deployment
│   ├── railway.json
│   └── tests/                  # Pytest test suite
├── __tests__/                   # Jest test suite
│   └── components/
├── docs/                        # Documentation
│   └── diagrams/               # Mermaid diagrams
├── middleware.ts                # Auth & RBAC middleware
├── schema.sql                  # Database schema
├── migrate.js                  # Migration script
├── db.ts                       # Database connection
├── jest.config.js              # Jest configuration
├── vercel.json                 # Vercel deployment config
├── DEPLOYMENT.md               # Deployment guide
└── README.md                   # This file
```

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with `jose` library
- **Password Hashing**: bcrypt-based password storage
- **RBAC Middleware**: Server-side role enforcement on all protected routes
- **Input Validation**: All inputs validated before database operations
- **SQL Injection Prevention**: Parameterized queries throughout
- **CORS Configuration**: Properly configured cross-origin policies

---

## 🎓 Academic Contributions

This project demonstrates several novel aspects:

1. **XAI in Education:** SHAP explanations combined with student grade prediction
2. **What-If Analysis:** Interactive counseling tool for proactive academic intervention
3. **Multi-Model Framework:** Transparent ML comparison for educational datasets
4. **Actionable Insights:** Transform black-box predictions into understandable recommendations

### Research Gaps Addressed
- Lack of interpretability in educational ML systems
- Absence of proactive tools for educators
- Limited personalization in student support systems

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- Dataset: [UCI Student Performance Dataset](https://archive.ics.uci.edu/ml/datasets/student+performance)
- SHAP Library: [slundberg/shap](https://github.com/slundberg/shap)
- Inspiration: Need for proactive student intervention systems

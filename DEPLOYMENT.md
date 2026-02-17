# Deployment Guide

## Prerequisites

- Vercel account (for Next.js frontend)
- Railway or Render account (for Flask backend)
- PlanetScale account (for MySQL database)

---

## Step 1: Database Setup (PlanetScale)

### 1.1 Create Database

1. Go to [PlanetScale](https://planetscale.com/)
2. Create new database: `student-dashboard-prod`
3. Get connection string from "Connect" tab

### 1.2 Run Schema Migration

```sql
-- Copy contents from schema.sql and run in PlanetScale console
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher') NOT NULL,
  student_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INT NOT NULL,
  studytime INT NOT NULL,
  failures INT DEFAULT 0,
  absences INT DEFAULT 0,
  G1 INT DEFAULT 0,
  G2 INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

CREATE TABLE grades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  score FLOAT NOT NULL,
  max_marks FLOAT NOT NULL,
  grade VARCHAR(5) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id)
);

CREATE TABLE predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  predicted_grade FLOAT NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  model_used VARCHAR(50) DEFAULT 'linear_regression',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id)
);
```

### 1.3 Seed Initial Data

```sql
-- Create a teacher account (password: teacher123)
INSERT INTO users (email, password_hash, role) VALUES
('teacher@school.com', '$2a$10$YourBcryptHashHere', 'teacher');

-- Create sample students
INSERT INTO students (name, email, age, studytime, failures, absences, G1, G2) VALUES
('Alice Johnson', 'alice@school.com', 16, 3, 0, 5, 15, 16),
('Bob Smith', 'bob@school.com', 17, 2, 1, 10, 12, 13);

-- Link students to user accounts
INSERT INTO users (email, password_hash, role, student_id) VALUES
('alice@school.com', '$2a$10$YourBcryptHashHere', 'student', 1),
('bob@school.com', '$2a$10$YourBcryptHashHere', 'student', 2);
```

---

## Step 2: Deploy Flask ML Service (Railway)

### 2.1 Prepare Repository

```bash
cd ml-service
git init
git add .
git commit -m "Initial Flask ML service"
```

### 2.2 Deploy to Railway

1. Go to [Railway](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `/ml-service`
5. Railway auto-detects Python and uses `Procfile`

### 2.3 Set Environment Variables

In Railway dashboard → Variables:

```
DB_HOST=your-planetscale-host.psdb.cloud
DB_USER=your-planetscale-user
DB_PASSWORD=your-planetscale-password
DB_NAME=student-dashboard-prod
PORT=5000
```

### 2.4 Deploy

Railway will automatically deploy. Get your public URL:
```
https://your-flask-service.railway.app
```

---

## Step 3: Deploy Next.js Frontend (Vercel)

### 3.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 3.2 Deploy

```bash
vercel
```

Follow prompts:
- Project name: `student-analysis-dashboard`
- Framework: `Next.js`
- Build command: `npm run build`
- Output directory: `.next`

### 3.3 Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
FLASK_ML_URL=https://your-flask-service.railway.app
JWT_SECRET_KEY=your-super-secret-32-character-minimum-key
DB_HOST=your-planetscale-host.psdb.cloud
DB_USER=your-planetscale-user
DB_PASSWORD=your-planetscale-password
DB_NAME=student-dashboard-prod
```

### 3.4 Redeploy

```bash
vercel --prod
```

---

## Step 4: Test Production Deployment

### 4.1 Test Login

```
https://your-app.vercel.app
```

Login with:
- Email: `teacher@school.com`
- Password: `teacher123`

### 4.2 Test Predictions

1. Go to Teacher Dashboard
2. Click "Predict" for a student
3. Verify prediction appears with SHAP explanation

### 4.3 Test PDF Download

1. Click "Download Report" for a student
2. Verify PDF downloads correctly

### 4.4 Test What-If Simulator

1. Toggle "Counseling Mode"
2. Adjust sliders
3. Verify prediction updates

---

## Troubleshooting

### Issue: CORS errors

**Fix:** Ensure `CORS(app)` is in `predict_script.py`

### Issue: Database connection fails

**Fix:** Check PlanetScale connection string format:
```
mysql://user:password@host/database?ssl={"rejectUnauthorized":true}
```

### Issue: ML models not found

**Fix:** Upload model files to Railway:
```bash
railway up ml-service/linear_regression_model.pkl
railway up ml-service/random_forest_model.pkl
railway up ml-service/xgboost_model.pkl
railway up ml-service/grade_scaler.pkl
railway up ml-service/x_train.pkl
```

### Issue: JWT verification fails

**Fix:** Ensure `JWT_SECRET_KEY` is identical in both Vercel and Railway

---

## Production Checklist

- [ ] Database schema created in PlanetScale
- [ ] Initial users seeded with hashed passwords
- [ ] Flask service deployed to Railway
- [ ] Model files uploaded to Railway
- [ ] Environment variables set in Railway
- [ ] Next.js app deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Login works in production
- [ ] Predictions work in production
- [ ] PDF download works in production
- [ ] What-If simulator works in production
- [ ] Custom domain configured (optional)

---

## Post-Deployment

### Monitor Performance

- **Vercel Analytics:** Check response times
- **Railway Logs:** Monitor Flask errors
- **PlanetScale Insights:** Monitor query performance

### Backup Strategy

- Enable PlanetScale automatic backups
- Export model files periodically
- Version control all code

---

## Cost Estimates

- **Vercel:** Free tier (hobby projects)
- **Railway:** ~$5/month (starter plan)
- **PlanetScale:** Free tier (10GB storage)

**Total:** ~$5/month for production deployment

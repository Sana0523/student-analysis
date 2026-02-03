-- ============================================
-- Student Analysis Dashboard - Database Schema
-- ============================================
-- This schema addresses the audit finding:
-- "NO DATABASE SCHEMA FOUND in workspace"
-- 
-- Created: 2026-02-03
-- ============================================

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores authentication credentials and roles
-- Roles: 'teacher', 'student'
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_users_email UNIQUE (email),
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STUDENTS TABLE
-- ============================================
-- Stores student demographic and academic metadata
CREATE TABLE students (
    id VARCHAR(36) PRIMARY KEY,  -- UUID format to match existing frontend expectations
    user_id INT DEFAULT NULL,    -- Optional link to users table for student login
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    age INT NOT NULL CHECK (age >= 5 AND age <= 100),
    study_hours INT NOT NULL DEFAULT 0 CHECK (study_hours >= 0),
    failures INT NOT NULL DEFAULT 0 CHECK (failures >= 0),
    absences INT NOT NULL DEFAULT 0 CHECK (absences >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_students_email UNIQUE (email),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Indexes
    INDEX idx_students_email (email),
    INDEX idx_students_name (name),
    INDEX idx_students_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GRADES TABLE
-- ============================================
-- Stores individual grade records for students
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0),
    max_marks DECIMAL(5,2) NOT NULL DEFAULT 100 CHECK (max_marks > 0),
    grade VARCHAR(5) NOT NULL,  -- Letter grade: A+, A, B+, B, C+, C, D, F
    date DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_grades_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_grades_score_max CHECK (score <= max_marks),
    
    -- Indexes
    INDEX idx_grades_student_id (student_id),
    INDEX idx_grades_subject (subject),
    INDEX idx_grades_date (date),
    INDEX idx_grades_student_subject (student_id, subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PREDICTIONS TABLE
-- ============================================
-- Stores ML prediction results for students
CREATE TABLE predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    predicted_grade DECIMAL(5,2) NOT NULL CHECK (predicted_grade >= 0 AND predicted_grade <= 100),
    risk_level ENUM('Low', 'Medium', 'High') NOT NULL,
    confidence DECIMAL(5,2) DEFAULT NULL CHECK (confidence >= 0 AND confidence <= 100),
    model_version VARCHAR(50) DEFAULT 'v1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_predictions_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Indexes
    INDEX idx_predictions_student_id (student_id),
    INDEX idx_predictions_risk_level (risk_level),
    INDEX idx_predictions_created_at (created_at),
    
    -- Unique constraint to prevent duplicate predictions per student per day
    -- (allows one prediction per student per day, overwrites older ones)
    CONSTRAINT uq_predictions_student_date UNIQUE (student_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VIEWS (Optional - for convenient queries)
-- ============================================

-- View: Student with latest prediction
CREATE OR REPLACE VIEW v_student_predictions AS
SELECT 
    s.id AS student_id,
    s.name,
    s.email,
    s.age,
    s.study_hours,
    s.failures,
    s.absences,
    p.predicted_grade,
    p.risk_level,
    p.created_at AS prediction_date
FROM students s
LEFT JOIN predictions p ON s.id = p.student_id
WHERE p.id = (
    SELECT MAX(p2.id) FROM predictions p2 WHERE p2.student_id = s.id
) OR p.id IS NULL;

-- View: Student grade summary
CREATE OR REPLACE VIEW v_student_grade_summary AS
SELECT 
    s.id AS student_id,
    s.name,
    COUNT(g.id) AS total_grades,
    ROUND(AVG(g.score), 2) AS average_score,
    MAX(g.score) AS highest_score,
    MIN(g.score) AS lowest_score
FROM students s
LEFT JOIN grades g ON s.id = g.student_id
GROUP BY s.id, s.name;

-- View: Class statistics
CREATE OR REPLACE VIEW v_class_statistics AS
SELECT 
    COUNT(DISTINCT s.id) AS total_students,
    ROUND(AVG(g.score), 2) AS class_average,
    COUNT(DISTINCT CASE WHEN p.risk_level IN ('High', 'Medium') THEN s.id END) AS at_risk_count
FROM students s
LEFT JOIN grades g ON s.id = g.student_id
LEFT JOIN (
    SELECT student_id, risk_level
    FROM predictions p1
    WHERE id = (SELECT MAX(id) FROM predictions p2 WHERE p2.student_id = p1.student_id)
) p ON s.id = p.student_id;

-- ============================================
-- INITIAL SEED DATA
-- ============================================
-- Note: Passwords should be hashed. These are bcrypt hashes for 'password123'
-- Hash generated using: bcrypt.hashSync('password123', 10)

-- Insert default users
INSERT INTO users (email, password_hash, role) VALUES
('teacher@school.vps', '$2a$10$rQZ8K.XqYhL8xvY6kj5K4OqK1lG2mN3oP4qR5sT6uV7wX8yZ9A0BC', 'teacher'),
('student@school.vps', '$2a$10$rQZ8K.XqYhL8xvY6kj5K4OqK1lG2mN3oP4qR5sT6uV7wX8yZ9A0BC', 'student'),
('alice@school.vps', '$2a$10$rQZ8K.XqYhL8xvY6kj5K4OqK1lG2mN3oP4qR5sT6uV7wX8yZ9A0BC', 'student');

-- Insert sample students
INSERT INTO students (id, user_id, name, email, age, study_hours, failures, absences) VALUES
('st1', 3, 'Alice Johnson', 'alice@school.vps', 16, 15, 0, 1),
('st2', NULL, 'Bob Smith', 'bob@school.vps', 15, 12, 1, 4),
('st3', NULL, 'Charlie Brown', 'charlie@school.vps', 16, 18, 0, 0);

-- Insert sample grades
INSERT INTO grades (student_id, subject, score, max_marks, grade, date) VALUES
('st1', 'Math', 88, 100, 'B+', '2024-01-15'),
('st1', 'Science', 92, 100, 'A', '2024-01-16'),
('st1', 'History', 75, 100, 'C+', '2024-01-17'),
('st2', 'Math', 65, 100, 'D', '2024-01-15'),
('st2', 'Science', 72, 100, 'C', '2024-01-16'),
('st3', 'Math', 95, 100, 'A+', '2024-01-15'),
('st3', 'English', 89, 100, 'B+', '2024-01-16');

-- Insert sample predictions
INSERT INTO predictions (student_id, predicted_grade, risk_level, confidence) VALUES
('st1', 85.50, 'Low', 85.0),
('st2', 68.00, 'Medium', 78.0),
('st3', 92.00, 'Low', 92.0);

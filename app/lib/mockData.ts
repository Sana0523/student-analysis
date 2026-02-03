/**
 * Mock Data (DEPRECATED)
 * ======================
 * 
 * ⚠️ WARNING: This file is deprecated and should not be used.
 * All API routes now use the database instead.
 * 
 * This file is kept for reference only and will be removed in a future version.
 * See schema.sql for the proper database schema.
 * 
 * Migration Status:
 * - /api/auth/login → Now uses database (users table)
 * - /api/students → Now uses database (students table)
 * - /api/students/[id] → Now uses database
 * - /api/grades → Now uses database (grades table)
 * - /api/grades/student/[studentId] → Now uses database
 * - /api/predictions → Now stores to database (predictions table)
 */

// ============================================
// DEPRECATED - DO NOT USE IN NEW CODE
// ============================================

// These exports are maintained only for backward compatibility
// with any code that hasn't been migrated yet

export const users = [
  { id: 1, email: 'teacher@school.vps', password: 'password123', role: 'teacher' },
  { id: 2, email: 'student@school.vps', password: 'password123', role: 'student' },
  { id: 3, email: 'alice@school.vps', password: 'password123', role: 'student' },
];

export const students = [
  { 
    id: 'st1', 
    name: 'Alice Johnson', 
    email: 'alice@school.vps',
    age: 16,
    study_hours: 15,
    failures: 0,
    absences: 1,
  },
  { 
    id: 'st2', 
    name: 'Bob Smith', 
    email: 'bob@school.vps',
    age: 15,
    study_hours: 12,
    failures: 1,
    absences: 4,
  },
  { 
    id: 'st3', 
    name: 'Charlie Brown', 
    email: 'charlie@school.vps',
    age: 16,
    study_hours: 18,
    failures: 0,
    absences: 0,
  },
];

export const grades = [
  { id: 'g1', studentId: 'st1', subject: 'Math', score: 88, grade: 'B+' },
  { id: 'g2', studentId: 'st1', subject: 'Science', score: 92, grade: 'A' },
  { id: 'g3', studentId: 'st1', subject: 'History', score: 75, grade: 'C+' },
  { id: 'g4', studentId: 'st2', subject: 'Math', score: 65, grade: 'D' },
  { id: 'g5', studentId: 'st2', subject: 'Science', score: 72, grade: 'C' },
  { id: 'g6', studentId: 'st3', subject: 'Math', score: 95, grade: 'A+' },
  { id: 'g7', studentId: 'st3', subject: 'English', score: 89, grade: 'B+' },
];

// Predictions export (previously missing, causing runtime error)
export const predictions = [
  { studentId: 'st1', riskLevel: 'Low', predicted_grade: 'B+', confidence: 85 },
  { studentId: 'st2', riskLevel: 'Medium', predicted_grade: 'C', confidence: 78 },
  { studentId: 'st3', riskLevel: 'Low', predicted_grade: 'A', confidence: 92 },
];


// This file contains mock data for development.
// In a real application, this data would come from a database.
// NOTE: These are 'let' instead of 'const' to allow adding new data from the UI.

let users = [
  { id: 1, email: 'teacher@school.vps', password: 'password123', role: 'teacher' },
  { id: 2, email: 'student@school.vps', password: 'password123', role: 'student' },
  { id: 3, email: 'alice@school.vps', password: 'password123', role: 'student' },
];

let students = [
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

let grades = [
  { id: 'g1', studentId: 'st1', subject: 'Math', score: 88, grade: 'B+' },
  { id: 'g2', studentId: 'st1', subject: 'Science', score: 92, grade: 'A' },
  { id: 'g3', studentId: 'st1', subject: 'History', score: 75, grade: 'C+' },
  { id: 'g4', studentId: 'st2', subject: 'Math', score: 65, grade: 'D' },
  { id: 'g5', studentId: 'st2', subject: 'Science', score: 72, grade: 'C' },
  { id: 'g6', studentId: 'st3', subject: 'Math', score: 95, grade: 'A+' },
  { id: 'g7', studentId: 'st3', subject: 'English', score: 89, grade: 'B+' },
];

// We are exporting the variables themselves so they can be modified in memory
// by the API routes when new data is added.
export { users, students, grades };


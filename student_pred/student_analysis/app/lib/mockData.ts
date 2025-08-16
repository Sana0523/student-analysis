export const users = [
  { id: 1, email: 'teacher@school.vps', password: 'password123', role: 'teacher' },
  { id: 2, email: 'student@school.vps', password: 'password123', role: 'student' },
  { id: 3, email: 'alex@school.vps', password: 'password123', role: 'student' },
];

export const students = [
  { 
    id: 'st1', 
    name: 'Alice Johnson', 
    class: 'Grade 10', 
    email: 'alice@school.vps',
    age: 16,
    study_hours: 15,
    profilePic: 'https://placehold.co/100x100?text=AJ' 
  },
  { 
    id: 'st2', 
    name: 'Bob Smith', 
    class: 'Grade 10', 
    email: 'bob@school.vps',
    age: 15,
    study_hours: 12,
    profilePic: 'https://placehold.co/100x100?text=BS' 
  },
  { 
    id: 'st3', 
    name: 'Charlie Brown', 
    class: 'Grade 10', 
    email: 'charlie@school.vps',
    age: 16,
    study_hours: 18,
    profilePic: 'https://placehold.co/100x100?text=CB' 
  },
  { 
    id: 'st4', 
    name: 'Diana Prince', 
    class: 'Grade 10', 
    email: 'diana@school.vps',
    age: 17,
    study_hours: 20,
    profilePic: 'https://placehold.co/100x100?text=DP' 
  },
  { 
    id: 'st5', 
    name: 'Edward Nygma', 
    class: 'Grade 10', 
    email: 'edward@school.vps',
    age: 15,
    study_hours: 8,
    profilePic: 'https://placehold.co/100x100?text=EN' 
  },
];

export const grades = [
  { studentId: 'st1', subject: 'Math', score: 88, grade: 'B+', date: '2024-01-15' },
  { studentId: 'st1', subject: 'Science', score: 92, grade: 'A-', date: '2024-01-16' },
  { studentId: 'st1', subject: 'History', score: 75, grade: 'C', date: '2024-01-17' },
  { studentId: 'st2', subject: 'Math', score: 95, grade: 'A', date: '2024-01-15' },
  { studentId: 'st2', subject: 'Science', score: 85, grade: 'B', date: '2024-01-16' },
  { studentId: 'st2', subject: 'History', score: 91, grade: 'A-', date: '2024-01-17' },
  { studentId: 'st3', subject: 'Math', score: 78, grade: 'C+', date: '2024-01-15' },
  { studentId: 'st3', subject: 'Science', score: 82, grade: 'B-', date: '2024-01-16' },
  { studentId: 'st3', subject: 'History', score: 88, grade: 'B+', date: '2024-01-17' },
  { studentId: 'st4', subject: 'Math', score: 99, grade: 'A+', date: '2024-01-15' },
  { studentId: 'st4', subject: 'Science', score: 96, grade: 'A', date: '2024-01-16' },
  { studentId: 'st4', subject: 'History', score: 93, grade: 'A-', date: '2024-01-17' },
  { studentId: 'st5', subject: 'Math', score: 81, grade: 'B-', date: '2024-01-15' },
  { studentId: 'st5', subject: 'Science', score: 79, grade: 'C+', date: '2024-01-16' },
  { studentId: 'st5', subject: 'History', score: 84, grade: 'B', date: '2024-01-17' },
];

export const predictions = [
  { 
    studentId: 'st1', 
    riskLevel: 'Low', 
    prediction: 'On track to pass all subjects.',
    predicted_grade: 'B+',
    confidence: 85
  },
  { 
    studentId: 'st2', 
    riskLevel: 'Low', 
    prediction: 'Expected to maintain high performance.',
    predicted_grade: 'A',
    confidence: 92
  },
  { 
    studentId: 'st3', 
    riskLevel: 'Medium', 
    prediction: 'At risk of falling behind in science.',
    predicted_grade: 'B-',
    confidence: 78
  },
  { 
    studentId: 'st4', 
    riskLevel: 'Low', 
    prediction: 'Expected to excel across the board.',
    predicted_grade: 'A+',
    confidence: 98
  },
  { 
    studentId: 'st5', 
    riskLevel: 'High', 
    prediction: 'Requires immediate intervention in all subjects.',
    predicted_grade: 'C',
    confidence: 65
  },
];
import { NextResponse } from 'next/server';
// Use a named import to match your db setup
import { db } from '@/db'; 
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

/**
 * Handles GET requests to fetch all students.
 */
export async function GET() {
  try {
    // Select specific columns for security and clarity
    const [rows] = await db.query('SELECT id, name, email, age, study_hours, failures, absences FROM students');
    return NextResponse.json({ success: true, students: rows });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch students." }, { status: 500 });
  }
}

/**
 * Handles POST requests to add a new student.
 */
export async function POST(request: Request) {
  try {
    const { name, email, age, study_hours, failures = 0, absences = 0 } = await request.json();

    // Basic validation to ensure required fields are present
    if (!name || !email || !age || !study_hours) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }
    
    // Generate a new unique ID for the student
    const newStudentId = uuidv4();

    // Insert the new student into the database
    await db.query(
      'INSERT INTO students (id, name, email, age, study_hours, failures, absences) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newStudentId, name, email, age, study_hours, failures, absences]
    );

    return NextResponse.json({ success: true, message: 'Student added successfully!', studentId: newStudentId }, { status: 201 });
  } catch (error) {
    console.error("Error adding student:", error);
    return NextResponse.json({ success: false, message: "Failed to add student." }, { status: 500 });
  }
}


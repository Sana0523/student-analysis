import { NextResponse } from 'next/server';
import path from 'path';
import {db} from '@/db';

export async function GET() {
    // console.log("Fetching grades from mock data...");
    // // Explicitly log the path to help debug
    // const mockDataPath = path.join(process.cwd(), 'lib', 'mockData.ts');
    // console.log(`Looking for mockData at: ${mockDataPath}`);

    // // Assuming the import is correct, this line should work
    // return NextResponse.json({ success: true, grades });
    try {
    const [rows] = await db.query(`
      SELECT g.id, g.student_id, g.subject, g.score, g.grade 
      FROM grades g
    `);
    return NextResponse.json({ success: true, grades: rows }); 
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch grades' }, { status: 500 });
  }
}
// Handles POST requests to add a new grade
export async function POST(request: Request) {
  try {
    const { studentId, subject, score } = await request.json();

    // Basic validation
    if (!studentId || !subject || typeof score === 'undefined') {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    // Determine the letter grade based on the score
    let letterGrade = 'F';
    if (score >= 90) letterGrade = 'A';
    else if (score >= 80) letterGrade = 'B';
    else if (score >= 70) letterGrade = 'C';
    else if (score >= 60) letterGrade = 'D';

    // Insert the new grade into the database
    const [result] = await db.query(
      'INSERT INTO grades (student_id, subject, score, grade) VALUES (?, ?, ?, ?)',
      [studentId, subject, score, letterGrade]
    );

    // You can check result.insertId to confirm the insert
    return NextResponse.json({ success: true, message: 'Grade added successfully!' }, { status: 201 });

  } catch (error) {
    console.error("Error adding grade:", error);
    return NextResponse.json({ success: false, message: "Failed to add grade." }, { status: 500 });
  }
}


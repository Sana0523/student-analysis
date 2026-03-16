import { NextResponse } from 'next/server';
import {db} from '@/db';

const DEFAULT_MAX_MARKS = 20;

function calculateLetterGrade(score: number, maxMarks: number = DEFAULT_MAX_MARKS): string {
  const percentage = (score / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  if (percentage >= 45) return 'D+';
  if (percentage >= 40) return 'D';
  return 'F';
}

export async function GET() {
    try {
    const [rows] = await db.query(`
      SELECT g.id, g.student_id, g.subject, g.score, g.max_marks, g.grade 
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
    const body = await request.json();
    const studentId = body.studentId ?? body.student_id;
    const subject = body.subject;
    const numericScore = Number(body.score);
    const maxMarks = Number(body.max_marks ?? DEFAULT_MAX_MARKS);

    // Basic validation
    if (!studentId || !subject || Number.isNaN(numericScore)) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    if (numericScore < 0 || numericScore > maxMarks) {
      return NextResponse.json(
        { success: false, message: `Score must be between 0 and ${maxMarks}.` },
        { status: 400 }
      );
    }

    const letterGrade = calculateLetterGrade(numericScore, maxMarks);

    // Insert the new grade into the database
    await db.query(
      'INSERT INTO grades (student_id, subject, score, max_marks, grade) VALUES (?, ?, ?, ?, ?)',
      [studentId, subject, numericScore, maxMarks, letterGrade]
    );

    // You can check result.insertId to confirm the insert
    return NextResponse.json({ success: true, message: 'Grade added successfully!' }, { status: 201 });

  } catch (error) {
    console.error("Error adding grade:", error);
    return NextResponse.json({ success: false, message: "Failed to add grade." }, { status: 500 });
  }
}


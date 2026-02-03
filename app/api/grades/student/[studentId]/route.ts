/**
 * Grades by Student ID API Route
 * ==============================
 * Addresses audit finding: "Data Source Inconsistency (Mock vs DB)"
 * Now uses database instead of mock data.
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { RowDataPacket } from 'mysql2';

interface GradeRow extends RowDataPacket {
  id: number;
  student_id: string;
  subject: string;
  score: number;
  max_marks: number;
  grade: string;
  date: string;
}

/**
 * GET /api/grades/student/[studentId]
 * Fetch all grades for a specific student
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    
    // Verify student exists
    const [studentCheck] = await db.query<RowDataPacket[]>(
      'SELECT id FROM students WHERE id = ?',
      [studentId]
    );
    
    if (studentCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }
    
    // Fetch grades for the student
    const [grades] = await db.query<GradeRow[]>(
      `SELECT id, student_id as studentId, subject, score, max_marks, grade, 
              DATE_FORMAT(date, '%Y-%m-%d') as date 
       FROM grades 
       WHERE student_id = ? 
       ORDER BY date DESC`,
      [studentId]
    );
    
    if (grades.length === 0) {
      return NextResponse.json(
        { success: true, message: "No grades found for this student", grades: [] }
      );
    }

    return NextResponse.json({
      success: true,
      grades: grades
    });
    
  } catch (error) {
    console.error("Error fetching student grades:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}
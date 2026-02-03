/**
 * Grade by ID API Route
 * =====================
 * Addresses audit finding: "Missing CRUD Operations"
 * 
 * Provides GET, PUT, DELETE for individual grades.
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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
 * Calculate letter grade from score
 */
function calculateLetterGrade(score: number, maxMarks: number = 100): string {
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

/**
 * GET /api/grades/[id]
 * Fetch a single grade by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [rows] = await db.query<GradeRow[]>(
      `SELECT id, student_id as studentId, subject, score, max_marks as maxMarks, 
              grade, DATE_FORMAT(date, '%Y-%m-%d') as date 
       FROM grades WHERE id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Grade not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      grade: rows[0]
    });
    
  } catch (error) {
    console.error("Error fetching grade:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch grade" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/grades/[id]
 * Update a grade's details
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    let { subject, score, max_marks, grade } = body;

    // Check if grade exists
    const [existing] = await db.query<GradeRow[]>(
      'SELECT id, max_marks FROM grades WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Grade not found" },
        { status: 404 }
      );
    }

    // Validate score doesn't exceed max_marks
    const effectiveMaxMarks = max_marks ?? existing[0].max_marks;
    if (score !== undefined && score > effectiveMaxMarks) {
      return NextResponse.json(
        { success: false, message: `Score (${score}) cannot exceed max marks (${effectiveMaxMarks})` },
        { status: 400 }
      );
    }

    // Auto-calculate letter grade if score is provided and grade is not
    if (score !== undefined && grade === undefined) {
      grade = calculateLetterGrade(score, effectiveMaxMarks);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (subject !== undefined) { updates.push('subject = ?'); values.push(subject); }
    if (score !== undefined) { updates.push('score = ?'); values.push(score); }
    if (max_marks !== undefined) { updates.push('max_marks = ?'); values.push(max_marks); }
    if (grade !== undefined) { updates.push('grade = ?'); values.push(grade); }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(id);
    await db.query(
      `UPDATE grades SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch and return the updated grade
    const [updated] = await db.query<GradeRow[]>(
      `SELECT id, student_id as studentId, subject, score, max_marks as maxMarks, 
              grade, DATE_FORMAT(date, '%Y-%m-%d') as date 
       FROM grades WHERE id = ?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Grade updated successfully",
      grade: updated[0]
    });

  } catch (error) {
    console.error("Error updating grade:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update grade" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/grades/[id]
 * Delete a grade record
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if grade exists
    const [existing] = await db.query<GradeRow[]>(
      'SELECT id, subject, student_id FROM grades WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Grade not found" },
        { status: 404 }
      );
    }

    // Delete the grade
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM grades WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to delete grade" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Grade for '${existing[0].subject}' deleted successfully`
    });

  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete grade" },
      { status: 500 }
    );
  }
}

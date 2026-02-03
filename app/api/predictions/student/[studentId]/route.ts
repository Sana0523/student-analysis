/**
 * Predictions by Student ID API Route
 * ====================================
 * Addresses audit finding: "predictions export NOT FOUND in mockData"
 * Now uses database instead of non-existent mock data.
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { RowDataPacket } from 'mysql2';

interface PredictionRow extends RowDataPacket {
  id: number;
  student_id: string;
  predicted_grade: number;
  risk_level: string;
  confidence: number;
  created_at: string;
}

/**
 * GET /api/predictions/student/[studentId]
 * Fetch all predictions for a specific student (history)
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
    
    // Fetch all predictions for the student
    const [predictions] = await db.query<PredictionRow[]>(
      `SELECT id, student_id as studentId, predicted_grade, risk_level, confidence,
              created_at as createdAt
       FROM predictions 
       WHERE student_id = ? 
       ORDER BY created_at DESC`,
      [studentId]
    );
    
    if (predictions.length === 0) {
      return NextResponse.json(
        { success: false, message: "No predictions found for this student" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      predictions: predictions
    });
    
  } catch (error) {
    console.error("Error fetching student predictions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}
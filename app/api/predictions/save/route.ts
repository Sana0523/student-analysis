/**
 * Save Prediction API Route
 * =========================
 * Addresses audit finding: "Missing predictions table"
 * 
 * Stores ML predictions in the database.
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface PredictionRow extends RowDataPacket {
  id: number;
  student_id: string;
  predicted_grade: number;
  risk_level: string;
  confidence: number;
  created_at: string;
}

/**
 * POST /api/predictions/save
 * Save a prediction result to the database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, predicted_grade, risk_level, confidence } = body;

    // Validate required fields
    if (!studentId || predicted_grade === undefined || !risk_level) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: studentId, predicted_grade, risk_level' },
        { status: 400 }
      );
    }

    // Verify student exists
    const [studentCheck] = await db.query<RowDataPacket[]>(
      'SELECT id FROM students WHERE id = ?',
      [studentId]
    );

    if (studentCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    // Insert the prediction
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO predictions (student_id, predicted_grade, risk_level, confidence) 
       VALUES (?, ?, ?, ?)`,
      [studentId, predicted_grade, risk_level, confidence || null]
    );

    // Fetch and return the saved prediction
    const [saved] = await db.query<PredictionRow[]>(
      `SELECT id, student_id as studentId, predicted_grade, risk_level, confidence, 
              created_at as createdAt 
       FROM predictions WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'Prediction saved successfully',
      prediction: saved[0]
    }, { status: 201 });

  } catch (error) {
    console.error("Error saving prediction:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save prediction" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/predictions/save?studentId=xxx
 * Get the latest prediction for a student from database
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'studentId query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch the latest prediction for the student
    const [predictions] = await db.query<PredictionRow[]>(
      `SELECT id, student_id as studentId, predicted_grade, risk_level, confidence, 
              created_at as createdAt 
       FROM predictions 
       WHERE student_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [studentId]
    );

    if (predictions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No predictions found for this student' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      prediction: predictions[0]
    });

  } catch (error) {
    console.error("Error fetching prediction:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch prediction" },
      { status: 500 }
    );
  }
}

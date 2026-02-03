/**
 * Student by ID API Route
 * =======================
 * Addresses audit finding: "Data Source Inconsistency (Mock vs DB)"
 * Now uses database instead of mock data.
 * 
 * Also adds PUT and DELETE handlers for Phase 3: Missing CRUD Operations
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface StudentRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  age: number;
  study_hours: number;
  failures: number;
  absences: number;
}

/**
 * GET /api/students/[id]
 * Fetch a single student by ID
 */
export async function GET(
  request: Request, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const [rows] = await db.query<StudentRow[]>(
      'SELECT id, name, email, age, study_hours, failures, absences FROM students WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      student: rows[0]
    });
    
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/students/[id]
 * Update a student's details
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, email, age, study_hours, failures, absences } = body;

    // Check if student exists
    const [existing] = await db.query<StudentRow[]>(
      'SELECT id FROM students WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's unique
    if (email) {
      const [emailCheck] = await db.query<StudentRow[]>(
        'SELECT id FROM students WHERE email = ? AND id != ?',
        [email, id]
      );
      
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { success: false, message: "Email already in use by another student" },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (age !== undefined) { updates.push('age = ?'); values.push(age); }
    if (study_hours !== undefined) { updates.push('study_hours = ?'); values.push(study_hours); }
    if (failures !== undefined) { updates.push('failures = ?'); values.push(failures); }
    if (absences !== undefined) { updates.push('absences = ?'); values.push(absences); }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(id);
    await db.query(
      `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch and return the updated student
    const [updated] = await db.query<StudentRow[]>(
      'SELECT id, name, email, age, study_hours, failures, absences FROM students WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
      student: updated[0]
    });

  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update student" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/students/[id]
 * Delete a student and their associated data (grades, predictions cascade via FK)
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Check if student exists
    const [existing] = await db.query<StudentRow[]>(
      'SELECT id, name FROM students WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Delete the student (grades and predictions cascade automatically via FK)
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM students WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to delete student" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Student '${existing[0].name}' deleted successfully`
    });

  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete student" },
      { status: 500 }
    );
  }
}
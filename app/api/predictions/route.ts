import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/db';

// It's crucial this URL is correct, especially for deployment.
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:5000/predict';
// This MUST match the key used in the login route. Using an environment variable is best practice.
const SECRET_KEY = process.env.JWT_SECRET_KEY || "my-super-secret-key-for-development";

// GET: Fetch predictions for all students (for teacher dashboard)
export async function GET() {
    try {
        const [students] = await pool.query('SELECT * FROM students');
        const [grades] = await pool.query('SELECT * FROM grades');

        const studentList = students as any[];
        const gradeList = grades as any[];

        const predictions = studentList.map(student => {
            const studentGrades = gradeList.filter(g => g.student_id === student.id);

            const avgScore = studentGrades.length > 0
                ? studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length
                : 0;

            let riskScore = 0;

            // Grade-based risk
            if (avgScore === 0) riskScore += 20; // No grades yet
            else if (avgScore < 50) riskScore += 40;
            else if (avgScore < 60) riskScore += 30;
            else if (avgScore < 70) riskScore += 15;
            else if (avgScore < 80) riskScore += 5;

            // Study hours factor
            if (student.study_hours < 5) riskScore += 20;
            else if (student.study_hours < 10) riskScore += 10;

            // Failures factor
            if (student.failures > 2) riskScore += 25;
            else if (student.failures > 0) riskScore += 15;

            // Absences factor
            if (student.absences > 10) riskScore += 15;
            else if (student.absences > 5) riskScore += 10;

            let riskLevel: 'Low' | 'Medium' | 'High';
            if (riskScore >= 50) riskLevel = 'High';
            else if (riskScore >= 25) riskLevel = 'Medium';
            else riskLevel = 'Low';

            return {
                studentId: student.id,
                riskLevel: riskLevel,
                probability: Math.min(riskScore / 100, 1)
            };
        });

        return NextResponse.json(predictions);
    } catch (error) {
        console.error('Prediction GET error:', error);
        return NextResponse.json({ error: 'Failed to generate predictions' }, { status: 500 });
    }
}

// POST: Predict grade for a student
export async function POST(request: Request) {
    if (!SECRET_KEY) {
        console.error("JWT_SECRET_KEY is not set on the server.");
        return NextResponse.json({ success: false, message: "Authentication is not configured correctly." }, { status: 500 });
    }

    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: 'Unauthorized: No token provided' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify the token to protect the route
            jwt.verify(token, SECRET_KEY);
        } catch (error) {
            console.error("Invalid token:", error);
            return NextResponse.json({ success: false, message: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { studentData, max_marks } = body;

        // Validate that the necessary data is present
        if (!studentData || typeof max_marks === 'undefined') {
            return NextResponse.json({ success: false, message: 'Bad Request: Missing studentData or max_marks' }, { status: 400 });
        }

        // Forward the request to the Flask API
        const flaskResponse = await fetch(FLASK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // FIX: Renamed 'studentData' to 'student_data' to match the Python script's expectation.
            body: JSON.stringify({ student_data: studentData, max_marks }),
            signal: AbortSignal.timeout(10000), // 10-second timeout for the ML service
        });

        const predictionData = await flaskResponse.json();

        if (!flaskResponse.ok) {
            console.error('Error from Flask API:', predictionData.message || 'Unknown error');
            throw new Error(predictionData.message || 'Error from prediction service');
        }

        // FIXED: Wrap the Flask response in the format expected by React component
        return NextResponse.json({
            success: true,
            prediction: {
                predicted_grade: predictionData.predicted_grade,
                risk_level: predictionData.risk_level
            }
        });

    } catch (error: any) {
        console.error('Error in /api/predictions route:', error.message);
        return NextResponse.json({ success: false, message: `An internal server error occurred.` }, { status: 500 });
    }
}
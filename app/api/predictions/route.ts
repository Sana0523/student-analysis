import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// It's crucial this URL is correct, especially for deployment.
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:5000/predict';
// This MUST match the key used in the login route. Using an environment variable is best practice.
const SECRET_KEY = process.env.JWT_SECRET_KEY || "my-super-secret-key-for-development";

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
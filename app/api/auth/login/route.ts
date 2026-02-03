/**
 * Login API Route
 * ================
 * Addresses audit finding: "User Authentication Uses Mock Data"
 * 
 * Now queries the database for user authentication.
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { verifyPassword } from "@/app/lib/auth";
import jwt from 'jsonwebtoken';

// Use environment variable for production
const SECRET_KEY = process.env.JWT_SECRET_KEY || "my-super-secret-key-for-development";

interface UserRow {
    id: number;
    email: string;
    password_hash: string;
    role: 'teacher' | 'student';
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            );
        }

        // Query database for user
        const [rows] = await db.query<UserRow[]>(
            'SELECT id, email, password_hash, role FROM users WHERE email = ?',
            [email]
        );

        const user = rows[0];

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Verify password against hash
        const isValidPassword = await verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
            return NextResponse.json(
                { success: false, message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Create JWT payload (without password)
        const userPayload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        // Sign JWT token
        const accessToken = jwt.sign(userPayload, SECRET_KEY, { expiresIn: '1h' });

        return NextResponse.json({
            success: true,
            token: accessToken,
            user: userPayload
        });

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred during login" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { users } from "@/app/lib/mockData";
import jwt from 'jsonwebtoken';

// Use a static, hardcoded key for development.
// For production, this should be an environment variable.
const SECRET_KEY = "my-super-secret-key-for-development";

export async function POST(request: Request) {
    const body = await request.json();
    const { email, password } = body;

    const user = users.find(
        (u) => u.email === email && u.password === password 
    );

    if (user) {
        const userWithoutPassword = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        const accessToken = jwt.sign(userWithoutPassword, SECRET_KEY, { expiresIn: '1h' });

        return NextResponse.json({
            success: true,
            token: accessToken,
            user: userWithoutPassword
        });
    } else {
        return NextResponse.json(
            { success: false, message: "Invalid credentials" },
            { status: 401 }
        );
    }
}

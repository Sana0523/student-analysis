import { NextResponse } from 'next/server';
import path from 'path';
import db from '@/db';

export async function GET() {
    // console.log("Fetching grades from mock data...");
    // // Explicitly log the path to help debug
    // const mockDataPath = path.join(process.cwd(), 'lib', 'mockData.ts');
    // console.log(`Looking for mockData at: ${mockDataPath}`);

    // // Assuming the import is correct, this line should work
    // return NextResponse.json({ success: true, grades });
    try {
        const [rows] = await grades.query('SELECT * FROM grades');
        return NextResponse.json({ success: true, grades: rows });
    } catch (error) {
        console.error("Error fetching grades:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch grades." });
    }
}

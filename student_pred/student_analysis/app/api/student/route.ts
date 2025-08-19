import { NextResponse } from 'next/server';
import db from '@/db';

export async function GET() {
    // console.log("Fetching students from mock data...");
    
    // const studentsWithRisk = students.map(student => {
    //     const studentPrediction = predictions.find(p => p.studentId === student.id);
    //     const riskLevel = studentPrediction ? studentPrediction.riskLevel : 'N/A';
    //     return { ...student, risk_level: riskLevel };
    // });
    // return NextResponse.json({ success: true, students: studentsWithRisk });
    try {
        const [rows] =await db.query('SELECT * FROM STUDENTS');
        return NextResponse.json({ success: true, students: rows });
    }
    catch(error)
    {
        console.error("Error fetching students:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch students." });
    }
}

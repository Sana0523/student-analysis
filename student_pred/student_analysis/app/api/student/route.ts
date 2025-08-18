import { NextResponse } from 'next/server';
import { students, predictions } from '@/app/lib/mockData';

export async function GET() {
    console.log("Fetching students from mock data...");
    
    const studentsWithRisk = students.map(student => {
        const studentPrediction = predictions.find(p => p.studentId === student.id);
        const riskLevel = studentPrediction ? studentPrediction.riskLevel : 'N/A';
        return { ...student, risk_level: riskLevel };
    });
    return NextResponse.json({ success: true, students: studentsWithRisk });
}

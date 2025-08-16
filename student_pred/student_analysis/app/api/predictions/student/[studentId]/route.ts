import { NextResponse } from 'next/server';
import { predictions } from '@/app/lib/mockData';
export async function GET( request: Request, {params}: {params:{studentId: string}}) {
  const {studentId} = await params;
  const studentPredictions = predictions.filter(prediction => prediction.studentId === studentId);
  
  if (studentPredictions.length === 0) {
    return NextResponse.json(
      { success: false, message: "No predictions found for this student" },
      { status: 404 }
    );
  }

  return NextResponse.json(studentPredictions);
}
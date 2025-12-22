import { NextResponse } from 'next/server';
import {students,grades} from '@/app/lib/mockData';
 export async function GET(request: Request, context: { params: { id: string } }) {
  const { params } = context;
  const { id } = await params;
  const studentId=id;
  const student=students.find(s => s.id===studentId);
  if(!student)
  {
    return NextResponse.json(
      {success: false, message: "Student not found"},
      { status: 404 }
    );
  }
  return NextResponse.json({
    success: true,
    student: student
  });
}
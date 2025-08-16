import { NextResponse } from 'next/server';
import { grades } from '@/app/lib/mockData';
 export async function GET(request: Request,{params} :{params:{studentId:string}}) {
  const { studentId } = await params;
  const studentgrades=grades.filter(grade => grade.studentId === studentId);
  if(studentgrades.length === 0){
    return NextResponse.json(
      { success: false, message: "No grades found for this student" },
      { status: 404 }
    );
  }

  return NextResponse.json(studentgrades); 
}
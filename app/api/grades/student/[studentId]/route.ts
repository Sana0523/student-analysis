// C:\Users\sanaf\student_pred\student_analysis\app\api\grades\student\[studentId]\route.ts
import { NextResponse } from 'next/server';
import { grades } from '@/app/lib/mockData';
import { verifyJwt } from '@/app/lib/jwt';
 export async function GET(request: Request,{params} :{params:{studentId:string}}) {
  const authorization= request.headers.get('authorization');
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
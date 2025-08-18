import {NextResponse} from 'next/server';
import {grades} from '@/app/lib/mockData';
export async function GET() {
  return NextResponse.json({
    success: true,
    grades
  });
};



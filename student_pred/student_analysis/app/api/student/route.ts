import {NextResponse} from 'next/server';
import { students } from '@/app/lib/mockData';
export async function GET() {
  return NextResponse.json(students);
}
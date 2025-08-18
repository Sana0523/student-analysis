import { NextResponse} from 'next/server';
import {predictions} from '@/app/lib/mockData';
import path from 'path';
export async function GET() {
      return NextResponse.json({ success: true, predictions });
}
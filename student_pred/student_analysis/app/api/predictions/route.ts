import { NextResponse} from 'next/server';
import {predictions} from '@/app/lib/mockData';

export async function GET() {
  return NextResponse.json({
    success: true,
    predictions
  });
};
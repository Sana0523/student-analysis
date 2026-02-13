import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    // Mock data for now (in production, calculate from database)
    const weeks = [
      'Week 1', 'Week 2', 'Week 3', 'Week 4', 
      'Week 5', 'Week 6', 'Week 7', 'Week 8'
    ];
    
    // Simulate attendance degradation and grade correlation
    const seed = parseInt(studentId); // Use student ID as seed for consistent data
    
    // Use a simple seeded random function for consistency
    const seededRandom = (s: number, i: number) => {
      const x = Math.sin(s * 9301 + i * 49297) * 49297;
      return x - Math.floor(x);
    };

    const attendance_rate = weeks.map((_, i) => {
      const trend = 95 - (i * 3) - (seed % 10); // Declining trend
      const noise = seededRandom(seed, i) * 5 - 2.5;
      return Math.max(60, Math.min(100, trend + noise));
    });
    
    const predicted_grades = attendance_rate.map((att, i) => {
      // Grades correlate with attendance
      const baseGrade = 50 + (att * 0.5);
      const noise = seededRandom(seed, i + 100) * 5 - 2.5;
      return Math.max(40, Math.min(100, baseGrade + noise));
    });

    return NextResponse.json({
      weeks,
      attendance_rate: attendance_rate.map(v => parseFloat(v.toFixed(1))),
      predicted_grades: predicted_grades.map(v => parseFloat(v.toFixed(1)))
    });
  } catch (error) {
    console.error('Attendance trend API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance trend' },
      { status: 500 }
    );
  }
}

/**
 * Class Average Analytics API Route
 * ==================================
 * Addresses audit finding: "Class Average calculated client-side"
 * 
 * Provides server-side calculation of class statistics.
 */

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { RowDataPacket } from 'mysql2';

interface StatsRow extends RowDataPacket {
  total_students: number;
  class_average: number;
  total_grades: number;
}

interface SubjectStatsRow extends RowDataPacket {
  subject: string;
  average_score: number;
  student_count: number;
  highest_score: number;
  lowest_score: number;
}

interface RiskStatsRow extends RowDataPacket {
  risk_level: string;
  count: number;
}

/**
 * GET /api/analytics/class-average
 * Get comprehensive class statistics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy'); // 'subject' or null

    // Get overall class statistics
    const [overallStats] = await db.query<StatsRow[]>(`
      SELECT 
        COUNT(DISTINCT s.id) as total_students,
        ROUND(AVG(g.score), 2) as class_average,
        COUNT(g.id) as total_grades
      FROM students s
      LEFT JOIN grades g ON s.id = g.student_id
    `);

    // Get statistics grouped by subject
    const [subjectStats] = await db.query<SubjectStatsRow[]>(`
      SELECT 
        subject,
        ROUND(AVG(score), 2) as average_score,
        COUNT(DISTINCT student_id) as student_count,
        MAX(score) as highest_score,
        MIN(score) as lowest_score
      FROM grades
      GROUP BY subject
      ORDER BY subject
    `);

    // Get risk level distribution (from latest predictions per student)
    const [riskStats] = await db.query<RiskStatsRow[]>(`
      SELECT 
        p.risk_level,
        COUNT(*) as count
      FROM predictions p
      INNER JOIN (
        SELECT student_id, MAX(id) as max_id
        FROM predictions
        GROUP BY student_id
      ) latest ON p.id = latest.max_id
      GROUP BY p.risk_level
    `);

    // Calculate at-risk count
    const atRiskCount = riskStats
      .filter(r => r.risk_level === 'High' || r.risk_level === 'Medium')
      .reduce((sum, r) => sum + r.count, 0);

    return NextResponse.json({
      success: true,
      statistics: {
        overall: {
          totalStudents: overallStats[0]?.total_students || 0,
          classAverage: overallStats[0]?.class_average || 0,
          totalGrades: overallStats[0]?.total_grades || 0,
          atRiskCount: atRiskCount
        },
        bySubject: subjectStats,
        riskDistribution: riskStats
      }
    });

  } catch (error) {
    console.error("Error fetching class statistics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch class statistics" },
      { status: 500 }
    );
  }
}

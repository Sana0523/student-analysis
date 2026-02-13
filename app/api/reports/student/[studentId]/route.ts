import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const flaskUrl = process.env.FLASK_ML_URL || 'http://localhost:5000';

    // Forward request to Flask
    const response = await fetch(
      `${flaskUrl}/generate-report/${studentId}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { error: 'Report generation failed' };
      }
      return NextResponse.json(
        { error: error.error || 'Report generation failed' },
        { status: response.status }
      );
    }

    // Get PDF blob
    const pdfBlob = await response.blob();

    // Return PDF with proper headers
    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=student_${studentId}_report.pdf`,
      },
    });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

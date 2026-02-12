import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const flaskUrl = process.env.FLASK_ML_URL || 'http://127.0.0.1:5000';

    // Forward simulation request to Flask
    const response = await fetch(`${flaskUrl}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Simulation failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Simulation API error:', error);
    return NextResponse.json(
      { error: 'Simulation request failed' },
      { status: 500 }
    );
  }
}

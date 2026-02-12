import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const flaskUrl = process.env.FLASK_ML_URL || 'http://127.0.0.1:5000';

    const response = await fetch(`${flaskUrl}/model-metrics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch model metrics' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Model metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to ML service' },
      { status: 500 }
    );
  }
}

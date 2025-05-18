import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { frames } = await request.json();

    const pythonResponse = await fetch(`${process.env.BACKEND_URL}/analyze-stress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames }),
    });

    const result = await pythonResponse.json();

    if (!pythonResponse.ok || result.error) {
      throw new Error(result.error || 'Backend error');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Stress analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze stress levels' }, { status: 500 });
  }
}

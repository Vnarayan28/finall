import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');

  if (!topic) {
    return NextResponse.json({ error: 'Missing topic parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(`http://localhost:8000/api/generate-lecture?topic=${encodeURIComponent(topic)}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json({ error: err.error || `Upstream error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

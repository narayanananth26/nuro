import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Nuro Health Monitor/1.0',
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return NextResponse.json({
      status: response.status,
      responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check URL health' },
      { status: 500 }
    );
  }
}

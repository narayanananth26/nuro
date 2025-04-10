import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    try {
      // Validate URL format
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Perform health check
    const startTime = Date.now();
    let status = 200;
    let responseTime = 0;

    try {
      // First try with HEAD request (faster, less bandwidth)
      try {
        const headResponse = await fetch(url, { 
          method: 'HEAD',
          headers: {
            // Add a user agent to appear more like a browser
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        status = headResponse.status;
        responseTime = Date.now() - startTime;
      } catch (headError) {
        // If HEAD fails, fallback to GET request
        console.log('HEAD request failed, trying GET:', headError);
        const getResponse = await fetch(url, { 
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        status = getResponse.status;
        responseTime = Date.now() - startTime;
      }
    } catch (error) {
      console.error('Health check failed with both HEAD and GET:', error);
      status = 500;
      responseTime = Date.now() - startTime;
    }

    return NextResponse.json({
      status,
      responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in check-url API:', error);
    return NextResponse.json(
      { error: 'Failed to check URL' },
      { status: 500 }
    );
  }
}

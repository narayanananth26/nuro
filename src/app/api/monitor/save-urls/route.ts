import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import UrlMonitor from '@/models/UrlMonitor';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }

    await dbConnect();

    // Process each URL
    const results = await Promise.all(body.map(async (urlData: { url: string; interval: string }) => {
      try {
        // Validate URL
        new URL(urlData.url);

        // Convert interval to minutes
        const intervalMatch = urlData.interval.match(/^(\d+)([m|h])$/);
        if (!intervalMatch) {
          throw new Error('Invalid interval format');
        }

        const intervalNum = parseInt(intervalMatch[1]);
        const intervalUnit = intervalMatch[2];
        const intervalMinutes = intervalUnit === 'h' ? intervalNum * 60 : intervalNum;

        // Create or update the URL monitor
        const monitor = await UrlMonitor.findOneAndUpdate(
          { url: urlData.url, userId: session.user.id },
          {
            url: urlData.url,
            interval: intervalMinutes,
            userId: session.user.id,
            lastChecked: new Date(),
            status: 'UP',
            responseTime: 0,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );

        return {
          url: urlData.url,
          success: true,
          message: 'URL monitoring started/updated'
        };
      } catch (error) {
        return {
          url: urlData.url,
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process URL'
        };
      }
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in save-urls API:', error);
    return NextResponse.json(
      { error: 'Failed to save URLs' },
      { status: 500 }
    );
  }
}

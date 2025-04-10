import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { subDays } from 'date-fns';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const days = timeRange === '30d' ? 30 : 7;

    const db = await connectToDatabase();
    const collection = db.collection('UrlMonitor');

    const monitor = await collection.findOne({
      _id: new ObjectId(params.id)
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Filter logs for the specified time range
    const startDate = subDays(new Date(), days);
    const filteredLogs = monitor.logs.filter((log: any) => 
      new Date(log.timestamp) >= startDate
    );

    // Calculate daily uptime percentages
    const uptimeData = new Map();
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = subDays(now, i);
      const dateStr = date.toISOString().split('T')[0];
      uptimeData.set(dateStr, {
        date: dateStr,
        totalChecks: 0,
        successfulChecks: 0
      });
    }

    filteredLogs.forEach((log: any) => {
      const dateStr = new Date(log.timestamp).toISOString().split('T')[0];
      const dayData = uptimeData.get(dateStr);
      if (dayData) {
        dayData.totalChecks++;
        if (log.status === 'UP') {
          dayData.successfulChecks++;
        }
      }
    });

    const uptime = Array.from(uptimeData.values())
      .map(({ date, totalChecks, successfulChecks }) => ({
        date,
        uptime: totalChecks ? Math.round((successfulChecks / totalChecks) * 100) : 0
      }))
      .reverse();

    // Get recent response times (last 50 checks)
    const responseTimes = filteredLogs
      .slice(-50)
      .map((log: any) => ({
        timestamp: log.timestamp,
        responseTime: log.responseTime
      }));

    return NextResponse.json({
      uptime,
      responseTimes
    });
  } catch (error) {
    console.error('Error fetching monitor logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitor logs' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import UrlMonitor from '@/models/UrlMonitor';
import { dbConnect } from '@/lib/mongodb';
import { Parser } from 'json2csv';
import { MonitorLog } from '@/types/monitor';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { monitorId, format } = await req.json();

    if (!monitorId || !format || !['csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    await dbConnect();
    const monitor = await UrlMonitor.findOne({ 
      _id: monitorId,
      ...(session?.user ? { userId: session.user.id } : {})
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    const logs = monitor.logs.map((log: MonitorLog) => ({
      status: log.status,
      responseTime: log.responseTime,
      timestamp: log.timestamp
    }));

    if (format === 'json') {
      return new NextResponse(JSON.stringify(logs, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename=logs-${monitorId}.json`
        }
      });
    } else {
      const fields = ['status', 'responseTime', 'timestamp'];
      const parser = new Parser({ fields });
      const csv = parser.parse(logs);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=logs-${monitorId}.csv`
        }
      });
    }
  } catch (error) {
    console.error('Export logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

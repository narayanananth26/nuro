import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import UrlMonitor from '@/models/UrlMonitor';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received request body:', body);
    
    const { url, interval } = body;
    console.log('Extracted values - url:', url, 'interval:', interval, 'type:', typeof interval);
    console.log('Is interval exactly zero?', interval === 0);
    
    if (!url || typeof interval !== 'number' || interval < 0) {
      return NextResponse.json({ error: 'Valid URL and interval are required' }, { status: 400 });
    }

    await dbConnect();

    // Check if URL is reachable
    const startTime = Date.now();
    let healthCheck;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      healthCheck = {
        status: response.status,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Health check failed:', error);
      healthCheck = {
        status: 500,
        responseTime: 0
      };
    }

    // Create log entry first to validate it
    const logEntry = {
      timestamp: new Date(),
      status: healthCheck.status < 400 ? "UP" : "DOWN",
      responseTime: healthCheck.responseTime,
      interval: interval
    };
    console.log('Created log entry:', logEntry);

    // Check if monitor already exists for this user and URL
    let monitor = await UrlMonitor.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
      url: url
    });
    
    console.log('Existing monitor found:', monitor ? 'Yes' : 'No');

    if (monitor) {
      // Update existing monitor
      monitor.logs = monitor.logs || [];
      monitor.logs.push(logEntry);
      
      // Keep only last 1000 logs
      if (monitor.logs.length > 1000) {
        monitor.logs = monitor.logs.slice(-1000);
      }

      monitor = await monitor.save();
      console.log('Updated monitor:', monitor);
    } else {
      // Create new monitor
      monitor = await UrlMonitor.create({
        userId: new mongoose.Types.ObjectId(session.user.id),
        url,
        logs: [logEntry]
      });
      
      console.log('Created new monitor:', monitor);
    }

    return NextResponse.json(monitor);
  } catch (error) {
    console.error('Error saving URL:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

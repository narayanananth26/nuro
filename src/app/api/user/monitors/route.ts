import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import UrlMonitor from '@/models/UrlMonitor';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = session.user.id;

    console.log('Fetching monitors for user:', userId);
    
    const monitors = await UrlMonitor.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    })
    .select('url status lastChecked responseTime interval logs')
    .sort({ createdAt: -1 });
    
    console.log('Found monitors:', monitors.length);
    monitors.forEach((monitor, index) => {
      console.log(`Monitor ${index + 1}:`, {
        url: monitor.url,
        interval: monitor.interval,
        intervalType: typeof monitor.interval
      });
    });

    // Convert interval to number to ensure consistent type
    const processedMonitors = monitors.map(monitor => {
      const processed = monitor.toObject();
      processed.interval = Number(processed.interval);
      return processed;
    });
    
    console.log('Processed monitors with numeric intervals');
    processedMonitors.forEach((monitor, index) => {
      console.log(`Processed monitor ${index + 1}:`, {
        url: monitor.url,
        interval: monitor.interval,
        intervalType: typeof monitor.interval
      });
    });
    
    return NextResponse.json(processedMonitors);
  } catch (error) {
    console.error('Error fetching monitors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, url, interval } = await request.json();
    console.log('Update request received:', { id, url, interval });
    
    await dbConnect();

    // First, find the monitor to get access to its logs
    const existingMonitor = await UrlMonitor.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!existingMonitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Create an update that sets both the monitor interval and updates the interval in all logs
    const updateOperation: { $set: Record<string, any> } = {
      $set: { 
        url,
        interval
      }
    };

    // If there are logs, update the interval in the latest log
    if (existingMonitor.logs && existingMonitor.logs.length > 0) {
      // Get the latest log index
      const lastLogIndex = existingMonitor.logs.length - 1;
      
      // Update the interval in the latest log
      updateOperation.$set[`logs.${lastLogIndex}.interval`] = interval;
      
      console.log('Updating monitor with logs:', updateOperation);
    }

    // Apply the update
    const monitor = await UrlMonitor.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(id), 
        userId: new mongoose.Types.ObjectId(session.user.id) 
      },
      updateOperation,
      { new: true }
    );

    console.log('Monitor updated:', {
      url: monitor.url,
      interval: monitor.interval,
      logsCount: monitor.logs.length,
      latestLogInterval: monitor.logs.length > 0 ? monitor.logs[monitor.logs.length - 1].interval : 'N/A'
    });

    return NextResponse.json(monitor);
  } catch (error) {
    console.error('Error updating monitor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Monitor ID required' }, { status: 400 });
    }

    await dbConnect();

    const monitor = await UrlMonitor.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

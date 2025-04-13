import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import UrlMonitor from '@/models/UrlMonitor';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all monitors for the user
    const monitors = await UrlMonitor.find({ 
      userId: new mongoose.Types.ObjectId(session.user.id) 
    });

    // Extract all logs from all monitors and add URL and monitor ID information
    const allLogs = monitors.flatMap(monitor => 
      monitor.logs.map((log: any) => ({
        ...log.toObject(),
        url: monitor.url,
        monitorId: monitor._id,
        monitorInterval: monitor.interval
      }))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(allLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { monitorId, status, responseTime, timestamp } = body;

    if (!monitorId || !status || !responseTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the monitor and update it with the new log
    const monitor = await UrlMonitor.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(monitorId),
        userId: new mongoose.Types.ObjectId(session.user.id)
      },
      { 
        $push: { 
          logs: { 
            timestamp: timestamp || new Date(),
            status,
            responseTime 
          } 
        },
        $set: {
          status,
          responseTime,
          lastChecked: timestamp || new Date()
        }
      },
      { new: true }
    );

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, monitor });
  } catch (error) {
    console.error('Error updating monitor logs:', error);
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
    const logId = searchParams.get('logId');
    
    if (!id) {
      return NextResponse.json({ error: 'Monitor ID required' }, { status: 400 });
    }

    await dbConnect();

    // Find the monitor first
    const monitor = await UrlMonitor.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // If logId is provided, remove only that specific log
    if (logId) {
      await UrlMonitor.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $pull: { logs: { _id: new mongoose.Types.ObjectId(logId) } } }
      );
      
      return NextResponse.json({ success: true, message: 'Log entry deleted' });
    }
    
    // If no logs left, delete the entire monitor
    const updatedMonitor = await UrlMonitor.findOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    if (!updatedMonitor || updatedMonitor.logs.length === 0) {
      await UrlMonitor.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(id)
      });
      
      return NextResponse.json({ success: true, message: 'Monitor deleted as no logs remained' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    // Get query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      // Fetch a single monitor by ID
      const monitor = await UrlMonitor.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(session.user.id)
      });

      if (!monitor) {
        return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
      }

      return NextResponse.json(monitor);
    }

    // Fetch all monitors for the user
    const monitors = await UrlMonitor.find({ 
      userId: new mongoose.Types.ObjectId(session.user.id) 
    }).sort({ createdAt: -1 });

    return NextResponse.json(monitors);
  } catch (error) {
    console.error('Error fetching monitors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, url, interval } = body;

    if (!id || !url) {
      return NextResponse.json({ error: 'ID and URL are required' }, { status: 400 });
    }

    if (typeof interval !== 'number' || interval < 0) {
      return NextResponse.json({ error: 'Valid interval is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if URL already exists for another monitor
    const existingMonitor = await UrlMonitor.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
      url: url,
      _id: { $ne: new mongoose.Types.ObjectId(id) }
    });

    if (existingMonitor) {
      return NextResponse.json({ error: 'This URL is already being monitored' }, { status: 409 });
    }

    // Update the monitor
    const monitor = await UrlMonitor.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(session.user.id)
      },
      { 
        $set: { 
          url,
          interval
        } 
      },
      { new: true }
    );

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json(monitor);
  } catch (error) {
    console.error('Error updating monitor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Delete the monitor
    const monitor = await UrlMonitor.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Monitor deleted successfully' });
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

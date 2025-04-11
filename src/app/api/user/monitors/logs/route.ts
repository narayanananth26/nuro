import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import UrlMonitor from '@/models/UrlMonitor';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';

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

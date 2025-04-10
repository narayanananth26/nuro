import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import UrlMonitor from "@/models/UrlMonitor";

async function checkUrlHealth(url: string) {
  const startTime = Date.now();
  try {
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;
    return {
      status: response.status,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 500,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, interval } = await req.json();
  if (!url || !interval) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await dbConnect();

  try {
    // Perform initial health check
    const healthCheck = await checkUrlHealth(url);
    
    // Create monitor with initial health check
    const monitor = await UrlMonitor.create({
      userId: session.user.id,
      url,
      interval,
      lastChecked: new Date(),
      status: healthCheck.status < 400 ? "UP" : "DOWN",
      responseTime: healthCheck.responseTime,
      logs: [{
        timestamp: healthCheck.timestamp,
        status: healthCheck.status < 400 ? "UP" : "DOWN",
        responseTime: healthCheck.responseTime,
      }],
    });

    return NextResponse.json({ 
      success: true, 
      monitor,
      healthCheck 
    });
  } catch (err) {
    console.error("Error saving URL:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

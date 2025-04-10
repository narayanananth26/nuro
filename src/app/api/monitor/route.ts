import { startMonitoringJob } from "@/lib/monitor";
import { NextResponse } from "next/server";

// Initialize the monitoring job
let isMonitoringStarted = false;

if (!isMonitoringStarted) {
  startMonitoringJob();
  isMonitoringStarted = true;
}

export async function GET() {
  return NextResponse.json({ status: "Monitoring service is running" });
}

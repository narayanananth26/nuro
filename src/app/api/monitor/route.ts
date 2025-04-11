import { NextResponse } from "next/server";

// The monitoring job is now handled by an external scheduler
// calling the /api/cron/check-urls endpoint

export async function GET() {
  return NextResponse.json({ status: "Monitoring service is available" });
}

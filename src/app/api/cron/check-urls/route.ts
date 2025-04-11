import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { checkDueUrls } from "@/lib/monitor";

/**
 * API endpoint for external schedulers (like cron-job.org) to trigger URL monitoring
 * This endpoint should be called every minute by an external scheduler
 * 
 * Authentication: Requires CRON_SECRET in Authorization header
 * Format: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  console.log("API route handler executed");
  
  // // Verify authorization
  // const authHeader = request.headers.get("Authorization");
  // const token = authHeader?.split(" ")[1];
  // const cronSecret = process.env.CRON_SECRET;

  // if (!cronSecret) {
  //   console.error("CRON_SECRET environment variable not set");
  //   return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  // }

  // if (!token || token !== cronSecret) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
    console.log("Attempting to connect to database");
    await dbConnect();
    console.log("Database connection successful");
    
    // Check all due URLs using the centralized logic in monitor.ts
    console.log("Calling checkDueUrls()");
    const checksPerformed = await checkDueUrls();
    console.log(`Checks performed: ${checksPerformed.length}`);

    return NextResponse.json({ 
      status: "success", 
      message: `Checked ${checksPerformed.length} URLs`,
      checksPerformed
    });
  } catch (error) {
    console.error("Error in URL monitoring:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Also support POST requests for flexibility
export const POST = GET;

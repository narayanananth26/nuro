import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { checkDueUrls } from "@/lib/monitor";

export async function GET(request: NextRequest) {
  console.log("API route handler executed");
  
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

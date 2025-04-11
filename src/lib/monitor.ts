import cron from "node-cron";
import UrlMonitor from "@/models/UrlMonitor";
import dbConnect from "@/lib/dbConnect";

async function attemptPing(url: string): Promise<{ success: boolean; responseTime?: number }> {
  try {
    const start = Date.now();
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const responseTime = Date.now() - start;
    if (!res.ok) throw new Error("Non-200");
    return { success: true, responseTime };
  } catch {
    return { success: false };
  }
}

async function logMonitorResult(monitor: any, status: "UP" | "DOWN" | "UNKNOWN", responseTime: number | null) {
  const now = new Date();
  
  // Get interval from the most recent log or default to 5
  const interval = monitor.logs.length > 0 ? monitor.logs[monitor.logs.length - 1].interval : 5;

  monitor.logs.push({
    timestamp: now,
    status,
    responseTime: responseTime || 0,
    interval: interval
  });

  // Keep only last 1000 logs to prevent document size issues
  if (monitor.logs.length > 1000) {
    monitor.logs = monitor.logs.slice(-1000);
  }

  monitor.status = status;
  monitor.responseTime = responseTime || null;
  monitor.lastChecked = now;

  await monitor.save();
}

async function handlePing(monitor: any) {
  const url = monitor.url;
  const retries = [5000, 10000, 20000]; // 5s, 10s, 20s

  const result = await attemptPing(url);
  if (result.success) {
    return logMonitorResult(monitor, "UP", result.responseTime ?? null);
  }

  // Retry logic with exponential backoff
  for (let i = 0; i < retries.length; i++) {
    await new Promise((res) => setTimeout(res, retries[i]));
    const retryResult = await attemptPing(url);
    if (retryResult.success) {
      return logMonitorResult(monitor, "UP", retryResult.responseTime ?? null);
    }
  }

  // All retries failed
  return logMonitorResult(monitor, "DOWN", null);
}

export function startMonitoringJob() {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      await dbConnect();
      
      const now = new Date();
      
      // Fetch all monitors due for checking
      const dueMonitors = await UrlMonitor.find({
        $or: [
          { lastChecked: null },
          {
            lastChecked: { 
              $lte: new Date(now.getTime() - 60000) // At least 1 minute ago
            }
          },
        ],
      });

      // Process each monitor
      for (const monitor of dueMonitors) {
        // Get interval from the most recent log or default to 5 minutes
        const interval = monitor.logs.length > 0 ? monitor.logs[monitor.logs.length - 1].interval : 5;
        
        // Skip monitors with interval=0 (one-time checks)
        if (interval === 0) continue;
        
        const intervalMs = interval * 60 * 1000;
        const timeSinceLastCheck = now.getTime() - (monitor.lastChecked?.getTime() || 0);

        if (!monitor.lastChecked || timeSinceLastCheck >= intervalMs) {
          await handlePing(monitor).catch(console.error);
        }
      }
    } catch (error) {
      console.error("Error in monitoring job:", error);
    }
  });
}

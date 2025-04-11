# Nuro URL Monitoring System Workflow

This document explains the workflow of the Nuro URL monitoring system, focusing on how the scheduler works and how it integrates with the rest of the application.

## System Overview

Nuro is a URL monitoring system that allows users to:
- Register URLs for monitoring
- Set monitoring intervals (or choose a one-time check)
- View monitoring results and statistics
- Receive notifications about status changes

The system consists of several components working together:
1. **Frontend UI**: User interface for managing monitored URLs
2. **Authentication System**: Secures access to the application
3. **Database**: Stores URL monitoring data and user information
4. **Monitoring Engine**: Checks URLs and records their status
5. **Scheduler**: Triggers URL checks based on configured intervals
6. **Notification System**: Alerts users about status changes

## Monitoring Workflow

### 1. URL Registration

When a user adds a new URL to monitor:

1. The user submits a URL and monitoring interval through the UI
2. The `save-url` API endpoint (`/api/monitor/save-url`) processes the request:
   - Validates the URL and interval
   - Performs an initial health check
   - Creates a new `UrlMonitor` document in MongoDB or updates an existing one
   - Sets the monitoring interval (in minutes) or 0 for "Once" (no recurring monitoring)
   - Records the initial status (UP/DOWN) and response time

### 2. Scheduled Monitoring

The system uses two approaches to check URLs:

#### A. Cron-based Scheduled Checks

1. An external cron job calls the `/api/cron/check-urls` endpoint every minute
2. The endpoint is secured with a secret key in the Authorization header
3. The `checkAllUrls` function in `monitor.ts` is executed, which:
   - Connects to the database
   - Finds all monitors that need checking based on their interval and last check time
   - Excludes URLs with interval=0 (one-time checks) that have already been checked
   - For each due monitor, calls `handlePing` to check the URL

#### B. Manual/One-time Checks

1. User can manually trigger a check via the UI
2. The `/api/monitor/check-monitor` endpoint processes the request
3. The `manuallyCheckUrl` function in `monitor.ts` is executed, which:
   - Verifies the monitor exists and belongs to the user
   - Calls `handlePing` to check the URL
   - Returns the updated monitor data

### 3. URL Checking Process

The URL checking process (`handlePing` function) works as follows:

1. Attempts to ping the URL using `attemptPing`
2. If successful, logs the result as "UP" with the response time
3. If unsuccessful, implements retry logic with exponential backoff:
   - Retries after 5 seconds, then 10 seconds, then 20 seconds
   - If any retry succeeds, logs the result as "UP"
   - If all retries fail, logs the result as "DOWN"

### 4. Result Logging

When a URL check completes, the `logMonitorResult` function:

1. Creates a log entry with timestamp, status, response time, and interval
2. Adds the entry to the monitor's logs array (limited to 1000 entries)
3. Updates the monitor's current status, response time, and last checked time
4. Creates a notification entry for status changes
5. Saves the updated monitor document to the database

### 5. Notification System

Notifications are handled as follows:

1. Each monitor document contains a `notifications` array (limited to 10 entries)
2. New notifications are added when URL status changes
3. The `/api/monitor/notify` endpoint:
   - Allows POST requests to add new notifications
   - Allows GET requests to retrieve notifications for the current user
4. The UI displays notifications to users and allows marking them as read

## Special Case: "Once" Option

URLs with interval=0 (the "Once" option) are handled specially:

1. They are only checked once (either when first added or when manually triggered)
2. They are excluded from automatic monitoring in the `checkAllUrls` function
3. The UI displays them with "Once" in the interval column instead of a time value

## Data Model

The primary data model is the `UrlMonitor` schema:

- `userId`: Reference to the user who owns this monitor
- `url`: The URL being monitored
- `interval`: Monitoring interval in minutes (0 for "Once")
- `logs`: Array of monitoring results (timestamp, status, responseTime, interval)
- `notifications`: Array of status change notifications (timestamp, status, responseTime, read)
- Additional fields: status, responseTime, lastChecked, etc.

## Authentication and Security

The system uses NextAuth.js for authentication:

1. Users must be authenticated to access the dashboard and API endpoints
2. Each monitor is associated with a specific user
3. API endpoints verify that users can only access their own monitors
4. The cron job endpoint is secured with a secret key

## Deployment Considerations

For the scheduler to work in production:

1. Set up an external cron job to call the `/api/cron/check-urls` endpoint every minute
2. Configure the `CRON_SECRET` environment variable with a secure random string
3. Include the secret in the Authorization header when calling the cron endpoint:
   ```
   Authorization: Bearer your-secret-key
   ```

## Error Handling and Resilience

The system implements several error handling mechanisms:

1. Exponential backoff for failed URL checks
2. Database connection error handling
3. Proper error responses from API endpoints
4. Logging of errors for debugging

## Conclusion

The Nuro URL monitoring system provides a robust solution for monitoring website availability and performance. The scheduler component ensures that URLs are checked at their configured intervals, while the monitoring engine handles the actual checking process and records the results.

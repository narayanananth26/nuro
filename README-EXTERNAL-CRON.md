# External URL Monitoring Scheduler

This document explains how to set up an external scheduler (like cron-job.org) to handle URL monitoring for Nuro.

## Overview

Nuro uses an external scheduler to periodically check URLs based on their monitoring intervals. This approach offers several advantages:
- More reliable scheduling than internal Node.js cron jobs
- Better scalability for production environments
- Reduced resource usage on the application server
- Improved separation of concerns

## Setup Instructions

### 1. Environment Configuration

Make sure your `.env` file includes the following variable:

```
CRON_SECRET=your-secure-random-string
```

This secret key is used to authenticate the external scheduler when it calls the monitoring endpoint.

### 2. Setting Up an External Scheduler

You can use any reliable external scheduling service like:
- [cron-job.org](https://cron-job.org/) (free)
- [EasyCron](https://www.easycron.com/)
- [SetCronJob](https://www.setcronjob.com/)
- AWS EventBridge Scheduler
- GCP Cloud Scheduler
- Azure Logic Apps

#### Using cron-job.org (Recommended)

1. Sign up for a free account at [cron-job.org](https://cron-job.org/)
2. Create a new cronjob with the following settings:
   - **URL**: Your application's URL + `/api/cron/check-urls` (e.g., `https://your-app.com/api/cron/check-urls`)
   - **Execution schedule**: Every 1 minute
   - **Authentication**:
     - Select "Custom HTTP Headers" (not "HTTP authentication")
     - Add a custom HTTP header:
       - Name: `Authorization`
       - Value: `Bearer your-secure-random-string` (same as your CRON_SECRET)
   - **Advanced Settings**:
     - **Time zone**: UTC
     - **Request method**: GET (or POST)
     - **Request body**: Leave empty
     - **Timeout**: 30 seconds
     - **Treat redirects with HTTP 3xx status code as success**: Check this option
   - **Notification**: Configure failure notifications as needed

### 3. Testing the Setup

To verify your external scheduler is working correctly:

1. Check your application logs for successful calls to the `/api/cron/check-urls` endpoint
2. Monitor the "Last Checked" timestamps in your URL monitors dashboard
3. Verify that URLs are being checked according to their configured intervals

## Endpoint Details

### `/api/cron/check-urls`

This endpoint is responsible for checking all URLs that are due for monitoring based on their interval and last check time.

- **Methods**: GET, POST
- **Authentication**: Requires `Authorization: Bearer <CRON_SECRET>` header
- **Response**: JSON with status and list of URLs checked
- **Behavior**:
  - Fetches all monitors due for checking based on their interval and last check time
  - Skips one-time URLs (interval = 0) that have already been checked
  - Performs HTTP requests to check URL status with retry logic
  - Updates monitor status and logs in the database
  - Returns a summary of the checks performed

## Troubleshooting

### Common Issues

1. **Unauthorized errors**: Verify your CRON_SECRET is correctly set in both your environment and the scheduler's Authorization header.

2. **No URLs being checked**: Check that you have URLs configured with valid intervals and that the database connection is working.

3. **Scheduler not triggering**: Verify your external scheduler is correctly configured and running. Check its logs for any errors.

4. **Duplicate checks**: If URLs are being checked too frequently, verify that only one scheduler is calling the endpoint.

## Security Considerations

- Keep your CRON_SECRET secure and rotate it periodically
- Use HTTPS for all scheduler calls to protect the secret key in transit
- Consider IP-based restrictions for additional security if your scheduler has a fixed IP

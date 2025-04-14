# External Cron Setup Guide

This document explains how to set up external cron jobs to perform automated health checks on monitored URLs.

## Overview

Nuro includes a cron API endpoint that checks all monitored URLs that are due for checking based on their configured intervals. While the application can use `node-cron` internally, it's recommended to set up external cron jobs for better reliability in a production environment.

## Cron API Endpoint

The application exposes a dedicated endpoint for URL health checks:

- **Endpoint**: `/api/cron/check-urls`
- **Methods**: GET or POST
- **Authentication**: Requires `CRON_SECRET` header

## Security

The cron endpoint is secured with the `CRON_SECRET` environment variable. This prevents unauthorized access to the endpoint.

Example request:
```bash
curl -X GET https://your-app-domain.com/api/cron/check-urls \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Setting Up External Cron Jobs

### Using crontab (Linux/Unix/macOS)

1. Edit your crontab:
   ```bash
   crontab -e
   ```

2. Add a line to run the health check every minute:
   ```
   * * * * * curl -X GET "https://your-app-domain.com/api/cron/check-urls" -H "Authorization: Bearer YOUR_CRON_SECRET" > /dev/null 2>&1
   ```

### Using Windows Task Scheduler

1. Create a batch file (e.g., `run_health_check.bat`):
   ```batch
   curl -X GET "https://your-app-domain.com/api/cron/check-urls" -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. Open Task Scheduler and create a new task:
   - Trigger: Set to run at your desired interval
   - Action: Start a program
   - Program/script: Path to the batch file

### Using Third-Party Cron Services

#### Cron-job.org

1. Sign up for a free account at [cron-job.org](https://cron-job.org)
2. Create a new cronjob with:
   - URL: `https://your-app-domain.com/api/cron/check-urls`
   - Method: GET
   - Authentication: Add header `Authorization: Bearer YOUR_CRON_SECRET`
   - Schedule: Set desired frequency (e.g., every 1 minute)

#### AWS CloudWatch Events / EventBridge

1. Create a Lambda function that makes an HTTP request to your endpoint
2. Set up an EventBridge rule to trigger the Lambda on a schedule

#### Google Cloud Scheduler

1. Create a new job:
   ```bash
   gcloud scheduler jobs create http health-check-job \
     --schedule="*/1 * * * *" \
     --uri="https://your-app-domain.com/api/cron/check-urls" \
     --http-method=GET \
     --headers="Authorization=Bearer YOUR_CRON_SECRET"
   ```

## Troubleshooting

1. **Verify CRON_SECRET**: Ensure the secret in your cron job matches the one in your app's environment.
2. **Check Logs**: Monitor your server logs when the cron job runs to confirm it's being triggered.
3. **Test Manually**: Test the endpoint manually using curl or Postman before setting up automated jobs.
4. **Firewall Issues**: Ensure your server's firewall allows external requests to the cron endpoint.

## Monitoring Cron Execution

The application logs each execution of the cron job. You can monitor these logs to ensure the cron job is running as expected. 
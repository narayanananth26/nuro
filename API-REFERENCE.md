# API Reference

This document provides details about the API endpoints available in the Nuro application.

## Authentication

The API uses NextAuth for authentication. Most endpoints require a valid user session.

### Auth Endpoints

- `/api/auth/*` - NextAuth authentication endpoints

## URL Monitoring

### Monitor Management

#### Create URL Monitor
- **Endpoint**: `/api/monitor/save-url`
- **Method**: POST
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "url": "https://example.com",
    "interval": 5 // In minutes, 0 for manual only
  }
  ```
- **Response**: Created monitor object

#### Update URL Monitor
- **Endpoint**: `/api/monitor/[id]`
- **Method**: PUT
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "url": "https://example.com",
    "interval": 5
  }
  ```
- **Response**: Updated monitor object

#### Delete URL Monitor
- **Endpoint**: `/api/monitor/[id]`
- **Method**: DELETE
- **Authentication**: Required
- **Response**: Success message

#### Get All Monitors
- **Endpoint**: `/api/monitor`
- **Method**: GET
- **Authentication**: Required
- **Response**: Array of monitor objects

#### Get Monitor by ID
- **Endpoint**: `/api/monitor/[id]`
- **Method**: GET
- **Authentication**: Required
- **Response**: Monitor object

### Monitor Logs

#### Get Monitor Logs
- **Endpoint**: `/api/monitors/[id]/logs`
- **Method**: GET
- **Authentication**: Required
- **Query Parameters**:
  - `limit`: Number of logs to return (default: 100)
  - `offset`: Pagination offset
- **Response**: Array of log entries

#### Export Logs
- **Endpoint**: `/api/monitor/export-logs`
- **Method**: GET
- **Authentication**: Required
- **Query Parameters**:
  - `id`: Monitor ID
  - `format`: Export format (csv)
- **Response**: CSV file download

### Health Checks

#### Manual Health Check
- **Endpoint**: `/api/health-check/[id]`
- **Method**: POST
- **Authentication**: Required
- **Response**: Health check result

## Cron Jobs

### URL Checking

#### Check Due URLs
- **Endpoint**: `/api/cron/check-urls`
- **Method**: GET, POST
- **Authentication**: Requires CRON_SECRET header
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "Checked X URLs",
    "checksPerformed": []
  }
  ```

## Error Responses

Error responses follow this format:
```json
{
  "error": "Error message"
}
```

Common status codes:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden 
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

## Rate Limiting

API requests are subject to rate limiting. Excessive requests may result in temporary blocks. 
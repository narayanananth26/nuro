# API Reference

This document provides details on the available API endpoints in the Nuro application.

## Authentication

### Register

**Endpoint:** `POST /api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Responses:**
- `201 Created`: User registered successfully
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

### Authentication (NextAuth)

**Endpoint:** `POST /api/auth/[...nextauth]`

NextAuth.js handles authentication. This endpoint supports:
- Sign in/Sign out
- JWT token handling
- Session management

## User

### Get User Monitors

**Endpoint:** `GET /api/user/monitors`

Get all URL monitors for the authenticated user.

**Headers:**
- `Authorization`: JWT token

**Query Parameters:**
- `id` (optional): Get a specific monitor by ID

**Responses:**
- `200 OK`: List of monitors or single monitor
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Monitor not found (when using id)
- `500 Internal Server Error`: Server error

### Update Monitor

**Endpoint:** `PUT /api/user/monitors`

Update an existing URL monitor.

**Headers:**
- `Authorization`: JWT token

**Request Body:**
```json
{
  "id": "string",
  "url": "string",
  "interval": "number"
}
```

**Responses:**
- `200 OK`: Updated monitor
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Monitor not found
- `409 Conflict`: URL already being monitored
- `500 Internal Server Error`: Server error

### Delete Monitor

**Endpoint:** `DELETE /api/user/monitors`

Delete a URL monitor.

**Headers:**
- `Authorization`: JWT token

**Query Parameters:**
- `id`: Monitor ID to delete

**Responses:**
- `200 OK`: Monitor deleted successfully
- `400 Bad Request`: Missing ID
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Monitor not found
- `500 Internal Server Error`: Server error

## Monitor Management

### Health Check

**Endpoint:** `GET /api/health-check`

Check if the API is up and running.

**Responses:**
- `200 OK`: API is operational

### Monitor Service Status

**Endpoint:** `GET /api/monitor`

Check if the monitoring service is available.

**Responses:**
- `200 OK`: Service status

### Save URL

**Endpoint:** `POST /api/monitor/save-url`

Add a new URL to monitor.

**Headers:**
- `Authorization`: JWT token

**Request Body:**
```json
{
  "url": "string",
  "interval": "number"
}
```

**Responses:**
- `201 Created`: URL added for monitoring
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Not authenticated
- `409 Conflict`: URL already being monitored
- `500 Internal Server Error`: Server error

### Save Multiple URLs

**Endpoint:** `POST /api/monitor/save-urls`

Add multiple URLs to monitor.

**Headers:**
- `Authorization`: JWT token

**Request Body:**
```json
{
  "urls": [
    {
      "url": "string",
      "interval": "number"
    }
  ]
}
```

**Responses:**
- `201 Created`: URLs added for monitoring
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

### Check URL

**Endpoint:** `POST /api/monitor/check-url`

Manually check a URL status.

**Headers:**
- `Authorization`: JWT token

**Request Body:**
```json
{
  "url": "string"
}
```

**Responses:**
- `200 OK`: Check result
- `400 Bad Request`: Invalid URL
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

## Cron Jobs

### Check Due URLs

**Endpoint:** `GET /api/cron/check-urls`

Trigger the URL checking process for all due monitors.

**Query Parameters:**
- `secret` (required): Secret key for cron job authentication

**Responses:**
- `200 OK`: Check results
- `401 Unauthorized`: Invalid secret
- `500 Internal Server Error`: Server error

This endpoint can also be called via POST.

## Monitor Logs

### Get Monitor Logs

**Endpoint:** `GET /api/monitors/[id]/logs`

Get logs for a specific monitor.

**Headers:**
- `Authorization`: JWT token

**Path Parameters:**
- `id`: Monitor ID

**Query Parameters:**
- `limit` (optional): Number of logs to return
- `offset` (optional): Pagination offset

**Responses:**
- `200 OK`: List of logs
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Monitor not found
- `500 Internal Server Error`: Server error

## Security Considerations

- All user-specific endpoints require authentication
- Cron job endpoints are protected by a secret key
- API rate limiting is recommended for production use
- All sensitive data is handled securely

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message"
}
```

## Notes

- The API uses JSON for all request and response bodies
- All authenticated routes require a valid JWT token
- Monitor IDs are MongoDB ObjectIDs 
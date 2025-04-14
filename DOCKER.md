# Docker Setup for Nuro

This document outlines how to use Docker to develop, build, and deploy the Nuro application.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git repository cloned locally

## Environment Variables

Before running the application with Docker, you'll need to set up the following environment variables:

- `MONGO_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth authentication
- `NEXTAUTH_URL`: URL for NextAuth (e.g., http://localhost:3000 for local development)
- `CRON_SECRET`: Secret for securing cron endpoints

You can set these in a `.env` file at the root of the project. Refer to `.env.example` for the required format.

## Development with Docker

To run the application in development mode with Docker:

```bash
docker compose up
```

This will:
- Build the application using the development target in the Dockerfile
- Start a MongoDB container
- Mount your source code for hot reloading
- Expose the application on port 3000

## Production Build

To build the production Docker image:

```bash
docker build -t nuro-app \
  --build-arg MONGO_URI=your_mongo_uri \
  --build-arg NEXTAUTH_SECRET=your_nextauth_secret \
  --build-arg NEXTAUTH_URL=your_nextauth_url \
  --build-arg CRON_SECRET=your_cron_secret \
  .
```

To run the production build:

```bash
docker run -p 3000:3000 nuro-app
```

## Docker Compose Configuration

The `docker-compose.yml` file includes:

1. **App Service**:
   - Uses the Dockerfile with the development target
   - Exposes port 3000
   - Sets up file watching for hot reloading
   - Depends on the MongoDB service

2. **MongoDB Service**:
   - Uses the latest MongoDB image
   - Exposes port 27017
   - Persists data using a Docker volume

## Multi-Stage Build

The Dockerfile uses a multi-stage build process:

1. **deps**: Installs Node.js dependencies
2. **dev**: Used for development with file watching
3. **builder**: Builds the Next.js application
4. **runner**: Production-optimized image with minimal footprint

## Troubleshooting

If you encounter issues with Docker:

1. Ensure all required environment variables are set
2. Verify MongoDB connection is working
3. Check Docker logs with `docker compose logs`
4. Ensure ports 3000 and 27017 are not already in use 
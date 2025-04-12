# Docker Setup Instructions

This document provides instructions for running the Nuro application using Docker.

## Prerequisites

1. Install [Docker](https://docs.docker.com/get-docker/)
2. Install [Docker Compose](https://docs.docker.com/compose/install/)

## Environment Setup

1. Create a `.env.docker` file in the root directory with the following content:
   ```env
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   CRON_SECRET=your_cron_secret
   ```

   Note: Replace the secret values with your own secure values.

## Running the Application

1. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
   This command will:
   - Build the Next.js application container
   - Start the MongoDB container
   - Set up the network between containers
   - Mount necessary volumes for data persistence

2. Access the application at:
   ```
   http://localhost:3000
   ```

3. To run the containers in detached mode (background):
   ```bash
   docker-compose up -d
   ```

## Stopping the Application

1. If running in foreground, press `Ctrl+C`

2. If running in detached mode:
   ```bash
   docker-compose down
   ```

## Useful Docker Commands

- View running containers:
  ```bash
  docker ps
  ```

- View container logs:
  ```bash
  docker-compose logs app    # For Next.js application logs
  docker-compose logs mongodb # For MongoDB logs
  ```

- Restart containers:
  ```bash
  docker-compose restart
  ```

- Remove containers and networks (preserves volumes):
  ```bash
  docker-compose down
  ```

- Remove everything including volumes:
  ```bash
  docker-compose down -v
  ```

## Troubleshooting

1. If the application fails to start, check the logs:
   ```bash
   docker-compose logs app
   ```

2. If MongoDB connection fails:
   - Ensure MongoDB container is running: `docker ps`
   - Check MongoDB logs: `docker-compose logs mongodb`
   - Verify the MongoDB connection string in docker-compose.yml

3. For permission issues:
   - Ensure your user has permissions to run Docker commands
   - Try running commands with sudo (Linux/Mac)

## Container Details

- Next.js application runs on port 3000
- MongoDB runs on port 27017
- MongoDB data is persisted in a named volume: `mongodb_data`

## Production Deployment Notes

For production deployment:

1. Update the `NEXTAUTH_URL` to match your production domain
2. Use strong, unique secrets for `NEXTAUTH_SECRET` and `CRON_SECRET`
3. Consider adding SSL/TLS configuration
4. Review and adjust container resource limits as needed
5. Implement proper backup strategy for MongoDB data 
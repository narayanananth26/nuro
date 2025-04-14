# Nuro - URL Health Monitoring Application

![Nuro Logo](public/logo.png)

Nuro is a comprehensive URL health monitoring application built with Next.js, MongoDB, and React. It allows users to monitor the health and performance of their websites and APIs.

## Features

- **URL Health Monitoring**: Automatically check your URLs at configurable intervals
- **Real-time Status Updates**: Track the up/down status of your endpoints
- **Performance Metrics**: Monitor response times and status codes
- **Detailed Logs**: View historical data about each monitored URL
- **Export Functionality**: Download logs in CSV format
- **User Authentication**: Secure access with NextAuth
- **Responsive UI**: Modern interface that works on desktop and mobile

## Documentation

- [API Reference](API-REFERENCE.md) - Details about the available API endpoints
- [Docker Setup](DOCKER.md) - Instructions for running the application with Docker
- [External Cron Setup](EXTERNAL-CRON.md) - Guide for setting up external cron jobs

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nuro.git
   cd nuro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.example`:
   ```
   MONGO_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   CRON_SECRET=your_cron_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment

For production deployment, see the [Docker Setup](DOCKER.md) documentation.

## Architecture

Nuro uses a modern tech stack:

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Monitoring**: Built-in cron system with node-cron

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
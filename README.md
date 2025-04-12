# Nuro

A Next.js application for tracking expenses and budgeting.

## Features

- User authentication with NextAuth
- MongoDB integration for data storage
- Expense tracking and budget management
- Data visualization with Recharts
- History and reporting features
- Responsive UI
- Cron job functionality for scheduled tasks

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nuro
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local` and fill in your values

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Environment Variables

The following environment variables are required:

- `MONGO_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth authentication
- `NEXTAUTH_URL`: URL for NextAuth (e.g., http://localhost:3000)
- `CRON_SECRET`: Secret for securing cron job endpoints

## Docker Support

This project includes Docker configuration for containerized deployment:

1. Build the Docker image:
   ```bash
   docker build -t nuro .
   ```

2. Run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

For more details, see the `DOCKER.md` file.

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Scheduled Tasks**: node-cron
- **Data Visualization**: Recharts

## Project Structure

- `/src/app`: Application routes and pages
- `/src/components`: Reusable React components
- `/src/models`: MongoDB models
- `/src/lib`: Utility libraries
- `/src/utils`: Helper functions
- `/src/contexts`: React context providers
- `/public`: Static assets

## External Cron Jobs

For information about setting up external cron jobs, refer to `README-EXTERNAL-CRON.md`.

## License

[MIT](LICENSE) 
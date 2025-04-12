# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Development (this will be used when running in dev mode)
FROM node:20-alpine AS dev
WORKDIR /app

# Accept build arguments
ARG MONGO_URI
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG CRON_SECRET

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED 1
ENV MONGO_URI=${MONGO_URI}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV CRON_SECRET=${CRON_SECRET}

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG MONGO_URI
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG CRON_SECRET

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV MONGO_URI=${MONGO_URI}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV CRON_SECRET=${CRON_SECRET}

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Accept build arguments again for the final stage
ARG MONGO_URI
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG CRON_SECRET

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV MONGO_URI=${MONGO_URI}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV CRON_SECRET=${CRON_SECRET}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 
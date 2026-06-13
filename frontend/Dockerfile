# Stage 1: Build image
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (leverages Docker cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Environment variable for Next.js build-time embedding
ENV NEXT_PUBLIC_API_URL=https://mindbuddy-backend-106578204542.asia-east1.run.app

# Run Next.js production build using standalone output and webpack compiler
RUN npm run build

# Stage 2: Runner image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy required assets from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose Next.js standalone server port
EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]

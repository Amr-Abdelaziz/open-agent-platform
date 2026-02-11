# Base image
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install necessary build dependencies
RUN apt-get update -y && apt-get install -y libc6-dev && rm -rf /var/lib/apt/lists/*

# Enable corepack and set yarn version
RUN corepack enable && corepack prepare yarn@3.5.1 --activate

# Copy monorepo configuration files
COPY package.json yarn.lock tsconfig.json turbo.json ./
COPY .yarnrc.yml ./
COPY apps ./apps

# Install dependencies
RUN yarn install --immutable || yarn install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app ./

# Declare build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BASE_API_URL
ARG NEXT_PUBLIC_RAG_API_URL
ARG NEXT_PUBLIC_DEPLOYMENTS
ARG NEXT_PUBLIC_MCP_SERVER_URL
ARG NEXT_PUBLIC_MCP_AUTH_REQUIRED
ARG NEXT_PUBLIC_USE_LANGSMITH_AUTH
ARG NEXT_PUBLIC_GOOGLE_AUTH_DISABLED
ARG NEXT_PUBLIC_DEMO_APP

# Set environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_BASE_API_URL=$NEXT_PUBLIC_BASE_API_URL
ENV NEXT_PUBLIC_RAG_API_URL=$NEXT_PUBLIC_RAG_API_URL
ENV NEXT_PUBLIC_DEPLOYMENTS=$NEXT_PUBLIC_DEPLOYMENTS
ENV NEXT_PUBLIC_MCP_SERVER_URL=$NEXT_PUBLIC_MCP_SERVER_URL
ENV NEXT_PUBLIC_MCP_AUTH_REQUIRED=$NEXT_PUBLIC_MCP_AUTH_REQUIRED
ENV NEXT_PUBLIC_USE_LANGSMITH_AUTH=$NEXT_PUBLIC_USE_LANGSMITH_AUTH
ENV NEXT_PUBLIC_GOOGLE_AUTH_DISABLED=$NEXT_PUBLIC_GOOGLE_AUTH_DISABLED
ENV NEXT_PUBLIC_DEMO_APP=$NEXT_PUBLIC_DEMO_APP

# Next.js collects completely anonymous telemetry data about general usage.
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Skip type checking and linting during build for faster builds
ENV NEXT_IGNORE_TYPE_CHECKS=1
ENV TYPESCRIPT_IGNORE_BUILD_ERRORS=true

# Build the web application
WORKDIR /app/apps/web
RUN yarn build:internal

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/apps/web/public ./public

# Create .next directory with proper permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy Next.js build artifacts
# Use standalone output for optimized deployment
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "apps/web/server.js"]
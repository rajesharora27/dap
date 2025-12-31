# ====================================
# DAP Backend Dockerfile
# Multi-stage build for production
# ====================================

# Stage 1: Install dependencies
FROM node:22-bullseye AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install system deps and project dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/* \
    && npm ci --legacy-peer-deps

# Stage 2: Build application
FROM deps AS build
WORKDIR /app

# Copy source code
COPY . .

# Generate Prisma client & build TypeScript
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-1.1.x
RUN npx prisma generate && npm run build

# Verify build works
RUN node -e "require('./dist/server.js'); console.log('Build verification ok')"

# Stage 3: Production runtime
FROM node:22-bullseye-slim AS runtime
WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000

# Copy built application from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY package.json ./
COPY entrypoint.sh ./entrypoint.sh

# Create non-root user for security
RUN groupadd -r dap && useradd -r -g dap dap \
    && chown -R dap:dap /app \
    && chmod +x /app/entrypoint.sh

# Create directories for temp files
RUN mkdir -p /app/temp/backups /app/temp/telemetry-exports \
    && chown -R dap:dap /app/temp

USER dap

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4000/health/live || exit 1

# Labels for container metadata
LABEL org.opencontainers.image.title="DAP Backend" \
      org.opencontainers.image.description="Digital Adoption Platform API Server" \
      org.opencontainers.image.vendor="DAP" \
      org.opencontainers.image.source="https://github.com/rajesharora27/dap"

# Start application
CMD ["sh", "/app/entrypoint.sh"]

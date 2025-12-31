# ====================================
# DAP Frontend Dockerfile
# Multi-stage build with nginx for production
# ====================================

# Stage 1: Build application
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build for production
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production nginx server
FROM nginx:alpine AS runtime

# Copy built assets to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN adduser -D -u 1001 dap \
    && chown -R dap:dap /usr/share/nginx/html \
    && chown -R dap:dap /var/cache/nginx \
    && chown -R dap:dap /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown -R dap:dap /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:80/ || exit 1

# Labels
LABEL org.opencontainers.image.title="DAP Frontend" \
      org.opencontainers.image.description="Digital Adoption Platform Web UI" \
      org.opencontainers.image.vendor="DAP" \
      org.opencontainers.image.source="https://github.com/rajesharora27/dap"

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

# DAP Configuration System

## Overview

The DAP application now uses a centralized configuration system that eliminates hardcoded addresses and port numbers, making it easy to deploy across different environments.

## Configuration Files

### Environment Files

The application supports multiple environments with dedicated configuration files:

- `.env.development` - Development environment settings
- `.env.production` - Production environment settings  
- `.env.staging` - Staging environment settings

### Backend Configuration

Location: `/backend/src/config/app.config.ts`

The backend configuration system provides:
- **CORS origins** - Automatically configured based on environment
- **Server host/port** - Configurable for different deployment scenarios
- **Database URL** - Environment-specific database connections
- **GraphQL endpoint** - Flexible API endpoint configuration

### Frontend Configuration

Location: `/frontend/src/config/frontend.config.ts`

The frontend configuration system provides:
- **API URL** - Dynamic GraphQL endpoint based on environment
- **Frontend URL** - Base URL for the application
- **Environment detection** - Automatic environment mode detection

## Environment Variables

### Backend Variables

```bash
# Server Configuration
BACKEND_HOST=0.0.0.0          # Server bind address
BACKEND_PORT=4000             # Server port
BACKEND_URL=http://localhost:4000  # Full backend URL

# API Configuration  
GRAPHQL_ENDPOINT=http://localhost:4000/graphql  # GraphQL endpoint

# Database Configuration
DATABASE_URL=postgres://user:pass@host:5432/dap  # Database connection

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000  # Comma-separated origins
```

### Frontend Variables

```bash
# API Configuration
VITE_GRAPHQL_ENDPOINT=http://localhost:4000/graphql  # GraphQL API endpoint
VITE_FRONTEND_URL=http://localhost:5173              # Frontend base URL
```

### DAP Script Variables

```bash
# Port Configuration
BACKEND_PORT=4000    # Backend server port
FRONTEND_PORT=5173   # Frontend server port
```

## Deployment Instructions

### Development Environment

1. Use the default `.env.development` files
2. Start the application with `./dap start`
3. Access at `http://localhost:5173`

### Production Environment

1. Copy `.env.production` to `.env` and update values:
   ```bash
   cp .env.production .env
   # Edit .env with your production settings
   ```

2. Set production environment variables:
   ```bash
   export NODE_ENV=production
   export FRONTEND_URL=https://your-domain.com
   export BACKEND_URL=https://api.your-domain.com
   export GRAPHQL_ENDPOINT=https://api.your-domain.com/graphql
   export DATABASE_URL=postgres://user:pass@prod-db:5432/dap
   ```

3. Build and deploy:
   ```bash
   # Frontend build
   cd frontend && npm run build
   
   # Backend build  
   cd backend && npm run build
   
   # Start production services
   ./dap start
   ```

### Staging Environment

1. Copy `.env.staging` to `.env` and update values
2. Set `NODE_ENV=staging`
3. Configure staging-specific URLs and database

## Migration from Hardcoded Values

### What Changed

- **Backend CORS**: Now uses `getCorsOrigins()` from configuration
- **Server ports**: Now uses `config.backend.port` and `config.backend.host`
- **Frontend API**: Now uses `getApiUrl()` from frontend configuration
- **Vite proxy**: Now uses environment-based backend URL
- **DAP script**: Now supports environment variable overrides

### Backward Compatibility

The system maintains backward compatibility:
- Default values match original hardcoded values
- Development environment works without changes
- Existing workflows continue to function

## Benefits

1. **Environment Flexibility**: Easy deployment to dev/staging/production
2. **Security**: No hardcoded production credentials in source code
3. **Scalability**: Support for different server configurations
4. **Maintenance**: Centralized configuration management
5. **Docker Support**: Environment-based container configuration

## Testing

Verify the configuration system:

```bash
# Test development environment
./dap start

# Full clean restart with seeded sample data
./dap clean-restart

# Verify configuration loading
cd backend && npm run build && node dist/server.js
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check `ALLOWED_ORIGINS` includes your frontend URL
2. **Connection Refused**: Verify `BACKEND_URL` and `GRAPHQL_ENDPOINT` are correct
3. **Environment Not Loading**: Ensure `.env` file is in correct location
4. **Port Conflicts**: Use `BACKEND_PORT` and `FRONTEND_PORT` to change ports

### Debug Commands

```bash
# Check environment variables
printenv | grep -E "(BACKEND|FRONTEND|GRAPHQL|DATABASE)"

# Test backend connectivity
curl -X POST $GRAPHQL_ENDPOINT -H "Content-Type: application/json" -d '{"query":"query{__typename}"}'

# Check frontend environment
cd frontend && npm run dev -- --debug
```
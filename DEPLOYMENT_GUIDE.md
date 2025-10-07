# DAP Deployment Guide

## Environment Configuration

The DAP application now supports environment-based configuration for seamless deployment across different environments.

### Configuration Files

#### Backend Configuration
- `.env.development` - Development environment (localhost)
- `.env.staging` - Staging environment 
- `.env.production` - Production environment

#### Frontend Configuration
- `frontend/.env.development` - Frontend development config
- `frontend/.env.production` - Frontend production config

### Deployment Steps

#### 1. Development Environment
```bash
# Uses .env.development by default
./dap start
```

#### 2. Staging Environment
```bash
# Copy staging configuration
cp .env.staging .env

# Update frontend configuration
cp frontend/.env.staging frontend/.env.local

# Deploy with staging config
./dap start
```

#### 3. Production Environment
```bash
# Copy production configuration
cp .env.production .env

# Update frontend configuration  
cp frontend/.env.production frontend/.env.local

# Deploy with production config
./dap start
```

### Configuration Variables

#### Backend (.env files)
```bash
DATABASE_URL=postgresql://user:password@host:port/database
PORT=4000
GRAPHQL_ENDPOINT=http://host:port/graphql
NODE_ENV=production
```

#### Frontend (.env files)
```bash
VITE_GRAPHQL_ENDPOINT=http://host:port/graphql
VITE_GRAPHQL_WS_ENDPOINT=ws://host:port/graphql
```

### Key Benefits

- ✅ **No Hardcoded Addresses**: All endpoints configurable
- ✅ **Environment Isolation**: Separate configs for each environment
- ✅ **Easy Deployment**: Simple file copy for environment switching
- ✅ **Development Workflow**: Default development configuration included
- ✅ **Production Ready**: Secure configuration management

### Sample Data Management

#### Add Sample Data
```bash
./dap add-sample
```

#### Reset Sample Data (keeps real data)
```bash
./dap reset-sample
```

#### Full Clean Restart (drops all data then seeds sample set)
```bash
./dap clean-restart
```

### Verification

After deployment, verify the application:

1. **Access Frontend**: Check configured frontend URL
2. **Test GraphQL**: Verify GraphQL endpoint connectivity
3. **Database Connection**: Ensure database migrations applied
4. **Sample Data**: Use `./dap add-sample` for testing
5. **Telemetry**: Verify telemetry system functionality

### Troubleshooting

#### Configuration Issues
- Verify environment file syntax
- Check database connectivity
- Ensure all required variables are set

#### Service Issues
```bash
./dap status    # Check service status and record counts
./dap restart   # Restart all services
```

#### Database Issues
```bash
# Check database connection
docker compose exec backend npx prisma db pull

# Apply migrations
docker compose exec backend npx prisma migrate deploy

# Reset if needed (destructive)
./dap db-reset
```
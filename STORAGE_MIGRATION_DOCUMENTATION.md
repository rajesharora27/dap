# Storage Migration to /data Partition

## Overview
Successfully migrated all DAP application components from root partition to `/data` partition to address disk space constraints and optimize resource utilization.

## Migration Date
September 27, 2025

## Problem
- Root partition at 65% usage (29G/46G) - approaching critical levels
- /data partition at 1% usage (8.8G/1TB) - massive unused capacity
- Container storage and NPM cache consuming significant root partition space

## Solution Implemented

### 1. Container Storage Relocation
- **From**: `~/.local/share/containers/storage`
- **To**: `/data/containers/storage`
- **Configuration**: Updated `~/.config/containers/storage.conf`
- **Size**: ~4.4GB migrated

### 2. NPM Cache Relocation
- **From**: `~/.npm`
- **To**: `/data/npm-cache`
- **Configuration**: `npm config set cache /data/npm-cache`
- **Size**: ~874MB migrated

### 3. Application Root Location
- **Location**: `/data/dap` (this repository)
- **Services**: All running from /data partition
- **Database**: Container volumes on /data partition

## Results

### Disk Usage Improvement
| Partition | Before | After | Improvement |
|-----------|---------|-------|-------------|
| **Root (/)** | 65% (29G/46G) | 59% (27G/46G) | **6% reduction** |
| **Data (/data)** | 1% (8.8G/1TB) | 2% (15G/1TB) | Absorbed content |

### Services Status
All services running successfully from /data partition:
- PostgreSQL Database: Port 5432 (container in /data)
- Backend GraphQL API: Port 4000
- Frontend React App: Port 5173
- Network Access: http://172.22.156.32:5173 (CORS configured)

## Configuration Files Modified

### Container Storage (`~/.config/containers/storage.conf`)
```ini
[storage]
driver = "overlay"
runroot = "/run/user/1000/containers"
graphroot = "/data/containers/storage"
```

### NPM Configuration
```bash
npm config set cache /data/npm-cache
```

## Enhanced Sample Data
Updated to comprehensive dataset:
- **5 Enterprise Products**: E-Commerce, FinTech, Healthcare, Logistics, EdTech
- **40 Tasks**: 5-10 tasks per product with full attributes
- **License Levels**: Basic, Standard, Premium, Enterprise
- **Complete Outcomes**: Delivered, In Progress, Cancelled, Pending

## Benefits Achieved
1. **Space Relief**: Root partition usage reduced by 6%
2. **Future Growth**: 1TB available space for expansion
3. **System Stability**: Reduced risk of root partition filling
4. **Optimal Resource Usage**: Heavy components on spacious partition
5. **Performance**: No degradation, all services operational

## Migration Commands Used
```bash
# Create storage directories
mkdir -p /data/containers /data/npm-cache /data/tmp

# Configure container storage
echo '[storage]
driver = "overlay"
runroot = "/run/user/1000/containers"
graphroot = "/data/containers/storage"' > ~/.config/containers/storage.conf

# Configure NPM cache
npm config set cache /data/npm-cache

# Migrate container data
rsync -av ~/.local/share/containers/ /data/containers/storage/
rm -rf ~/.local/share/containers

# Migrate NPM cache
rsync -av ~/.npm/ /data/npm-cache/
rm -rf ~/.npm
```

## Verification
- ✅ All services start successfully
- ✅ Database operations functional
- ✅ Frontend-backend communication working
- ✅ Container operations using new storage location
- ✅ NPM operations using new cache location
- ✅ Network access via CORS-configured IP

## Maintenance Notes
- Regular monitoring of /data partition usage recommended
- Container cleanup commands now affect /data/containers/storage
- NPM cache clearing affects /data/npm-cache
- All backups should include /data partition
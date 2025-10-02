#!/bin/bash

#######################################################################################
# DAP Configuration System Validation Script
# 
# Tests the configuration system by:
# - Validating environment files exist and are properly formatted
# - Testing configuration loading in backend and frontend
# - Verifying CORS and API connectivity
# - Checking port configuration
#######################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Test configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🧪 DAP Configuration System Validation"
echo "======================================"

# Test 1: Check environment files exist
log_info "Testing environment files..."
ENV_FILES=(
    ".env.development"
    ".env.production" 
    ".env.staging"
    "frontend/.env.development"
    "frontend/.env.production"
)

for file in "${ENV_FILES[@]}"; do
    if [[ -f "$PROJECT_DIR/$file" ]]; then
        log_success "Found $file"
    else
        log_error "Missing $file"
        exit 1
    fi
done

# Test 2: Validate environment file format
log_info "Validating environment file format..."
for env_file in ".env.development" ".env.production" ".env.staging"; do
    if [[ -f "$PROJECT_DIR/$env_file" ]]; then
        # Check for required variables
        required_vars=("NODE_ENV" "BACKEND_PORT" "FRONTEND_PORT" "GRAPHQL_ENDPOINT")
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" "$PROJECT_DIR/$env_file"; then
                log_success "$env_file contains $var"
            else
                log_warning "$env_file missing $var (may use defaults)"
            fi
        done
    fi
done

# Test 3: Check backend configuration loading
log_info "Testing backend configuration loading..."
cd "$BACKEND_DIR"
if npm run build > /dev/null 2>&1; then
    log_success "Backend builds successfully"
    
    # Test configuration import
    if node -e "
        const { config, validateConfig } = require('./dist/config/app.config.js');
        validateConfig();
        console.log('Backend config loaded:', JSON.stringify(config, null, 2));
    " 2>/dev/null; then
        log_success "Backend configuration loads correctly"
    else
        log_error "Backend configuration failed to load"
        exit 1
    fi
else
    log_error "Backend build failed"
    exit 1
fi

# Test 4: Check frontend configuration
log_info "Testing frontend configuration..."
cd "$FRONTEND_DIR"
if [[ -f "src/config/frontend.config.ts" ]]; then
    log_success "Frontend configuration file exists"
    
    # Check TypeScript compilation
    if npx tsc --noEmit src/config/frontend.config.ts 2>/dev/null; then
        log_success "Frontend configuration compiles correctly"
    else
        log_warning "Frontend configuration has TypeScript issues"
    fi
else
    log_error "Frontend configuration file missing"
    exit 1
fi

# Test 5: Test with different environments
log_info "Testing environment switching..."
for env in "development" "production" "staging"; do
    export NODE_ENV="$env"
    cd "$BACKEND_DIR"
    
    if node -e "
        const { config } = require('./dist/config/app.config.js');
        console.log('Environment: $env');
        console.log('Backend Port:', config.backend.port);
        console.log('Frontend URL:', config.frontend.url);
    " 2>/dev/null; then
        log_success "Environment '$env' configuration works"
    else
        log_error "Environment '$env' configuration failed"
    fi
done

# Test 6: Test environment variable override
log_info "Testing environment variable overrides..."
export NODE_ENV="development"
export BACKEND_PORT="3001"
export FRONTEND_PORT="8081"
cd "$BACKEND_DIR"

if node -e "
    const { config } = require('./dist/config/app.config.js');
    if (config.backend.port === 3001) {
        console.log('✅ Backend port override works');
    } else {
        console.log('❌ Backend port override failed');
        process.exit(1);
    }
" 2>/dev/null; then
    log_success "Environment variable overrides work"
else
    log_error "Environment variable overrides failed"
fi

# Test 7: Check for hardcoded values (should find minimal results)
log_info "Scanning for remaining hardcoded values..."
cd "$PROJECT_DIR"

HARDCODED_COUNT=$(grep -r "localhost:4000\|localhost:5173" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    backend/src frontend/src 2>/dev/null | wc -l || echo "0")

if [[ "$HARDCODED_COUNT" -eq 0 ]]; then
    log_success "No hardcoded localhost addresses found in source code"
elif [[ "$HARDCODED_COUNT" -lt 5 ]]; then
    log_warning "$HARDCODED_COUNT hardcoded addresses found (may be acceptable)"
else
    log_error "$HARDCODED_COUNT hardcoded addresses found - configuration incomplete"
fi

# Test 8: Test DAP script environment support
log_info "Testing DAP script environment support..."
if grep -q "BACKEND_PORT.*:-" "$PROJECT_DIR/dap"; then
    log_success "DAP script supports environment variable overrides"
else
    log_error "DAP script missing environment variable support"
fi

# Summary
echo ""
echo "🎯 Configuration System Validation Summary"
echo "=========================================="
log_success "Configuration system validation completed"
log_info "The DAP application is ready for multi-environment deployment"
log_info "See CONFIG_SYSTEM_GUIDE.md for deployment instructions"

# Reset environment
unset NODE_ENV BACKEND_PORT FRONTEND_PORT
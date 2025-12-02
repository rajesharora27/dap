#!/bin/bash
# Database Migration Manager
# Handles database schema changes with rollback support

set -e

PROD_SERVER="centos2.rajarora.csslab"
PROD_USER="rajarora"
MIGRATIONS_DIR="/data/dap/migrations"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Create new migration
create_migration() {
    local NAME=$1
    if [ -z "$NAME" ]; then
        log_error "Usage: $0 create <migration-name>"
        exit 1
    fi
    
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    MIGRATION_FILE="migrations/${TIMESTAMP}_${NAME}.sql"
    
    mkdir -p migrations
    
    cat > "$MIGRATION_FILE" << 'EOF'
-- Migration: NAME_PLACEHOLDER
-- Created: TIMESTAMP_PLACEHOLDER
-- Description: Add description here

-- ============================================
-- UP Migration (apply changes)
-- ============================================

BEGIN;

-- Add your schema changes here
-- Example:
-- ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "newField" TEXT;
-- CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");

-- Record migration
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid(),
    '',
    NOW(),
    'TIMESTAMP_PLACEHOLDER_NAME_PLACEHOLDER',
    'Manual migration',
    NULL,
    NOW(),
    1
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- DOWN Migration (rollback changes)
-- ============================================
-- Uncomment and modify for rollback:
-- BEGIN;
-- ALTER TABLE "User" DROP COLUMN IF EXISTS "newField";
-- DROP INDEX IF EXISTS "idx_user_email";
-- DELETE FROM _prisma_migrations WHERE migration_name = 'TIMESTAMP_PLACEHOLDER_NAME_PLACEHOLDER';
-- COMMIT;
EOF
    
    sed -i "s/NAME_PLACEHOLDER/$NAME/g" "$MIGRATION_FILE"
    sed -i "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/g" "$MIGRATION_FILE"
    
    log_success "Migration created: $MIGRATION_FILE"
    log_info "Edit the file to add your schema changes"
}

# Apply migrations
apply_migrations() {
    local TARGET=${1:-production}
    
    if [ ! -d "migrations" ]; then
        log_error "No migrations directory found"
        exit 1
    fi
    
    PENDING=$(ls migrations/*.sql 2>/dev/null | wc -l)
    if [ "$PENDING" -eq 0 ]; then
        log_info "No pending migrations"
        return 0
    fi
    
    log_info "Found $PENDING migration(s)"
    
    if [ "$TARGET" = "production" ]; then
        log_warning "This will apply migrations to PRODUCTION"
        read -p "Continue? (yes/no): " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            log_info "Migration cancelled"
            exit 0
        fi
        
        # Transfer migrations
        scp -r migrations ${PROD_USER}@${PROD_SERVER}:/tmp/
        
        ssh ${PROD_USER}@${PROD_SERVER} << 'ENDSSH'
cd /tmp/migrations

for MIGRATION in *.sql; do
    echo "Applying: $MIGRATION"
    sudo -u postgres psql -d dap < "$MIGRATION"
    
    if [ $? -eq 0 ]; then
        echo "✅ $MIGRATION applied"
    else
        echo "❌ $MIGRATION failed"
        exit 1
    fi
done

rm -rf /tmp/migrations
ENDSSH
        
    else
        # Local/dev
        for MIGRATION in migrations/*.sql; do
            log_info "Applying: $(basename $MIGRATION)"
            psql -U dap -d dap < "$MIGRATION"
            
            if [ $? -eq 0 ]; then
                log_success "$(basename $MIGRATION) applied"
            else
                log_error "$(basename $MIGRATION) failed"
                exit 1
            fi
        done
    fi
    
    log_success "All migrations applied"
}

# Show migration status
migration_status() {
    local TARGET=${1:-production}
    
    if [ "$TARGET" = "production" ]; then
        ssh ${PROD_USER}@${PROD_SERVER} << 'ENDSSH'
echo "Production Database Migrations"
echo "==============================="
sudo -u postgres psql -d dap -c "
  SELECT migration_name, finished_at, applied_steps_count
  FROM _prisma_migrations
  ORDER BY finished_at DESC
  LIMIT 10;
"
ENDSSH
    else
        echo "Local Database Migrations"
        echo "========================="
        psql -U dap -d dap -c "
          SELECT migration_name, finished_at, applied_steps_count
          FROM _prisma_migrations
          ORDER BY finished_at DESC
          LIMIT 10;
        "
    fi
}

# Main
case "${1:-}" in
    create)
        create_migration "$2"
        ;;
    apply)
        apply_migrations "$2"
        ;;
    status)
        migration_status "$2"
        ;;
    *)
        echo "Database Migration Manager"
        echo ""
        echo "Usage:"
        echo "  $0 create <name>              Create new migration"
        echo "  $0 apply [dev|production]     Apply pending migrations"
        echo "  $0 status [dev|production]    Show migration history"
        echo ""
        exit 1
        ;;
esac


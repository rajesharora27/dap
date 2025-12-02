-- Migration: test_migration_2747730
-- Created: 20251201193246
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
    '20251201193246_test_migration_2747730',
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
-- DELETE FROM _prisma_migrations WHERE migration_name = '20251201193246_test_migration_2747730';
-- COMMIT;

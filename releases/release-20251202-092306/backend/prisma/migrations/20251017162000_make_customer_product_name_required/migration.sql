-- AlterTable
ALTER TABLE "CustomerProduct" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT 'Default Assignment';

-- Update existing NULL values to have a default name
UPDATE "CustomerProduct" SET "name" = 'Default Assignment' WHERE "name" IS NULL;

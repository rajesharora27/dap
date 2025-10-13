-- Fix corrupted array data in Task table
-- Reset howToDoc and howToVideo to empty arrays where they are corrupted

-- First, set all NULL values to empty arrays
UPDATE "Task" SET "howToDoc" = ARRAY[]::TEXT[] WHERE "howToDoc" IS NULL;
UPDATE "Task" SET "howToVideo" = ARRAY[]::TEXT[] WHERE "howToVideo" IS NULL;

-- Try to fix corrupted arrays by resetting them
-- This will catch any array that can't be properly read
DO $$
DECLARE
    task_record RECORD;
BEGIN
    FOR task_record IN SELECT id FROM "Task"
    LOOP
        BEGIN
            -- Try to access the array, if it fails, reset it
            PERFORM array_length("howToDoc", 1) FROM "Task" WHERE id = task_record.id;
        EXCEPTION WHEN OTHERS THEN
            UPDATE "Task" SET "howToDoc" = ARRAY[]::TEXT[] WHERE id = task_record.id;
        END;
        
        BEGIN
            -- Try to access the array, if it fails, reset it
            PERFORM array_length("howToVideo", 1) FROM "Task" WHERE id = task_record.id;
        EXCEPTION WHEN OTHERS THEN
            UPDATE "Task" SET "howToVideo" = ARRAY[]::TEXT[] WHERE id = task_record.id;
        END;
    END LOOP;
END $$;

-- Set default values for new records
ALTER TABLE "Task" ALTER COLUMN "howToDoc" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Task" ALTER COLUMN "howToVideo" SET DEFAULT ARRAY[]::TEXT[];
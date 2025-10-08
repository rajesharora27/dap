/*
  Warnings:

  - You are about to alter the column `weight` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - The `howToDoc` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `howToVideo` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/

-- Step 1: Create temporary columns for the array versions
ALTER TABLE "public"."Task" ADD COLUMN "howToDoc_new" TEXT[];
ALTER TABLE "public"."Task" ADD COLUMN "howToVideo_new" TEXT[];

-- Step 2: Migrate existing data to arrays (only non-null values)
UPDATE "public"."Task" 
SET "howToDoc_new" = ARRAY["howToDoc"]
WHERE "howToDoc" IS NOT NULL;

UPDATE "public"."Task" 
SET "howToVideo_new" = ARRAY["howToVideo"]
WHERE "howToVideo" IS NOT NULL;

-- Step 3: Drop old columns
ALTER TABLE "public"."Task" DROP COLUMN "howToDoc";
ALTER TABLE "public"."Task" DROP COLUMN "howToVideo";

-- Step 4: Rename new columns to original names
ALTER TABLE "public"."Task" RENAME COLUMN "howToDoc_new" TO "howToDoc";
ALTER TABLE "public"."Task" RENAME COLUMN "howToVideo_new" TO "howToVideo";

-- Step 5: Update weight column type
ALTER TABLE "public"."Task" ALTER COLUMN "weight" SET DATA TYPE DECIMAL(5,2);

-- CreateEnum
CREATE TYPE "public"."StatusUpdateSource" AS ENUM ('MANUAL', 'TELEMETRY', 'IMPORT', 'SYSTEM');

-- AlterTable
ALTER TABLE "public"."CustomerTask" ADD COLUMN     "statusUpdateSource" "public"."StatusUpdateSource";

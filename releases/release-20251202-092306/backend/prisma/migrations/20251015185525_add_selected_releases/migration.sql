-- AlterTable
ALTER TABLE "public"."AdoptionPlan" ADD COLUMN     "selectedReleases" JSONB;

-- AlterTable
ALTER TABLE "public"."CustomerProduct" ADD COLUMN     "selectedReleases" JSONB;

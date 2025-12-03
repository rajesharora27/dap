/*
  Warnings:

  - Added the required column `updatedAt` to the `CustomerProduct` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CustomerTaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE', 'NOT_APPLICABLE');

-- DropForeignKey
ALTER TABLE "public"."CustomerProduct" DROP CONSTRAINT "CustomerProduct_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CustomerProduct" DROP CONSTRAINT "CustomerProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CustomerSolution" DROP CONSTRAINT "CustomerSolution_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CustomerSolution" DROP CONSTRAINT "CustomerSolution_solutionId_fkey";

-- AlterTable
ALTER TABLE "public"."CustomerProduct" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "licenseLevel" "public"."LicenseLevel" NOT NULL DEFAULT 'ESSENTIAL',
ADD COLUMN     "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "selectedOutcomes" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Task" ALTER COLUMN "howToDoc" DROP DEFAULT,
ALTER COLUMN "howToVideo" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."AdoptionPlan" (
    "id" TEXT NOT NULL,
    "customerProductId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "licenseLevel" "public"."LicenseLevel" NOT NULL,
    "selectedOutcomes" JSONB,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "completedWeight" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "progressPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "AdoptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerTask" (
    "id" TEXT NOT NULL,
    "adoptionPlanId" TEXT NOT NULL,
    "originalTaskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estMinutes" INTEGER NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "priority" TEXT,
    "howToDoc" TEXT[],
    "howToVideo" TEXT[],
    "notes" TEXT,
    "licenseLevel" "public"."LicenseLevel" NOT NULL,
    "status" "public"."CustomerTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "statusUpdatedAt" TIMESTAMP(3),
    "statusUpdatedBy" TEXT,
    "statusNotes" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerTelemetryAttribute" (
    "id" TEXT NOT NULL,
    "customerTaskId" TEXT NOT NULL,
    "originalAttributeId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataType" "public"."TelemetryDataType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "successCriteria" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMet" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTelemetryAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerTelemetryValue" (
    "id" TEXT NOT NULL,
    "customerAttributeId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "source" TEXT,
    "batchId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerTelemetryValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerTaskOutcome" (
    "id" TEXT NOT NULL,
    "customerTaskId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,

    CONSTRAINT "CustomerTaskOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerTaskRelease" (
    "id" TEXT NOT NULL,
    "customerTaskId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "CustomerTaskRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdoptionPlan_customerProductId_key" ON "public"."AdoptionPlan"("customerProductId");

-- CreateIndex
CREATE INDEX "AdoptionPlan_customerProductId_idx" ON "public"."AdoptionPlan"("customerProductId");

-- CreateIndex
CREATE INDEX "AdoptionPlan_productId_idx" ON "public"."AdoptionPlan"("productId");

-- CreateIndex
CREATE INDEX "CustomerTask_adoptionPlanId_idx" ON "public"."CustomerTask"("adoptionPlanId");

-- CreateIndex
CREATE INDEX "CustomerTask_originalTaskId_idx" ON "public"."CustomerTask"("originalTaskId");

-- CreateIndex
CREATE INDEX "CustomerTask_status_idx" ON "public"."CustomerTask"("status");

-- CreateIndex
CREATE INDEX "CustomerTelemetryAttribute_customerTaskId_idx" ON "public"."CustomerTelemetryAttribute"("customerTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTelemetryAttribute_customerTaskId_name_key" ON "public"."CustomerTelemetryAttribute"("customerTaskId", "name");

-- CreateIndex
CREATE INDEX "CustomerTelemetryValue_customerAttributeId_idx" ON "public"."CustomerTelemetryValue"("customerAttributeId");

-- CreateIndex
CREATE INDEX "CustomerTelemetryValue_batchId_idx" ON "public"."CustomerTelemetryValue"("batchId");

-- CreateIndex
CREATE INDEX "CustomerTelemetryValue_createdAt_idx" ON "public"."CustomerTelemetryValue"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerTaskOutcome_customerTaskId_idx" ON "public"."CustomerTaskOutcome"("customerTaskId");

-- CreateIndex
CREATE INDEX "CustomerTaskOutcome_outcomeId_idx" ON "public"."CustomerTaskOutcome"("outcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTaskOutcome_customerTaskId_outcomeId_key" ON "public"."CustomerTaskOutcome"("customerTaskId", "outcomeId");

-- CreateIndex
CREATE INDEX "CustomerTaskRelease_customerTaskId_idx" ON "public"."CustomerTaskRelease"("customerTaskId");

-- CreateIndex
CREATE INDEX "CustomerTaskRelease_releaseId_idx" ON "public"."CustomerTaskRelease"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTaskRelease_customerTaskId_releaseId_key" ON "public"."CustomerTaskRelease"("customerTaskId", "releaseId");

-- CreateIndex
CREATE INDEX "CustomerProduct_customerId_idx" ON "public"."CustomerProduct"("customerId");

-- CreateIndex
CREATE INDEX "CustomerProduct_productId_idx" ON "public"."CustomerProduct"("productId");

-- CreateIndex
CREATE INDEX "CustomerSolution_customerId_idx" ON "public"."CustomerSolution"("customerId");

-- CreateIndex
CREATE INDEX "CustomerSolution_solutionId_idx" ON "public"."CustomerSolution"("solutionId");

-- AddForeignKey
ALTER TABLE "public"."CustomerProduct" ADD CONSTRAINT "CustomerProduct_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerProduct" ADD CONSTRAINT "CustomerProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerSolution" ADD CONSTRAINT "CustomerSolution_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerSolution" ADD CONSTRAINT "CustomerSolution_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "public"."Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdoptionPlan" ADD CONSTRAINT "AdoptionPlan_customerProductId_fkey" FOREIGN KEY ("customerProductId") REFERENCES "public"."CustomerProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTask" ADD CONSTRAINT "CustomerTask_adoptionPlanId_fkey" FOREIGN KEY ("adoptionPlanId") REFERENCES "public"."AdoptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTelemetryAttribute" ADD CONSTRAINT "CustomerTelemetryAttribute_customerTaskId_fkey" FOREIGN KEY ("customerTaskId") REFERENCES "public"."CustomerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTelemetryValue" ADD CONSTRAINT "CustomerTelemetryValue_customerAttributeId_fkey" FOREIGN KEY ("customerAttributeId") REFERENCES "public"."CustomerTelemetryAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTaskOutcome" ADD CONSTRAINT "CustomerTaskOutcome_customerTaskId_fkey" FOREIGN KEY ("customerTaskId") REFERENCES "public"."CustomerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTaskOutcome" ADD CONSTRAINT "CustomerTaskOutcome_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "public"."Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTaskRelease" ADD CONSTRAINT "CustomerTaskRelease_customerTaskId_fkey" FOREIGN KEY ("customerTaskId") REFERENCES "public"."CustomerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTaskRelease" ADD CONSTRAINT "CustomerTaskRelease_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "public"."Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

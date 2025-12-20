-- CreateEnum
CREATE TYPE "public"."SystemRole" AS ENUM ('ADMIN', 'USER', 'SME', 'CSS', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."TaskSourceType" AS ENUM ('SOLUTION', 'PRODUCT');

-- CreateEnum
CREATE TYPE "public"."SolutionProductStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."ResourceType" AS ENUM ('PRODUCT', 'SOLUTION', 'CUSTOMER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."PermissionLevel" AS ENUM ('READ', 'WRITE', 'ADMIN');

-- AlterEnum
ALTER TYPE "public"."CustomerTaskStatus" ADD VALUE 'NO_LONGER_USING';

-- AlterTable
ALTER TABLE "public"."AuditLog" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "resourceId" TEXT,
ADD COLUMN     "resourceType" TEXT;

-- AlterTable
ALTER TABLE "public"."CustomerProduct" ADD COLUMN     "customerSolutionId" TEXT,
ALTER COLUMN "name" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."CustomerSolution" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "licenseLevel" "public"."LicenseLevel" NOT NULL DEFAULT 'ESSENTIAL',
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "selectedOutcomes" JSONB,
ADD COLUMN     "selectedReleases" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."CustomerTaskOutcome" ADD COLUMN     "customerSolutionTaskId" TEXT,
ALTER COLUMN "customerTaskId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."CustomerTaskRelease" ADD COLUMN     "customerSolutionTaskId" TEXT,
ALTER COLUMN "customerTaskId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."CustomerTelemetryAttribute" ADD COLUMN     "customerSolutionTaskId" TEXT,
ALTER COLUMN "customerTaskId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."License" ADD COLUMN     "customAttrs" JSONB;

-- AlterTable
ALTER TABLE "public"."Outcome" ADD COLUMN     "solutionId" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Release" ADD COLUMN     "customAttrs" JSONB;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fullName" TEXT DEFAULT '',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "username" SET NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "public"."SystemRole" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "public"."Role";

-- CreateTable
CREATE TABLE "public"."AdoptionPlanFilterPreference" (
    "id" TEXT NOT NULL,
    "adoptionPlanId" TEXT NOT NULL,
    "filterReleases" TEXT[],
    "filterOutcomes" TEXT[],
    "filterTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdoptionPlanFilterPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductTag" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskTag" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TaskTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerProductTag" (
    "id" TEXT NOT NULL,
    "customerProductId" TEXT NOT NULL,
    "sourceTagId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProductTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerTaskTag" (
    "id" TEXT NOT NULL,
    "customerTaskId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CustomerTaskTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SolutionAdoptionPlan" (
    "id" TEXT NOT NULL,
    "customerSolutionId" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "solutionName" TEXT NOT NULL,
    "licenseLevel" "public"."LicenseLevel" NOT NULL,
    "selectedOutcomes" JSONB,
    "selectedReleases" JSONB,
    "includedProductIds" JSONB NOT NULL,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "completedWeight" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "progressPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "solutionTasksTotal" INTEGER NOT NULL DEFAULT 0,
    "solutionTasksComplete" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "SolutionAdoptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SolutionAdoptionProduct" (
    "id" TEXT NOT NULL,
    "solutionAdoptionPlanId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "completedWeight" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "progressPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "public"."SolutionProductStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolutionAdoptionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerSolutionTask" (
    "id" TEXT NOT NULL,
    "solutionAdoptionPlanId" TEXT NOT NULL,
    "originalTaskId" TEXT NOT NULL,
    "sourceType" "public"."TaskSourceType" NOT NULL,
    "sourceProductId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estMinutes" INTEGER NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "howToDoc" TEXT[],
    "howToVideo" TEXT[],
    "notes" TEXT,
    "licenseLevel" "public"."LicenseLevel" NOT NULL,
    "status" "public"."CustomerTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "statusUpdatedAt" TIMESTAMP(3),
    "statusUpdatedBy" TEXT,
    "statusUpdateSource" "public"."StatusUpdateSource",
    "statusNotes" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSolutionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SolutionTaskOrder" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "sourceType" "public"."TaskSourceType" NOT NULL,
    "sourceProductId" TEXT,
    "sequenceNumber" INTEGER NOT NULL,

    CONSTRAINT "SolutionTaskOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT,
    "roleName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "resourceType" "public"."ResourceType" NOT NULL,
    "resourceId" TEXT,
    "permissionLevel" "public"."PermissionLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceType" "public"."ResourceType" NOT NULL,
    "resourceId" TEXT,
    "permissionLevel" "public"."PermissionLevel" NOT NULL,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SolutionTag" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolutionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SolutionTaskTag" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolutionTaskTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerSolutionTag" (
    "id" TEXT NOT NULL,
    "customerSolutionId" TEXT NOT NULL,
    "sourceTagId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSolutionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerSolutionTaskTag" (
    "id" TEXT NOT NULL,
    "customerSolutionTaskId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSolutionTaskTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdoptionPlanFilterPreference_adoptionPlanId_key" ON "public"."AdoptionPlanFilterPreference"("adoptionPlanId");

-- CreateIndex
CREATE INDEX "ProductTag_productId_idx" ON "public"."ProductTag"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTag_productId_name_key" ON "public"."ProductTag"("productId", "name");

-- CreateIndex
CREATE INDEX "TaskTag_taskId_idx" ON "public"."TaskTag"("taskId");

-- CreateIndex
CREATE INDEX "TaskTag_tagId_idx" ON "public"."TaskTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTag_taskId_tagId_key" ON "public"."TaskTag"("taskId", "tagId");

-- CreateIndex
CREATE INDEX "CustomerProductTag_customerProductId_idx" ON "public"."CustomerProductTag"("customerProductId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProductTag_customerProductId_name_key" ON "public"."CustomerProductTag"("customerProductId", "name");

-- CreateIndex
CREATE INDEX "CustomerTaskTag_customerTaskId_idx" ON "public"."CustomerTaskTag"("customerTaskId");

-- CreateIndex
CREATE INDEX "CustomerTaskTag_tagId_idx" ON "public"."CustomerTaskTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTaskTag_customerTaskId_tagId_key" ON "public"."CustomerTaskTag"("customerTaskId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionAdoptionPlan_customerSolutionId_key" ON "public"."SolutionAdoptionPlan"("customerSolutionId");

-- CreateIndex
CREATE INDEX "SolutionAdoptionPlan_customerSolutionId_idx" ON "public"."SolutionAdoptionPlan"("customerSolutionId");

-- CreateIndex
CREATE INDEX "SolutionAdoptionPlan_solutionId_idx" ON "public"."SolutionAdoptionPlan"("solutionId");

-- CreateIndex
CREATE INDEX "SolutionAdoptionProduct_solutionAdoptionPlanId_idx" ON "public"."SolutionAdoptionProduct"("solutionAdoptionPlanId");

-- CreateIndex
CREATE INDEX "SolutionAdoptionProduct_productId_idx" ON "public"."SolutionAdoptionProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionAdoptionProduct_solutionAdoptionPlanId_productId_key" ON "public"."SolutionAdoptionProduct"("solutionAdoptionPlanId", "productId");

-- CreateIndex
CREATE INDEX "CustomerSolutionTask_solutionAdoptionPlanId_idx" ON "public"."CustomerSolutionTask"("solutionAdoptionPlanId");

-- CreateIndex
CREATE INDEX "CustomerSolutionTask_originalTaskId_idx" ON "public"."CustomerSolutionTask"("originalTaskId");

-- CreateIndex
CREATE INDEX "CustomerSolutionTask_sourceProductId_idx" ON "public"."CustomerSolutionTask"("sourceProductId");

-- CreateIndex
CREATE INDEX "SolutionTaskOrder_solutionId_idx" ON "public"."SolutionTaskOrder"("solutionId");

-- CreateIndex
CREATE INDEX "SolutionTaskOrder_taskId_idx" ON "public"."SolutionTaskOrder"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionTaskOrder_solutionId_sequenceNumber_key" ON "public"."SolutionTaskOrder"("solutionId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionTaskOrder_solutionId_taskId_key" ON "public"."SolutionTaskOrder"("solutionId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "public"."UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "public"."UserRole"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "public"."RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_resourceType_resourceId_idx" ON "public"."RolePermission"("resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_resourceType_resourceId_key" ON "public"."RolePermission"("roleId", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "Permission_userId_idx" ON "public"."Permission"("userId");

-- CreateIndex
CREATE INDEX "Permission_resourceType_resourceId_idx" ON "public"."Permission"("resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_userId_resourceType_resourceId_key" ON "public"."Permission"("userId", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "SolutionTag_solutionId_idx" ON "public"."SolutionTag"("solutionId");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionTag_solutionId_name_key" ON "public"."SolutionTag"("solutionId", "name");

-- CreateIndex
CREATE INDEX "SolutionTaskTag_taskId_idx" ON "public"."SolutionTaskTag"("taskId");

-- CreateIndex
CREATE INDEX "SolutionTaskTag_tagId_idx" ON "public"."SolutionTaskTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionTaskTag_taskId_tagId_key" ON "public"."SolutionTaskTag"("taskId", "tagId");

-- CreateIndex
CREATE INDEX "CustomerSolutionTag_customerSolutionId_idx" ON "public"."CustomerSolutionTag"("customerSolutionId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSolutionTag_customerSolutionId_name_key" ON "public"."CustomerSolutionTag"("customerSolutionId", "name");

-- CreateIndex
CREATE INDEX "CustomerSolutionTaskTag_customerSolutionTaskId_idx" ON "public"."CustomerSolutionTaskTag"("customerSolutionTaskId");

-- CreateIndex
CREATE INDEX "CustomerSolutionTaskTag_tagId_idx" ON "public"."CustomerSolutionTaskTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSolutionTaskTag_customerSolutionTaskId_tagId_key" ON "public"."CustomerSolutionTaskTag"("customerSolutionTaskId", "tagId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerProduct_customerSolutionId_idx" ON "public"."CustomerProduct"("customerSolutionId");

-- CreateIndex
CREATE INDEX "CustomerTaskOutcome_customerSolutionTaskId_idx" ON "public"."CustomerTaskOutcome"("customerSolutionTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTaskOutcome_customerSolutionTaskId_outcomeId_key" ON "public"."CustomerTaskOutcome"("customerSolutionTaskId", "outcomeId");

-- CreateIndex
CREATE INDEX "CustomerTaskRelease_customerSolutionTaskId_idx" ON "public"."CustomerTaskRelease"("customerSolutionTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTaskRelease_customerSolutionTaskId_releaseId_key" ON "public"."CustomerTaskRelease"("customerSolutionTaskId", "releaseId");

-- CreateIndex
CREATE INDEX "CustomerTelemetryAttribute_customerSolutionTaskId_idx" ON "public"."CustomerTelemetryAttribute"("customerSolutionTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTelemetryAttribute_customerSolutionTaskId_name_key" ON "public"."CustomerTelemetryAttribute"("customerSolutionTaskId", "name");

-- CreateIndex
CREATE INDEX "Outcome_productId_idx" ON "public"."Outcome"("productId");

-- CreateIndex
CREATE INDEX "Outcome_solutionId_idx" ON "public"."Outcome"("solutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Outcome_solutionId_name_key" ON "public"."Outcome"("solutionId", "name");

-- AddForeignKey
ALTER TABLE "public"."CustomerProduct" ADD CONSTRAINT "CustomerProduct_customerSolutionId_fkey" FOREIGN KEY ("customerSolutionId") REFERENCES "public"."CustomerSolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdoptionPlanFilterPreference" ADD CONSTRAINT "AdoptionPlanFilterPreference_adoptionPlanId_fkey" FOREIGN KEY ("adoptionPlanId") REFERENCES "public"."AdoptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTelemetryAttribute" ADD CONSTRAINT "CustomerTelemetryAttribute_customerSolutionTaskId_fkey" FOREIGN KEY ("customerSolutionTaskId") REFERENCES "public"."CustomerSolutionTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTaskOutcome" ADD CONSTRAINT "CustomerTaskOutcome_customerSolutionTaskId_fkey" FOREIGN KEY ("customerSolutionTaskId") REFERENCES "public"."CustomerSolutionTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTaskRelease" ADD CONSTRAINT "CustomerTaskRelease_customerSolutionTaskId_fkey" FOREIGN KEY ("customerSolutionTaskId") REFERENCES "public"."CustomerSolutionTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTag" ADD CONSTRAINT "ProductTag_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTag" ADD CONSTRAINT "TaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskTag" ADD CONSTRAINT "TaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."ProductTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerProductTag" ADD CONSTRAINT "CustomerProductTag_customerProductId_fkey" FOREIGN KEY ("customerProductId") REFERENCES "public"."CustomerProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTaskTag" ADD CONSTRAINT "CustomerTaskTag_customerTaskId_fkey" FOREIGN KEY ("customerTaskId") REFERENCES "public"."CustomerTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerTaskTag" ADD CONSTRAINT "CustomerTaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."CustomerProductTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Outcome" ADD CONSTRAINT "Outcome_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "public"."Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolutionAdoptionPlan" ADD CONSTRAINT "SolutionAdoptionPlan_customerSolutionId_fkey" FOREIGN KEY ("customerSolutionId") REFERENCES "public"."CustomerSolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolutionAdoptionProduct" ADD CONSTRAINT "SolutionAdoptionProduct_solutionAdoptionPlanId_fkey" FOREIGN KEY ("solutionAdoptionPlanId") REFERENCES "public"."SolutionAdoptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerSolutionTask" ADD CONSTRAINT "CustomerSolutionTask_solutionAdoptionPlanId_fkey" FOREIGN KEY ("solutionAdoptionPlanId") REFERENCES "public"."SolutionAdoptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolutionTaskOrder" ADD CONSTRAINT "SolutionTaskOrder_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "public"."Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Permission" ADD CONSTRAINT "Permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Permission" ADD CONSTRAINT "Permission_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolutionTag" ADD CONSTRAINT "SolutionTag_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "public"."Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolutionTaskTag" ADD CONSTRAINT "SolutionTaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolutionTaskTag" ADD CONSTRAINT "SolutionTaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."SolutionTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerSolutionTag" ADD CONSTRAINT "CustomerSolutionTag_customerSolutionId_fkey" FOREIGN KEY ("customerSolutionId") REFERENCES "public"."CustomerSolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerSolutionTaskTag" ADD CONSTRAINT "CustomerSolutionTaskTag_customerSolutionTaskId_fkey" FOREIGN KEY ("customerSolutionTaskId") REFERENCES "public"."CustomerSolutionTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerSolutionTaskTag" ADD CONSTRAINT "CustomerSolutionTaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."CustomerSolutionTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;


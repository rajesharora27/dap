/*
  Warnings:

  - You are about to drop the column `customAttrs` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `statusId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `TaskDependency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."LicenseLevel" AS ENUM ('ESSENTIAL', 'ADVANTAGE', 'SIGNATURE');

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_statusId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TaskDependency" DROP CONSTRAINT "TaskDependency_dependsOnId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TaskDependency" DROP CONSTRAINT "TaskDependency_taskId_fkey";

-- AlterTable
ALTER TABLE "public"."License" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "customAttrs",
DROP COLUMN "statusId",
ADD COLUMN     "licenseLevel" "public"."LicenseLevel" NOT NULL DEFAULT 'ESSENTIAL',
ADD COLUMN     "priority" TEXT;

-- DropTable
DROP TABLE "public"."TaskDependency";

-- DropTable
DROP TABLE "public"."TaskStatus";

-- CreateTable
CREATE TABLE "public"."Outcome" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskOutcome" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,

    CONSTRAINT "TaskOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Outcome_productId_name_key" ON "public"."Outcome"("productId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TaskOutcome_taskId_outcomeId_key" ON "public"."TaskOutcome"("taskId", "outcomeId");

-- AddForeignKey
ALTER TABLE "public"."Outcome" ADD CONSTRAINT "Outcome_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskOutcome" ADD CONSTRAINT "TaskOutcome_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskOutcome" ADD CONSTRAINT "TaskOutcome_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "public"."Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

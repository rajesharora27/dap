-- CreateEnum
CREATE TYPE "public"."TelemetryDataType" AS ENUM ('BOOLEAN', 'NUMBER', 'STRING', 'TIMESTAMP', 'JSON');

-- CreateTable
CREATE TABLE "public"."TelemetryAttribute" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataType" "public"."TelemetryDataType" NOT NULL DEFAULT 'STRING',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "successCriteria" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelemetryAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TelemetryValue" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "source" TEXT,
    "batchId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelemetryAttribute_taskId_idx" ON "public"."TelemetryAttribute"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TelemetryAttribute_taskId_name_key" ON "public"."TelemetryAttribute"("taskId", "name");

-- CreateIndex
CREATE INDEX "TelemetryValue_attributeId_idx" ON "public"."TelemetryValue"("attributeId");

-- CreateIndex
CREATE INDEX "TelemetryValue_batchId_idx" ON "public"."TelemetryValue"("batchId");

-- CreateIndex
CREATE INDEX "TelemetryValue_createdAt_idx" ON "public"."TelemetryValue"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."TelemetryAttribute" ADD CONSTRAINT "TelemetryAttribute_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TelemetryValue" ADD CONSTRAINT "TelemetryValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "public"."TelemetryAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

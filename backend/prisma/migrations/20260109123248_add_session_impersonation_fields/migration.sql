-- AlterTable
ALTER TABLE "PersonalProduct" ADD COLUMN     "customAttrs" JSONB;

-- AlterTable
ALTER TABLE "PersonalRelease" ADD COLUMN     "description" TEXT,
ADD COLUMN     "level" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE "PersonalTask" ADD COLUMN     "licenseLevel" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "CustomerTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "statusNotes" TEXT,
ADD COLUMN     "statusUpdateSource" TEXT,
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "statusUpdatedBy" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "impersonatedById" TEXT,
ADD COLUMN     "isImpersonation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PersonalLicense" (
    "id" TEXT NOT NULL,
    "personalProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customAttrs" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalTag" (
    "id" TEXT NOT NULL,
    "personalProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalTaskTag" (
    "id" TEXT NOT NULL,
    "personalTaskId" TEXT NOT NULL,
    "personalTagId" TEXT NOT NULL,

    CONSTRAINT "PersonalTaskTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalTelemetryAttribute" (
    "id" TEXT NOT NULL,
    "personalTaskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataType" "TelemetryDataType" NOT NULL DEFAULT 'STRING',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "successCriteria" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMet" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalTelemetryAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalTelemetryValue" (
    "id" TEXT NOT NULL,
    "personalAttributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT DEFAULT 'manual',
    "batchId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalTelemetryValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalLicense_personalProductId_idx" ON "PersonalLicense"("personalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalLicense_personalProductId_name_key" ON "PersonalLicense"("personalProductId", "name");

-- CreateIndex
CREATE INDEX "PersonalTag_personalProductId_idx" ON "PersonalTag"("personalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalTag_personalProductId_name_key" ON "PersonalTag"("personalProductId", "name");

-- CreateIndex
CREATE INDEX "PersonalTaskTag_personalTaskId_idx" ON "PersonalTaskTag"("personalTaskId");

-- CreateIndex
CREATE INDEX "PersonalTaskTag_personalTagId_idx" ON "PersonalTaskTag"("personalTagId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalTaskTag_personalTaskId_personalTagId_key" ON "PersonalTaskTag"("personalTaskId", "personalTagId");

-- CreateIndex
CREATE INDEX "PersonalTelemetryAttribute_personalTaskId_idx" ON "PersonalTelemetryAttribute"("personalTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalTelemetryAttribute_personalTaskId_name_key" ON "PersonalTelemetryAttribute"("personalTaskId", "name");

-- CreateIndex
CREATE INDEX "PersonalTelemetryValue_personalAttributeId_idx" ON "PersonalTelemetryValue"("personalAttributeId");

-- CreateIndex
CREATE INDEX "PersonalTelemetryValue_batchId_idx" ON "PersonalTelemetryValue"("batchId");

-- CreateIndex
CREATE INDEX "Session_impersonatedById_idx" ON "Session"("impersonatedById");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_impersonatedById_fkey" FOREIGN KEY ("impersonatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalLicense" ADD CONSTRAINT "PersonalLicense_personalProductId_fkey" FOREIGN KEY ("personalProductId") REFERENCES "PersonalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTag" ADD CONSTRAINT "PersonalTag_personalProductId_fkey" FOREIGN KEY ("personalProductId") REFERENCES "PersonalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTaskTag" ADD CONSTRAINT "PersonalTaskTag_personalTaskId_fkey" FOREIGN KEY ("personalTaskId") REFERENCES "PersonalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTaskTag" ADD CONSTRAINT "PersonalTaskTag_personalTagId_fkey" FOREIGN KEY ("personalTagId") REFERENCES "PersonalTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTelemetryAttribute" ADD CONSTRAINT "PersonalTelemetryAttribute_personalTaskId_fkey" FOREIGN KEY ("personalTaskId") REFERENCES "PersonalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTelemetryValue" ADD CONSTRAINT "PersonalTelemetryValue_personalAttributeId_fkey" FOREIGN KEY ("personalAttributeId") REFERENCES "PersonalTelemetryAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalTask" (
    "id" TEXT NOT NULL,
    "personalProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estMinutes" INTEGER NOT NULL DEFAULT 30,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "sequenceNumber" INTEGER NOT NULL DEFAULT 0,
    "howToDoc" TEXT[],
    "howToVideo" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalOutcome" (
    "id" TEXT NOT NULL,
    "personalProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalRelease" (
    "id" TEXT NOT NULL,
    "personalProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "releaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalTaskOutcome" (
    "id" TEXT NOT NULL,
    "personalTaskId" TEXT NOT NULL,
    "personalOutcomeId" TEXT NOT NULL,

    CONSTRAINT "PersonalTaskOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalTaskRelease" (
    "id" TEXT NOT NULL,
    "personalTaskId" TEXT NOT NULL,
    "personalReleaseId" TEXT NOT NULL,

    CONSTRAINT "PersonalTaskRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personalProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalAssignmentTask" (
    "id" TEXT NOT NULL,
    "personalAssignmentId" TEXT NOT NULL,
    "personalTaskId" TEXT NOT NULL,
    "status" "CustomerTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "statusNotes" TEXT,
    "statusUpdatedAt" TIMESTAMP(3),
    "sequenceNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalAssignmentTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE INDEX "AppSetting_category_idx" ON "AppSetting"("category");

-- CreateIndex
CREATE INDEX "PersonalProduct_userId_idx" ON "PersonalProduct"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalProduct_userId_name_key" ON "PersonalProduct"("userId", "name");

-- CreateIndex
CREATE INDEX "PersonalTask_personalProductId_idx" ON "PersonalTask"("personalProductId");

-- CreateIndex
CREATE INDEX "PersonalOutcome_personalProductId_idx" ON "PersonalOutcome"("personalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalOutcome_personalProductId_name_key" ON "PersonalOutcome"("personalProductId", "name");

-- CreateIndex
CREATE INDEX "PersonalRelease_personalProductId_idx" ON "PersonalRelease"("personalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalRelease_personalProductId_name_key" ON "PersonalRelease"("personalProductId", "name");

-- CreateIndex
CREATE INDEX "PersonalTaskOutcome_personalTaskId_idx" ON "PersonalTaskOutcome"("personalTaskId");

-- CreateIndex
CREATE INDEX "PersonalTaskOutcome_personalOutcomeId_idx" ON "PersonalTaskOutcome"("personalOutcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalTaskOutcome_personalTaskId_personalOutcomeId_key" ON "PersonalTaskOutcome"("personalTaskId", "personalOutcomeId");

-- CreateIndex
CREATE INDEX "PersonalTaskRelease_personalTaskId_idx" ON "PersonalTaskRelease"("personalTaskId");

-- CreateIndex
CREATE INDEX "PersonalTaskRelease_personalReleaseId_idx" ON "PersonalTaskRelease"("personalReleaseId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalTaskRelease_personalTaskId_personalReleaseId_key" ON "PersonalTaskRelease"("personalTaskId", "personalReleaseId");

-- CreateIndex
CREATE INDEX "PersonalAssignment_userId_idx" ON "PersonalAssignment"("userId");

-- CreateIndex
CREATE INDEX "PersonalAssignment_personalProductId_idx" ON "PersonalAssignment"("personalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalAssignment_userId_personalProductId_name_key" ON "PersonalAssignment"("userId", "personalProductId", "name");

-- CreateIndex
CREATE INDEX "PersonalAssignmentTask_personalAssignmentId_idx" ON "PersonalAssignmentTask"("personalAssignmentId");

-- CreateIndex
CREATE INDEX "PersonalAssignmentTask_personalTaskId_idx" ON "PersonalAssignmentTask"("personalTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalAssignmentTask_personalAssignmentId_personalTaskId_key" ON "PersonalAssignmentTask"("personalAssignmentId", "personalTaskId");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "PersonalProduct" ADD CONSTRAINT "PersonalProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTask" ADD CONSTRAINT "PersonalTask_personalProductId_fkey" FOREIGN KEY ("personalProductId") REFERENCES "PersonalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalOutcome" ADD CONSTRAINT "PersonalOutcome_personalProductId_fkey" FOREIGN KEY ("personalProductId") REFERENCES "PersonalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRelease" ADD CONSTRAINT "PersonalRelease_personalProductId_fkey" FOREIGN KEY ("personalProductId") REFERENCES "PersonalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTaskOutcome" ADD CONSTRAINT "PersonalTaskOutcome_personalTaskId_fkey" FOREIGN KEY ("personalTaskId") REFERENCES "PersonalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTaskOutcome" ADD CONSTRAINT "PersonalTaskOutcome_personalOutcomeId_fkey" FOREIGN KEY ("personalOutcomeId") REFERENCES "PersonalOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTaskRelease" ADD CONSTRAINT "PersonalTaskRelease_personalTaskId_fkey" FOREIGN KEY ("personalTaskId") REFERENCES "PersonalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTaskRelease" ADD CONSTRAINT "PersonalTaskRelease_personalReleaseId_fkey" FOREIGN KEY ("personalReleaseId") REFERENCES "PersonalRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAssignment" ADD CONSTRAINT "PersonalAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAssignment" ADD CONSTRAINT "PersonalAssignment_personalProductId_fkey" FOREIGN KEY ("personalProductId") REFERENCES "PersonalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAssignmentTask" ADD CONSTRAINT "PersonalAssignmentTask_personalAssignmentId_fkey" FOREIGN KEY ("personalAssignmentId") REFERENCES "PersonalAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAssignmentTask" ADD CONSTRAINT "PersonalAssignmentTask_personalTaskId_fkey" FOREIGN KEY ("personalTaskId") REFERENCES "PersonalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

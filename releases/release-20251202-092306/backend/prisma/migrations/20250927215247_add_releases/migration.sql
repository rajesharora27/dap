-- CreateTable
CREATE TABLE "public"."Release" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "productId" TEXT,
    "solutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskRelease" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "TaskRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Release_productId_level_key" ON "public"."Release"("productId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "Release_solutionId_level_key" ON "public"."Release"("solutionId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "TaskRelease_taskId_releaseId_key" ON "public"."TaskRelease"("taskId", "releaseId");

-- AddForeignKey
ALTER TABLE "public"."Release" ADD CONSTRAINT "Release_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Release" ADD CONSTRAINT "Release_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "public"."Solution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskRelease" ADD CONSTRAINT "TaskRelease_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskRelease" ADD CONSTRAINT "TaskRelease_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "public"."Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

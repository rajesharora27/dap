-- DropIndex
DROP INDEX "Release_productId_level_key";

-- DropIndex
DROP INDEX "Release_solutionId_level_key";

-- CreateIndex
CREATE INDEX "Release_productId_level_idx" ON "Release"("productId", "level");

-- CreateIndex
CREATE INDEX "Release_solutionId_level_idx" ON "Release"("solutionId", "level");

/*
  Warnings:

  - A unique constraint covering the columns `[customerId,solutionId,name]` on the table `CustomerSolution` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[solutionId,productId]` on the table `License` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CustomerSolution_customerId_solutionId_key";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Solution" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "DiaryTodo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryTodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiaryTodo_userId_idx" ON "DiaryTodo"("userId");

-- CreateIndex
CREATE INDEX "DiaryBookmark_userId_idx" ON "DiaryBookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSolution_customerId_solutionId_name_key" ON "CustomerSolution"("customerId", "solutionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "License_solutionId_productId_key" ON "License"("solutionId", "productId");

-- AddForeignKey
ALTER TABLE "DiaryTodo" ADD CONSTRAINT "DiaryTodo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryBookmark" ADD CONSTRAINT "DiaryBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

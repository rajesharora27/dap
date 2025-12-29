/*
  Warnings:

  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Solution` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "License" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "description",
ADD COLUMN     "resources" JSONB;

-- AlterTable
ALTER TABLE "Release" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Solution" DROP COLUMN "description",
ADD COLUMN     "resources" JSONB;

/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."CustomAttributeDataType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'JSON');

-- CreateTable
CREATE TABLE "public"."CustomAttribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "attributeName" VARCHAR(255) NOT NULL,
    "attributeValue" TEXT,
    "dataType" "public"."CustomAttributeDataType" NOT NULL DEFAULT 'TEXT',
    "description" VARCHAR(500),
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomAttribute_productId_idx" ON "public"."CustomAttribute"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomAttribute_productId_attributeName_key" ON "public"."CustomAttribute"("productId", "attributeName");

-- CreateIndex
CREATE UNIQUE INDEX "CustomAttribute_productId_displayOrder_key" ON "public"."CustomAttribute"("productId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "public"."Product"("name");

-- AddForeignKey
ALTER TABLE "public"."CustomAttribute" ADD CONSTRAINT "CustomAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

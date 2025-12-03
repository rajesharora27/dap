-- DropIndex
DROP INDEX "public"."CustomerProduct_customerId_productId_key";

-- AlterTable
ALTER TABLE "public"."CustomerProduct" ADD COLUMN     "name" TEXT;

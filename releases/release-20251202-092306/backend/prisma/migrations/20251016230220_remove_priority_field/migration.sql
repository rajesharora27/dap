/*
  Warnings:

  - You are about to drop the column `priority` on the `CustomerTask` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."CustomerTask" DROP COLUMN "priority";

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "priority";

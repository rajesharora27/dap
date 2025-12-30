-- AlterTable
ALTER TABLE "DiaryBookmark" ADD COLUMN     "sequenceNumber" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DiaryTodo" ADD COLUMN     "description" TEXT,
ADD COLUMN     "sequenceNumber" INTEGER NOT NULL DEFAULT 0;

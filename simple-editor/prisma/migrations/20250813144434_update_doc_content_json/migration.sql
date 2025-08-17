/*
  Warnings:

  - Changed the type of `content` on the `Doc` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Doc" DROP COLUMN "content",
ADD COLUMN     "content" JSONB NOT NULL;

/*
  Warnings:

  - You are about to drop the column `address` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."users_email_key";

-- AlterTable
ALTER TABLE "public"."clients" DROP COLUMN "address",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "email";

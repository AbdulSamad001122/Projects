/*
  Warnings:

  - You are about to drop the column `status` on the `invoices` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."invoices_status_idx";

-- AlterTable
ALTER TABLE "public"."invoices" DROP COLUMN "status";

-- DropEnum
DROP TYPE "public"."InvoiceStatus";

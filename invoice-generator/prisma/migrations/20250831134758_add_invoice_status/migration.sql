-- AlterTable
ALTER TABLE "public"."clients" ADD COLUMN     "user_clerk_id" TEXT;

-- AlterTable
ALTER TABLE "public"."invoices" ADD COLUMN     "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "public"."invoices"("status");

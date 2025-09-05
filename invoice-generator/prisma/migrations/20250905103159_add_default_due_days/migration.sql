-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'PAID', 'OVERDUE', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."clients" ADD COLUMN     "auto_renumber_invoices" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "bank_account" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "company_email" TEXT,
ADD COLUMN     "company_logo" TEXT,
ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "default_due_days" INTEGER;

-- CreateIndex
CREATE INDEX "invoice_templates_category_idx" ON "public"."invoice_templates"("category");

-- CreateIndex
CREATE INDEX "invoice_templates_isActive_idx" ON "public"."invoice_templates"("isActive");

-- CreateIndex
CREATE INDEX "invoice_templates_isDefault_idx" ON "public"."invoice_templates"("isDefault");

-- CreateIndex
CREATE INDEX "invoices_template_id_idx" ON "public"."invoices"("template_id");

-- CreateIndex
CREATE INDEX "invoices_client_id_created_at_idx" ON "public"."invoices"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "invoices_user_id_client_id_idx" ON "public"."invoices"("user_id", "client_id");

-- CreateIndex
CREATE INDEX "items_is_for_all_clients_idx" ON "public"."items"("is_for_all_clients");

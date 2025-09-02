-- AlterTable
ALTER TABLE "public"."invoices" ADD COLUMN     "template_id" TEXT;

-- CreateTable
CREATE TABLE "public"."invoice_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "preview" TEXT,
    "styles" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_templates_pkey" PRIMARY KEY ("id")
);

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

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."invoice_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `description` on the `invoice_templates` table. All the data in the column will be lost.
  - You are about to drop the column `styles` on the `invoice_templates` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `invoice_templates` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."invoice_templates_category_idx";

-- DropIndex
DROP INDEX "public"."invoice_templates_isActive_idx";

-- DropIndex
DROP INDEX "public"."invoice_templates_isDefault_idx";

-- DropIndex
DROP INDEX "public"."invoices_client_id_created_at_idx";

-- DropIndex
DROP INDEX "public"."invoices_template_id_idx";

-- DropIndex
DROP INDEX "public"."invoices_user_id_client_id_idx";

-- AlterTable
ALTER TABLE "public"."invoice_templates" DROP COLUMN "description",
DROP COLUMN "styles",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "is_for_all_clients" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item_clients" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,

    CONSTRAINT "item_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "items_user_id_idx" ON "public"."items"("user_id");

-- CreateIndex
CREATE INDEX "item_clients_item_id_idx" ON "public"."item_clients"("item_id");

-- CreateIndex
CREATE INDEX "item_clients_client_id_idx" ON "public"."item_clients"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_clients_item_id_client_id_key" ON "public"."item_clients"("item_id", "client_id");

-- CreateIndex
CREATE INDEX "invoice_templates_user_id_idx" ON "public"."invoice_templates"("user_id");

-- AddForeignKey
ALTER TABLE "public"."invoice_templates" ADD CONSTRAINT "invoice_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."items" ADD CONSTRAINT "items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_clients" ADD CONSTRAINT "item_clients_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_clients" ADD CONSTRAINT "item_clients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

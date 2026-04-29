ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "lineReference" TEXT,
  ADD COLUMN IF NOT EXISTS "productNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "partNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "serialNumber" TEXT;

WITH ranked_order_items AS (
  SELECT
    id,
    "orderId",
    ROW_NUMBER() OVER (PARTITION BY "orderId" ORDER BY id) AS seq
  FROM "OrderItem"
)
UPDATE "OrderItem" oi
SET
  "lineReference" = CONCAT(ranked_order_items."orderId", '-LI-', LPAD(CAST(ranked_order_items.seq AS TEXT), 4, '0')),
  "productNumber" = COALESCE(oi."sku", oi."variantId"),
  "partNumber" = COALESCE(oi."partNumber", ''),
  "serialNumber" = COALESCE(oi."serialNumber", '')
FROM ranked_order_items
WHERE oi.id = ranked_order_items.id;

UPDATE "OrderItem"
SET
  "lineReference" = COALESCE("lineReference", CONCAT("orderId", '-LI-0001')),
  "productNumber" = COALESCE("productNumber", COALESCE("sku", "variantId")),
  "partNumber" = COALESCE("partNumber", ''),
  "serialNumber" = COALESCE("serialNumber", '');

ALTER TABLE "OrderItem"
  ALTER COLUMN "lineReference" SET NOT NULL,
  ALTER COLUMN "productNumber" SET NOT NULL,
  ALTER COLUMN "partNumber" SET NOT NULL,
  ALTER COLUMN "serialNumber" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "OrderItem_lineReference_key" ON "OrderItem"("lineReference");
CREATE INDEX IF NOT EXISTS "OrderItem_inventoryItemId_idx" ON "OrderItem"("inventoryItemId");
CREATE INDEX IF NOT EXISTS "OrderItem_productNumber_idx" ON "OrderItem"("productNumber");

ALTER TABLE "InvoiceLineItem"
  ADD COLUMN IF NOT EXISTS "orderItemId" TEXT,
  ADD COLUMN IF NOT EXISTS "inventoryItemId" TEXT,
  ADD COLUMN IF NOT EXISTS "lineReference" TEXT,
  ADD COLUMN IF NOT EXISTS "productNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "partNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "serialNumber" TEXT;

CREATE INDEX IF NOT EXISTS "InvoiceLineItem_orderItemId_idx" ON "InvoiceLineItem"("orderItemId");
CREATE INDEX IF NOT EXISTS "InvoiceLineItem_inventoryItemId_idx" ON "InvoiceLineItem"("inventoryItemId");

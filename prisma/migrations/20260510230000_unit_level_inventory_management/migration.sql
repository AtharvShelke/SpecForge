ALTER TABLE "InventoryItem"
ALTER COLUMN "quantity" SET DEFAULT 1;

CREATE TABLE "order_item_units" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "serial_number" TEXT,
    "part_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_units_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StockMovement"
ADD COLUMN "inventory_item_id" TEXT;

CREATE INDEX "order_item_units_order_item_id_idx" ON "order_item_units"("order_item_id");
CREATE INDEX "order_item_units_inventory_item_id_idx" ON "order_item_units"("inventory_item_id");
CREATE INDEX "StockMovement_inventory_item_id_idx" ON "StockMovement"("inventory_item_id");

CREATE UNIQUE INDEX "InventoryItem_productId_partNumber_key" ON "InventoryItem"("productId", "partNumber");
CREATE UNIQUE INDEX "InventoryItem_productId_serialNumber_key" ON "InventoryItem"("productId", "serialNumber");

ALTER TABLE "order_item_units"
ADD CONSTRAINT "order_item_units_order_item_id_fkey"
FOREIGN KEY ("order_item_id") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_item_units"
ADD CONSTRAINT "order_item_units_inventory_item_id_fkey"
FOREIGN KEY ("inventory_item_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
ADD CONSTRAINT "StockMovement_inventory_item_id_fkey"
FOREIGN KEY ("inventory_item_id") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

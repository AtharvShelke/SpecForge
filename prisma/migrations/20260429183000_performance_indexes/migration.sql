CREATE INDEX IF NOT EXISTS "SpecDefinition_subCategoryId_isFilterable_filterOrder_idx"
ON "SpecDefinition"("subCategoryId", "isFilterable", "filterOrder");

CREATE INDEX IF NOT EXISTS "Product_deletedAt_status_createdAt_idx"
ON "Product"("deletedAt", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "ProductVariant_deletedAt_idx"
ON "ProductVariant"("deletedAt");

CREATE INDEX IF NOT EXISTS "ProductVariant_productId_deletedAt_idx"
ON "ProductVariant"("productId", "deletedAt");

CREATE INDEX IF NOT EXISTS "ProductVariant_status_deletedAt_idx"
ON "ProductVariant"("status", "deletedAt");

CREATE INDEX IF NOT EXISTS "Order_deletedAt_status_date_idx"
ON "Order"("deletedAt", "status", "date");

CREATE INDEX IF NOT EXISTS "BuildGuide_category_createdAt_idx"
ON "BuildGuide"("category", "createdAt");

CREATE INDEX IF NOT EXISTS "InventoryItem_variantId_trackingType_idx"
ON "InventoryItem"("variantId", "trackingType");

CREATE INDEX IF NOT EXISTS "InventoryItem_status_variantId_idx"
ON "InventoryItem"("status", "variantId");

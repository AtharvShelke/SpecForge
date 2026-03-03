import { prisma } from "./lib/prisma";

async function main() {
    console.log("Deleting old data...");

    // Ordered by dependencies (delete children first)
    const tables = [
        "InvoiceAuditEvent",
        "InvoiceLineItem",
        "Invoice",
        "InvoiceSequence",
        "ShipmentTracking",
        "OrderLog",
        "OrderItem",
        "Order",
        "SavedBuildItem",
        "SavedBuild",
        "StockMovement",
        "WarehouseInventory",
        "PurchaseOrderItem",
        "PurchaseOrder",
        "ProductMedia",
        "ProductVariant",
        "ProductSpec",
        "Review",
        "_ProductToTag",
        "Tag",
        "Product",
        "Brand",
        "User"
    ];

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`DELETE FROM "${table}" CASCADE`);
            console.log(`Cleared ${table}`);
        } catch (e) {
            // ignore if table doesn't exist yet
        }
    }

    console.log("Cleanup complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { getInventoryItems } from "./services/inventory.service";
import { listOrders } from "./services/order.service";
import { serializeOrders, serializeInventoryItems } from "./lib/adminSerializers";

async function main() {
  console.log("--- Testing getInventoryItems() ---");
  try {
    const items = await getInventoryItems();
    console.log("Found raw items:", items.length);
    const serialized = serializeInventoryItems(items as any[]);
    console.log("Serialized items success, length:", serialized.length);
  } catch (err: any) {
    console.error("Error in getInventoryItems() or serialization:", err);
  }

  console.log("--- Testing listOrders() ---");
  try {
    const orders = await listOrders({ page: 1, limit: 1000 });
    console.log("Found raw orders:", orders.length);
    const serialized = serializeOrders(orders as any[]);
    console.log("Serialized orders success, length:", serialized.length);
  } catch (err: any) {
    console.error("Error in listOrders() or serialization:", err);
  }
}

main().catch(console.error);

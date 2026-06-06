import { prisma } from "./lib/prisma";

async function main() {
  console.log("Starting database cleanup of checkout, order, and payment data...");

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Payment Attempt
      const deletedPaymentAttempts = await tx.paymentAttempt.deleteMany();
      console.log(`Deleted ${deletedPaymentAttempts.count} PaymentAttempt records.`);

      // 2. Payment Transaction
      const deletedPaymentTransactions = await tx.paymentTransaction.deleteMany();
      console.log(`Deleted ${deletedPaymentTransactions.count} PaymentTransaction records.`);

      // 3. Order Item Unit
      const deletedOrderItemUnits = await tx.orderItemUnit.deleteMany();
      console.log(`Deleted ${deletedOrderItemUnits.count} OrderItemUnit records.`);

      // 4. Order Item
      const deletedOrderItems = await tx.orderItem.deleteMany();
      console.log(`Deleted ${deletedOrderItems.count} OrderItem records.`);

      // 5. Order Log
      const deletedOrderLogs = await tx.orderLog.deleteMany();
      console.log(`Deleted ${deletedOrderLogs.count} OrderLog records.`);

      // 6. Shipment Tracking
      const deletedShipments = await tx.shipmentTracking.deleteMany();
      console.log(`Deleted ${deletedShipments.count} ShipmentTracking records.`);

      // 7. Invoice Line Items & Audit Events
      const deletedInvoiceLineItems = await tx.invoiceLineItem.deleteMany();
      console.log(`Deleted ${deletedInvoiceLineItems.count} InvoiceLineItem records.`);

      const deletedInvoiceAuditEvents = await tx.invoiceAuditEvent.deleteMany();
      console.log(`Deleted ${deletedInvoiceAuditEvents.count} InvoiceAuditEvent records.`);

      // 8. Invoices
      const deletedInvoices = await tx.invoice.deleteMany();
      console.log(`Deleted ${deletedInvoices.count} Invoice records.`);

      // 9. Reservations
      const deletedReservations = await tx.reservation.deleteMany();
      console.log(`Deleted ${deletedReservations.count} Reservation records.`);

      // 10. Stock Movements associated with Orders
      const deletedStockMovements = await tx.stockMovement.deleteMany({
        where: { orderId: { not: null } }
      });
      console.log(`Deleted ${deletedStockMovements.count} StockMovement records.`);

      // 11. Credit Notes
      const deletedCreditNoteLineItems = await tx.creditNoteLineItem.deleteMany();
      console.log(`Deleted ${deletedCreditNoteLineItems.count} CreditNoteLineItem records.`);

      const deletedCreditNotes = await tx.creditNote.deleteMany();
      console.log(`Deleted ${deletedCreditNotes.count} CreditNote records.`);

      // 12. Finally, delete the Orders
      const deletedOrders = await tx.order.deleteMany();
      console.log(`Deleted ${deletedOrders.count} Order records.`);
    });

    console.log("Cleanup completed successfully!");
  } catch (error) {
    console.error("Cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

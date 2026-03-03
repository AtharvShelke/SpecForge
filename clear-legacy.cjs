const { PrismaClient } = require('./generated/prisma/index.js');
const prisma = new PrismaClient();

async function main() {
    console.log("Deleting old stock movements...");
    await prisma.stockMovement.deleteMany({});

    console.log("Deleting old inventory items...");
    await prisma.inventoryItem.deleteMany({});

    console.log("Cleanup complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { prisma } from "@/lib/prisma";



async function main() {
    console.log('Seeding procurement data...');

    // 1. Get some variants for PO items
    const variants = await prisma.productVariant.findMany({
        take: 10,
        include: {
            product: true
        }
    });

    if (variants.length === 0) {
        console.error('No variants found. Please seed products first.');
        return;
    }

    // 2. Get a warehouse
    const warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) {
        console.error('No warehouse found. Please seed warehouses first.');
        return;
    }

    // 3. Create Suppliers
    const suppliers = [
        {
            name: 'Intel Corp (North America)',
            email: 'procurement@intel.com',
            phone: '+1-555-0123',
            address: '2200 Mission College Blvd, Santa Clara, CA'
        },
        {
            name: 'ASUS Global Logistics',
            email: 'sales@asus.tw',
            phone: '+886-2-2894-3447',
            address: '15, Li-Te Rd., Beitou Dist., Taipei 112, Taiwan'
        },
        {
            name: 'Corsair Components Inc.',
            email: 'orders@corsair.com',
            phone: '+1-510-657-8747',
            address: '47100 Bayside Pkwy, Fremont, CA'
        }
    ];

    console.log('Creating suppliers...');
    for (const s of suppliers) {
        await prisma.supplier.upsert({
            where: { name: s.name },
            update: {},
            create: s
        });
    }

    const dbSuppliers = await prisma.supplier.findMany();

    // 4. Create Purchase Orders
    console.log('Creating purchase orders...');

    // PENDING PO
    await prisma.purchaseOrder.create({
        data: {
            supplierId: dbSuppliers[0].id,
            warehouseId: warehouse.id,
            status: 'PENDING',
            expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            items: {
                create: [
                    {
                        variantId: variants[0].id,
                        quantityOrdered: 50,
                        quantityReceived: 0,
                        unitCost: variants[0].price * 0.7
                    },
                    {
                        variantId: variants[1].id,
                        quantityOrdered: 20,
                        quantityReceived: 0,
                        unitCost: variants[1].price * 0.7
                    }
                ]
            }
        }
    });

    // PARTIAL PO
    await prisma.purchaseOrder.create({
        data: {
            supplierId: dbSuppliers[1].id,
            warehouseId: warehouse.id,
            status: 'PARTIAL',
            expectedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            items: {
                create: [
                    {
                        variantId: variants[2].id,
                        quantityOrdered: 100,
                        quantityReceived: 45,
                        unitCost: variants[2].price * 0.65
                    },
                    {
                        variantId: variants[3].id,
                        quantityOrdered: 10,
                        quantityReceived: 10,
                        unitCost: variants[3].price * 0.65
                    }
                ]
            }
        }
    });

    // COMPLETED PO
    await prisma.purchaseOrder.create({
        data: {
            supplierId: dbSuppliers[2].id,
            warehouseId: warehouse.id,
            status: 'COMPLETED',
            expectedDelivery: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            items: {
                create: [
                    {
                        variantId: variants[4].id,
                        quantityOrdered: 30,
                        quantityReceived: 30,
                        unitCost: variants[4].price * 0.75
                    }
                ]
            }
        }
    });

    console.log('Procurement seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

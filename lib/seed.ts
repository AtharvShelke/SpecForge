import "dotenv/config";
import crypto from "crypto";
import {
  CompatibilityLevel,
  Role,
  ProductStatus,
} from "../generated/prisma/client";
import { prisma } from "./prisma";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type SeedAttribute = {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "multi_select";
  required?: boolean;
  isFilterable?: boolean;
  filterType?: "checkbox" | "range" | "boolean" | "search" | "dropdown";
  unit?: string;
  sortOrder: number;
  options?: string[];
  dependencyKey?: string;
  dependencyValue?: string;
};

type SeedCategory = {
  code: string;
  name: string;
  shortLabel: string;
  icon: string;
  displayOrder: number;
  featuredOrder?: number;
  showInFeatured?: boolean;
  description: string;
  image?: string;
  subcategories: string[];
  attributes: SeedAttribute[];
};

type SeedProduct = {
  sku: string;
  name: string;
  categoryCode: string;
  subcategory?: string;
  brand: string;
  price: number;
  stock: number;
  description: string;
  image: string;
  specs: Record<string, string>;
};

// Categories are now managed through the admin panel
// No hardcoded categories - use the admin panel to configure categories

// Products are now managed through the admin panel
// No hardcoded products - use the admin panel to configure products
const PRODUCTS: SeedProduct[] = [];

async function resetCatalog() {
  // Clear all data before seeding
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.creditNoteLineItem.deleteMany().catch(() => {});
  await prisma.creditNote.deleteMany().catch(() => {});
  await prisma.paymentAttempt.deleteMany().catch(() => {});
  await prisma.paymentTransaction.deleteMany().catch(() => {});
  await prisma.invoiceAuditEvent.deleteMany().catch(() => {});
  await prisma.invoiceLineItem.deleteMany().catch(() => {});
  await prisma.invoice.deleteMany().catch(() => {});
  await prisma.shipmentTracking.deleteMany().catch(() => {});
  await prisma.orderLog.deleteMany().catch(() => {});
  await prisma.orderItemUnit.deleteMany().catch(() => {});
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});
  await prisma.billingProfile.deleteMany().catch(() => {});
  await prisma.searchSuggestion.deleteMany().catch(() => {});
  await prisma.categoryProductCache.deleteMany().catch(() => {});
  await prisma.compatibilityRuleClause.deleteMany().catch(() => {});
  await prisma.compatibilityRule.deleteMany().catch(() => {});
  await prisma.productSpec.deleteMany().catch(() => {});
  await prisma.productMedia.deleteMany().catch(() => {});
  await prisma.inventoryItem.deleteMany().catch(() => {});
  await prisma.stockMovement.deleteMany().catch(() => {});
  await prisma.buildGuideItem.deleteMany().catch(() => {});
  await prisma.buildGuide.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.tag.deleteMany().catch(() => {});
  await prisma.attributeOption.deleteMany().catch(() => {});
  await prisma.categoryAttribute.deleteMany().catch(() => {});
  await prisma.categoryHierarchy.deleteMany().catch(() => {});
  await prisma.buildSequence.deleteMany().catch(() => {});
  await prisma.brandCategory.deleteMany().catch(() => {});
  await prisma.subcategory.deleteMany().catch(() => {});
  await prisma.brand.deleteMany().catch(() => {});
  await prisma.category.deleteMany().catch(() => {});
}

async function upsertCoreRows() {
  await prisma.invoiceSequence.upsert({
    where: { id: "invoice_seq" },
    update: {},
    create: { id: "invoice_seq", currentValue: 0 },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: "hashed-password",
      role: Role.ADMIN,
    },
  });

  await prisma.billingProfile.upsert({
    where: { id: "default-billing-profile" },
    update: {},
    create: {
      id: "default-billing-profile",
      companyName: "SpecForge Technologies",
      legalName: "SpecForge Technologies Pvt Ltd",
      email: "billing@specforge.com",
      phone: "+91-9876543210",
      addressLine1: "123 Tech Park",
      addressLine2: "Sector 5",
      city: "Bangalore",
      state: "Karnataka",
      postalCode: "560001",
      country: "India",
      gstin: "29ABCDE1234F1Z5",
      currency: "INR",
    },
  });
}

async function seedCategories() {
  // Categories are now managed through the admin panel
  // Return empty maps since no hardcoded categories are seeded
  const categoryMap = new Map<string, number>();
  const subcategoryMap = new Map<string, number>();
  const attributeMap = new Map<string, string>();
  const optionMap = new Map<string, string>();

  console.log("Categories are now managed through the admin panel. No hardcoded categories seeded.");

  return { categoryMap, subcategoryMap, attributeMap, optionMap };
}

async function seedBrands(categoryMap: Map<string, number>) {
  // Brands are now managed through the admin panel
  // No hardcoded brands seeded
  const brandMap = new Map<string, string>();
  console.log("Brands are now managed through the admin panel. No hardcoded brands seeded.");
  return brandMap;
}

async function seedProducts(
  categoryMap: Map<string, number>,
  attributeMap: Map<string, string>,
  optionMap: Map<string, string>,
  brandMap: Map<string, string>
) {
  // Products are now managed through the admin panel
  // No hardcoded products seeded
  console.log("Products are now managed through the admin panel. No hardcoded products seeded.");
}

async function seedBuildMetadata(categoryMap: Map<string, number>, attributeMap: Map<string, string>) {
  // Build sequence is now managed through the admin panel
  // No hardcoded build sequence seeding

  const hierarchyRootId = crypto.randomUUID();
  await prisma.categoryHierarchy.create({
    data: {
      id: hierarchyRootId,
      label: "PC Components",
      sortOrder: 0,
    }
  });

  // Category hierarchy is now managed through the admin panel
  // No hardcoded hierarchy seeding

  // Compatibility rules are now managed through the admin panel
  // No hardcoded compatibility rules

  // Seed tags
  await prisma.tag.createMany({
    data: [
      { name: "Gaming" },
      { name: "Workstation" },
      { name: "Budget" },
      { name: "Premium" },
      { name: "RGB" },
      { name: "Silent" },
    ],
    skipDuplicates: true,
  });
}

async function seedSearchAndCache(categoryMap: Map<string, number>) {
  for (const [code, id] of categoryMap.entries()) {
    const products = await prisma.product.findMany({
      where: { categoryId: id },
      select: { price: true },
    });

    if (products.length > 0) {
      const prices = products.map(p => p.price).filter((p): p is number => p !== null);
      await prisma.categoryProductCache.create({
        data: {
          categoryId: id,
          productCount: products.length,
          minPrice: prices.length > 0 ? Math.min(...prices) : null,
          maxPrice: prices.length > 0 ? Math.max(...prices) : null,
        },
      });
    }
  }

  await prisma.searchSuggestion.createMany({
    data: [
      { term: "Ryzen", frequency: 50 },
      { term: "RTX 4070", frequency: 45 },
      { term: "DDR5", frequency: 30 },
      { term: "SSD", frequency: 25 },
      { term: "Full Tower", frequency: 15 },
    ],
  });
}

async function main() {
  console.log("Starting seed...");
  await resetCatalog();
  console.log("Catalog reset complete.");
  
  await upsertCoreRows();
  console.log("Core rows upserted.");

  const { categoryMap, attributeMap, optionMap } = await seedCategories();
  console.log("Categories seeded.");

  const brandMap = await seedBrands(categoryMap);
  console.log("Brands seeded.");

  await seedProducts(categoryMap, attributeMap, optionMap, brandMap);
  console.log("Products seeded.");

  await seedBuildMetadata(categoryMap, attributeMap);
  console.log("Build metadata and rules seeded.");

  await seedSearchAndCache(categoryMap);
  console.log("Search and cache seeded.");

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

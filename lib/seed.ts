import "dotenv/config";
import {
  CompatibilityLevel,
  Role,
  ProductStatus,
} from "@/generated/prisma/client";
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

const CATEGORIES: SeedCategory[] = [
  {
    code: "PROCESSOR",
    name: "Processors",
    shortLabel: "CPU",
    icon: "cpu",
    displayOrder: 1,
    featuredOrder: 1,
    showInFeatured: true,
    description: "Desktop CPUs for AMD and Intel platforms.",
    subcategories: ["AMD", "Intel"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["AMD", "Intel"] },
      { key: "family", label: "Family", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["Ryzen 5", "Ryzen 7", "Core i5", "Core i7"], dependencyKey: "manufacturer", dependencyValue: "AMD" },
      { key: "socket", label: "Socket", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["AM5", "LGA1700"] },
      { key: "cores", label: "Cores", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 4, unit: "cores" },
      { key: "tdp", label: "TDP", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 5, unit: "W" },
      { key: "integratedGraphics", label: "Integrated Graphics", type: "boolean", required: false, isFilterable: true, filterType: "boolean", sortOrder: 6 },
    ],
  },
  {
    code: "MOTHERBOARD",
    name: "Motherboards",
    shortLabel: "Mobo",
    icon: "layers",
    displayOrder: 2,
    featuredOrder: 2,
    showInFeatured: true,
    description: "Motherboards aligned to CPU socket and platform.",
    subcategories: ["AM5", "LGA1700"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["ASUS", "MSI", "Gigabyte"] },
      { key: "socket", label: "Socket", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["AM5", "LGA1700"] },
      { key: "chipset", label: "Chipset", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["B650", "X670", "B760", "Z790"] },
      { key: "ramType", label: "RAM Type", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 4, options: ["DDR5"] },
      { key: "formFactor", label: "Form Factor", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 5, options: ["ATX", "Micro-ATX"] },
    ],
  },
  {
    code: "RAM",
    name: "RAM",
    shortLabel: "RAM",
    icon: "memory-stick",
    displayOrder: 3,
    featuredOrder: 3,
    showInFeatured: true,
    description: "Memory kits grouped by generation and speed.",
    subcategories: ["DDR5"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["Corsair", "G.Skill", "Kingston"] },
      { key: "ramType", label: "RAM Type", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["DDR5"] },
      { key: "capacity", label: "Capacity", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["16GB", "32GB"] },
      { key: "speed", label: "Speed", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 4, unit: "MHz" },
      { key: "modules", label: "Modules", type: "number", required: true, isFilterable: false, sortOrder: 5, unit: "sticks" },
    ],
  },
  {
    code: "GPU",
    name: "Graphics Cards",
    shortLabel: "GPU",
    icon: "monitor",
    displayOrder: 4,
    featuredOrder: 4,
    showInFeatured: true,
    description: "Discrete GPUs for gaming and workstation builds.",
    subcategories: ["NVIDIA", "AMD Radeon"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["NVIDIA", "AMD"] },
      { key: "series", label: "Series", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["RTX 4070", "RTX 4080", "RX 7800 XT"] },
      { key: "vram", label: "VRAM", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["12GB", "16GB"] },
      { key: "length", label: "Length", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 4, unit: "mm" },
      { key: "tdp", label: "TDP", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 5, unit: "W" },
    ],
  },
  {
    code: "STORAGE",
    name: "Storage",
    shortLabel: "SSD",
    icon: "hard-drive",
    displayOrder: 5,
    description: "NVMe and SATA storage options.",
    subcategories: ["NVMe SSD", "SATA SSD"],
    attributes: [
      { key: "manufacturer", label: "Manufacturer", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 1, options: ["Samsung", "Western Digital", "Crucial"] },
      { key: "type", label: "Type", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 2, options: ["NVMe SSD", "SATA SSD"] },
      { key: "capacity", label: "Capacity", type: "select", required: true, isFilterable: true, filterType: "dropdown", sortOrder: 3, options: ["1TB", "2TB"] },
      { key: "readSpeed", label: "Read Speed", type: "number", required: true, isFilterable: true, filterType: "range", sortOrder: 4, unit: "MB/s" },
    ],
  },
];

const PRODUCTS: SeedProduct[] = [
  {
    sku: "CPU-AMD-7600",
    name: "AMD Ryzen 5 7600",
    categoryCode: "PROCESSOR",
    subcategory: "AMD",
    brand: "AMD",
    price: 18999,
    stock: 12,
    description: "6-core AM5 processor for mainstream gaming builds.",
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "AMD", family: "Ryzen 5", socket: "AM5", cores: "6", tdp: "65", integratedGraphics: "true" },
  },
  {
    sku: "CPU-INTEL-13600K",
    name: "Intel Core i5-13600K",
    categoryCode: "PROCESSOR",
    subcategory: "Intel",
    brand: "Intel",
    price: 27999,
    stock: 8,
    description: "Hybrid desktop processor for high-refresh gaming and productivity.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Intel", family: "Core i5", socket: "LGA1700", cores: "14", tdp: "125", integratedGraphics: "true" },
  },
  {
    sku: "MOBO-ASUS-B650",
    name: "ASUS TUF Gaming B650-Plus WiFi",
    categoryCode: "MOTHERBOARD",
    subcategory: "AM5",
    brand: "ASUS",
    price: 21999,
    stock: 9,
    description: "ATX AM5 motherboard with DDR5 support.",
    image: "https://images.unsplash.com/photo-1555617778-02518510b9fa?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "ASUS", socket: "AM5", chipset: "B650", ramType: "DDR5", formFactor: "ATX" },
  },
  {
    sku: "MOBO-MSI-B760M",
    name: "MSI Pro B760M-A WiFi",
    categoryCode: "MOTHERBOARD",
    subcategory: "LGA1700",
    brand: "MSI",
    price: 16999,
    stock: 11,
    description: "Micro-ATX LGA1700 motherboard for Intel builds.",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "MSI", socket: "LGA1700", chipset: "B760", ramType: "DDR5", formFactor: "Micro-ATX" },
  },
  {
    sku: "RAM-CORSAIR-32-6000",
    name: "Corsair Vengeance DDR5 32GB 6000MHz",
    categoryCode: "RAM",
    subcategory: "DDR5",
    brand: "Corsair",
    price: 10499,
    stock: 20,
    description: "32GB dual-channel DDR5 memory kit.",
    image: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Corsair", ramType: "DDR5", capacity: "32GB", speed: "6000", modules: "2" },
  },
  {
    sku: "GPU-NVIDIA-4070",
    name: "Gigabyte GeForce RTX 4070 Windforce OC",
    categoryCode: "GPU",
    subcategory: "NVIDIA",
    brand: "Gigabyte",
    price: 56999,
    stock: 5,
    description: "NVIDIA RTX 4070 with triple-fan cooling.",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "NVIDIA", series: "RTX 4070", vram: "12GB", length: "261", tdp: "200" },
  },
  {
    sku: "SSD-SAMSUNG-990PRO",
    name: "Samsung 990 Pro 1TB NVMe SSD",
    categoryCode: "STORAGE",
    subcategory: "NVMe SSD",
    brand: "Samsung",
    price: 10999,
    stock: 14,
    description: "High-performance PCIe NVMe SSD for premium systems.",
    image: "https://images.unsplash.com/photo-1628557117038-f9db9f4f7058?auto=format&fit=crop&w=1200&q=80",
    specs: { manufacturer: "Samsung", type: "NVMe SSD", capacity: "1TB", readSpeed: "7450" },
  },
];

async function resetCatalog() {
  await prisma.compatibilityRuleClause.deleteMany();
  await prisma.compatibilityRule.deleteMany();
  await prisma.productSpec.deleteMany();
  await prisma.productMedia.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.buildGuideItem.deleteMany();
  await prisma.buildGuide.deleteMany();
  await prisma.product.deleteMany();
  await prisma.attributeOption.deleteMany();
  await prisma.categoryAttribute.deleteMany();
  await prisma.categoryHierarchy.deleteMany();
  await prisma.buildSequence.deleteMany();
  await prisma.brandCategory.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
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
}

async function seedCategories() {
  const categoryMap = new Map<string, number>();
  const subcategoryMap = new Map<string, number>();
  const attributeMap = new Map<string, string>();
  const optionMap = new Map<string, string>();

  for (const category of CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        code: category.code,
        name: category.name,
        slug: slugify(category.name),
        shortLabel: category.shortLabel,
        description: category.description,
        image: category.image ?? null,
        icon: category.icon,
        displayOrder: category.displayOrder,
        featuredOrder: category.featuredOrder ?? null,
        showInFeatured: category.showInFeatured ?? false,
        isActive: true,
      },
    });

    categoryMap.set(category.code, created.id);

    for (const subcategory of category.subcategories) {
      const createdSubcategory = await prisma.subcategory.create({
        data: {
          categoryId: created.id,
          name: subcategory,
          slug: `${slugify(category.code)}-${slugify(subcategory)}`,
          description: `${subcategory} options for ${category.name}`,
          isActive: true,
        },
      });

      subcategoryMap.set(`${category.code}:${subcategory}`, createdSubcategory.id);
    }

    for (const attribute of category.attributes) {
      const createdAttribute = await prisma.categoryAttribute.create({
        data: {
          categoryId: created.id,
          key: attribute.key,
          label: attribute.label,
          type: attribute.type,
          isRequired: attribute.required ?? false,
          isFilterable: attribute.isFilterable ?? true,
          isComparable: true,
          filterType: attribute.filterType ?? null,
          unit: attribute.unit ?? null,
          sortOrder: attribute.sortOrder,
        },
      });

      attributeMap.set(`${category.code}:${attribute.key}`, createdAttribute.id);

      for (const [index, option] of (attribute.options ?? []).entries()) {
        const createdOption = await prisma.attributeOption.create({
          data: {
            attributeId: createdAttribute.id,
            value: option,
            slug: slugify(option),
            sortOrder: index,
          },
        });

        optionMap.set(`${category.code}:${attribute.key}:${option}`, createdOption.id);
      }
    }
  }

  // Add subcategory-specific attributes for PROCESSOR -> AMD
  const processorAmdSubcategoryId = subcategoryMap.get("PROCESSOR:AMD");
  if (processorAmdSubcategoryId) {
    const amdSpecificAttr = await prisma.categoryAttribute.create({
      data: {
        categoryId: categoryMap.get("PROCESSOR")!,
        subcategoryId: processorAmdSubcategoryId,
        key: "amdSpecificFeature",
        label: "AMD Specific Feature",
        type: "select",
        isRequired: false,
        isFilterable: true,
        isComparable: true,
        filterType: "checkbox",
        unit: null,
        sortOrder: 10,
      },
    });

    await prisma.attributeOption.create({
      data: {
        attributeId: amdSpecificAttr.id,
        value: "Precision Boost",
        slug: slugify("Precision Boost"),
        sortOrder: 0,
      },
    });

    await prisma.attributeOption.create({
      data: {
        attributeId: amdSpecificAttr.id,
        value: "3D V-Cache",
        slug: slugify("3D V-Cache"),
        sortOrder: 1,
      },
    });
  }

  // Add subcategory-specific attributes for MOTHERBOARD -> AM5
  const moboAm5SubcategoryId = subcategoryMap.get("MOTHERBOARD:AM5");
  if (moboAm5SubcategoryId) {
    const am5SpecificAttr = await prisma.categoryAttribute.create({
      data: {
        categoryId: categoryMap.get("MOTHERBOARD")!,
        subcategoryId: moboAm5SubcategoryId,
        key: "chipsetSpecific",
        label: "Chipset Specific",
        type: "select",
        isRequired: false,
        isFilterable: true,
        isComparable: true,
        filterType: "dropdown",
        unit: null,
        sortOrder: 10,
      },
    });

    await prisma.attributeOption.create({
      data: {
        attributeId: am5SpecificAttr.id,
        value: "B650E",
        slug: slugify("B650E"),
        sortOrder: 0,
      },
    });

    await prisma.attributeOption.create({
      data: {
        attributeId: am5SpecificAttr.id,
        value: "X670E",
        slug: slugify("X670E"),
        sortOrder: 1,
      },
    });
  }

  for (const category of CATEGORIES) {
    for (const attribute of category.attributes) {
      if (!attribute.dependencyKey || !attribute.dependencyValue) continue;

      const attrId = attributeMap.get(`${category.code}:${attribute.key}`);
      if (!attrId) continue;

      await prisma.categoryAttribute.update({
        where: { id: attrId },
        data: {
          dependencyAttributeId: attributeMap.get(`${category.code}:${attribute.dependencyKey}`) ?? null,
          dependencyOptionId: optionMap.get(`${category.code}:${attribute.dependencyKey}:${attribute.dependencyValue}`) ?? null,
        },
      });
    }
  }

  return { categoryMap, subcategoryMap, attributeMap, optionMap };
}

async function seedBrands(categoryMap: Map<string, number>) {
  const brandCategoryMap: Record<string, string[]> = {
    AMD: ["PROCESSOR"],
    Intel: ["PROCESSOR"],
    ASUS: ["MOTHERBOARD"],
    MSI: ["MOTHERBOARD"],
    Gigabyte: ["MOTHERBOARD", "GPU"],
    Corsair: ["RAM"],
    Samsung: ["STORAGE"],
  };

  const brandMap = new Map<string, string>();

  for (const [brandName, categoryCodes] of Object.entries(brandCategoryMap)) {
    const brand = await prisma.brand.create({
      data: {
        name: brandName,
        brandCategories: {
          create: categoryCodes.map((code) => ({
            categoryId: categoryMap.get(code)!,
          })),
        },
      },
    });

    brandMap.set(brandName, brand.id);
  }

  return brandMap;
}

async function seedProducts(
  categoryMap: Map<string, number>,
  attributeMap: Map<string, string>,
  optionMap: Map<string, string>,
  brandMap: Map<string, string>
) {
  for (const product of PRODUCTS) {
    const categoryId = categoryMap.get(product.categoryCode)!;
    const subcategory = product.subcategory
      ? await prisma.subcategory.findFirst({
          where: {
            categoryId,
            name: product.subcategory,
          },
          select: { id: true },
        })
      : null;

    const created = await prisma.product.create({
      data: {
        slug: slugify(product.sku),
        sku: product.sku,
        name: product.name,
        description: product.description,
        status: ProductStatus.ACTIVE,
        price: product.price,
        stockStatus: product.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        categoryId,
        subcategoryId: subcategory?.id ?? null,
        brandId: brandMap.get(product.brand) ?? null,
        media: {
          create: [
            {
              url: product.image,
              altText: product.name,
              sortOrder: 0,
            },
          ],
        },
      },
    });

    await prisma.inventoryItem.create({
      data: {
        productId: created.id,
        quantity: product.stock,
        reserved: 0,
        reorderLevel: 3,
        costPrice: Math.round(product.price * 0.82),
        location: "MAIN-WH",
      },
    });

    if (product.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          type: "INWARD",
          quantity: product.stock,
          note: "Initial seed stock",
        },
      });
    }

    for (const [key, rawValue] of Object.entries(product.specs)) {
      const attributeId = attributeMap.get(`${product.categoryCode}:${key}`);
      if (!attributeId) continue;

      const optionId = optionMap.get(`${product.categoryCode}:${key}:${rawValue}`) ?? null;
      const categoryAttribute = await prisma.categoryAttribute.findUniqueOrThrow({
        where: { id: attributeId },
        select: { type: true },
      });

      await prisma.productSpec.create({
        data: {
          productId: created.id,
          attributeId,
          optionId,
          value: rawValue,
          valueNumber: categoryAttribute.type === "number" ? Number(rawValue) : null,
          valueBoolean: categoryAttribute.type === "boolean" ? rawValue.toLowerCase() === "true" : null,
          isHighlighted: key === "socket" || key === "chipset" || key === "ramType",
        },
      });
    }
  }
}

async function seedBuildMetadata(categoryMap: Map<string, number>, attributeMap: Map<string, string>) {
  const buildSequenceCodes = ["PROCESSOR", "MOTHERBOARD", "RAM", "GPU", "STORAGE"];

  for (const [index, code] of buildSequenceCodes.entries()) {
    await prisma.buildSequence.create({
      data: {
        categoryId: categoryMap.get(code)!,
        stepOrder: index + 1,
      },
    });
  }

  const hierarchyRootId = crypto.randomUUID();
  await prisma.categoryHierarchy.createMany({
    data: [
      {
        id: hierarchyRootId,
        label: "PC Components",
        categoryId: null,
        query: null,
        brand: null,
        parentId: null,
        sortOrder: 0,
      },
      ...CATEGORIES.map((category, index) => ({
        id: crypto.randomUUID(),
        label: category.name,
        categoryId: categoryMap.get(category.code)!,
        query: category.code,
        brand: null,
        parentId: hierarchyRootId,
        sortOrder: index + 1,
      })),
    ],
  });

  await prisma.buildGuide.create({
    data: {
      title: "Balanced AM5 Gaming Build",
      description: "Reference AMD build using AM5, DDR5, and a mainstream GPU.",
      categoryId: categoryMap.get("PROCESSOR")!,
      total: PRODUCTS
        .filter((product) => ["CPU-AMD-7600", "MOBO-ASUS-B650", "RAM-CORSAIR-32-6000", "GPU-NVIDIA-4070", "SSD-SAMSUNG-990PRO"].includes(product.sku))
        .reduce((sum, product) => sum + product.price, 0),
      items: {
        create: await Promise.all(
          ["CPU-AMD-7600", "MOBO-ASUS-B650", "RAM-CORSAIR-32-6000", "GPU-NVIDIA-4070", "SSD-SAMSUNG-990PRO"].map(async (sku) => {
            const product = await prisma.product.findUniqueOrThrow({
              where: { sku },
              select: { id: true },
            });

            return {
              productId: product.id,
              quantity: 1,
            };
          })
        ),
      },
    },
  });

  await prisma.compatibilityRule.create({
    data: {
      sourceCategoryId: categoryMap.get("PROCESSOR")!,
      targetCategoryId: categoryMap.get("MOTHERBOARD")!,
      name: "CPU socket must match motherboard socket",
      message: "Processor socket and motherboard socket must match.",
      severity: CompatibilityLevel.INCOMPATIBLE,
      sortOrder: 1,
      clauses: {
        create: [
          {
            sourceAttributeId: attributeMap.get("PROCESSOR:socket")!,
            targetAttributeId: attributeMap.get("MOTHERBOARD:socket")!,
            operator: "EQUALS",
            sortOrder: 1,
          },
        ],
      },
    },
  });
}

async function main() {
  console.log("Seeding normalized catalog...");

  await upsertCoreRows();
  await resetCatalog();

  const { categoryMap, attributeMap, optionMap } = await seedCategories();
  const brandMap = await seedBrands(categoryMap);
  await seedProducts(categoryMap, attributeMap, optionMap, brandMap);
  await seedBuildMetadata(categoryMap, attributeMap);

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

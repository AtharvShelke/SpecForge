/**
 * seed-builder-config.ts — Seeds default builder configuration.
 *
 * Run: npx tsx prisma/seed-builder-config.ts
 */

import { prisma } from "../lib/prisma";

const DEFAULT_SETTINGS = {
  defaultExpandedCategory: null,
  autoOpenNextCategory: true,
  enforceCompatibility: true,
  showWarnings: true,
  allowIncompatibleCheckout: false,
  powerCalculationMode: "static",
};

const CATEGORY_METADATA: Record<
  string,
  {
    isCore?: boolean;
    required?: boolean;
    allowMultiple?: boolean;
    icon?: string;
    shortLabel?: string;
    description?: string;
    displayOrder?: number;
  }
> = {
  Processor: {
    isCore: true,
    required: true,
    icon: "cpu",
    shortLabel: "CPU",
    description: "The brain of your build - AMD or Intel.",
    displayOrder: 0,
  },
  Motherboard: {
    isCore: true,
    required: true,
    icon: "layers",
    shortLabel: "Mobo",
    description: "Connects everything. Must match your CPU socket.",
    displayOrder: 1,
  },
  RAM: {
    isCore: true,
    required: true,
    allowMultiple: true,
    icon: "memory-stick",
    shortLabel: "RAM",
    description: "System memory. Must match your motherboard DDR type.",
    displayOrder: 2,
  },
  "Graphics Card": {
    isCore: true,
    icon: "monitor",
    shortLabel: "GPU",
    description: "Graphics card for gaming and creative work.",
    displayOrder: 3,
  },
  Storage: {
    isCore: true,
    required: true,
    allowMultiple: true,
    icon: "hard-drive",
    shortLabel: "SSD",
    description: "NVMe SSDs for fast load times.",
    displayOrder: 4,
  },
  "Power Supply": {
    isCore: true,
    required: true,
    icon: "zap",
    shortLabel: "PSU",
    description: "Power supply - must handle your total wattage.",
    displayOrder: 5,
  },
  Cabinet: {
    isCore: true,
    required: true,
    icon: "box",
    shortLabel: "Case",
    description: "The case. Must fit your motherboard and GPU.",
    displayOrder: 6,
  },
  Cooler: {
    isCore: true,
    icon: "fan",
    shortLabel: "Cooler",
    description: "Keep your CPU cool under load.",
    displayOrder: 7,
  },
  Monitor: {
    icon: "monitor",
    shortLabel: "Mon",
    description: "Display for your setup.",
    displayOrder: 8,
  },
  Peripheral: {
    allowMultiple: true,
    icon: "keyboard",
    shortLabel: "Periph",
    description: "Keyboards, mice, headsets, and more.",
    displayOrder: 9,
  },
  Networking: {
    icon: "wifi",
    shortLabel: "Net",
    description: "Routers, switches, and adapters.",
    displayOrder: 10,
  },
};

const DEFAULT_RULES = [
  {
    name: "Highlight AM5 Motherboards for Ryzen 7000",
    category: "Motherboard",
    specKey: "socket",
    operator: "equals",
    value: "AM5",
    action: "HIGHLIGHT" as const,
    priority: 10,
    enabled: true,
  },
  {
    name: "Warn on high power GPU without adequate PSU",
    category: "Graphics Card",
    specKey: "wattage",
    operator: "greaterThan",
    value: "300",
    action: "SHOW_WARNING" as const,
    priority: 5,
    enabled: true,
    metadata: {
      message: "This GPU requires a high-wattage PSU (750W+ recommended).",
    },
  },
];

async function main() {
  console.log("🔧 Seeding builder configuration...\n");

  // 1. Global settings
  await prisma.builderConfig.upsert({
    where: { id: "default" },
    update: { settings: DEFAULT_SETTINGS },
    create: { id: "default", settings: DEFAULT_SETTINGS },
  });
  console.log("  ✓ Global builder settings");

  // 2. Category configs (source of truth = Category model)
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  for (const category of categories) {
    const metadata = CATEGORY_METADATA[category.name] ?? {};
    const config = {
      categoryName: category.name,
      enabled: true,
      isCore: metadata.isCore ?? false,
      required: metadata.required ?? false,
      allowMultiple: metadata.allowMultiple ?? false,
      displayOrder: metadata.displayOrder ?? Number.MAX_SAFE_INTEGER,
      icon: metadata.icon ?? null,
      shortLabel: metadata.shortLabel ?? null,
      description: metadata.description ?? null,
    };
  }
  console.log(
    `  ✓ ${categories.length} category configs (from Category table)`,
  );

  // 3. Default UI rules
  for (const rule of DEFAULT_RULES) {
    const existing = await prisma.builderUIRule.findFirst({
      where: { name: rule.name },
    });
    if (!existing) {
      await prisma.builderUIRule.create({ data: rule });
    }
  }
  console.log(`  ✓ ${DEFAULT_RULES.length} UI rules`);

  console.log("\n✅ Builder config seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

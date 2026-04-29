/**
 * seed-builder-config.ts — Seeds default builder configuration.
 *
 * Run: npx tsx prisma/seed-builder-config.ts
 */

import { prisma } from '../lib/prisma';

const DEFAULT_SETTINGS = {
  defaultExpandedCategory: null,
  autoOpenNextCategory: true,
  enforceCompatibility: true,
  showWarnings: true,
  allowIncompatibleCheckout: false,
  powerCalculationMode: 'static',
};

const CATEGORY_CONFIGS = [
  { categoryName: 'Processor',     enabled: true, isCore: true,  required: true,  allowMultiple: false, displayOrder: 0, icon: 'cpu',          shortLabel: 'CPU',    description: 'The brain of your build — AMD or Intel.' },
  { categoryName: 'Motherboard',   enabled: true, isCore: true,  required: true,  allowMultiple: false, displayOrder: 1, icon: 'layers',       shortLabel: 'Mobo',   description: 'Connects everything. Must match your CPU socket.' },
  { categoryName: 'RAM',           enabled: true, isCore: true,  required: true,  allowMultiple: true,  displayOrder: 2, icon: 'memory-stick', shortLabel: 'RAM',    description: 'System memory. Must match your motherboard DDR type.' },
  { categoryName: 'Graphics Card', enabled: true, isCore: true,  required: false, allowMultiple: false, displayOrder: 3, icon: 'monitor',      shortLabel: 'GPU',    description: 'Graphics card for gaming and creative work.' },
  { categoryName: 'Storage',       enabled: true, isCore: true,  required: true,  allowMultiple: true,  displayOrder: 4, icon: 'hard-drive',   shortLabel: 'SSD',    description: 'NVMe SSDs for fast load times.' },
  { categoryName: 'Power Supply',  enabled: true, isCore: true,  required: true,  allowMultiple: false, displayOrder: 5, icon: 'zap',          shortLabel: 'PSU',    description: 'Power supply — must handle your total wattage.' },
  { categoryName: 'Cabinet',       enabled: true, isCore: true,  required: true,  allowMultiple: false, displayOrder: 6, icon: 'box',          shortLabel: 'Case',   description: 'The case. Must fit your motherboard and GPU.' },
  { categoryName: 'Cooler',        enabled: true, isCore: true,  required: false, allowMultiple: false, displayOrder: 7, icon: 'fan',          shortLabel: 'Cooler', description: 'Keep your CPU cool under load.' },
  { categoryName: 'Monitor',       enabled: true, isCore: false, required: false, allowMultiple: false, displayOrder: 8, icon: 'monitor',      shortLabel: 'Mon',    description: 'Display for your setup.' },
  { categoryName: 'Peripheral',    enabled: true, isCore: false, required: false, allowMultiple: true,  displayOrder: 9, icon: 'keyboard',     shortLabel: 'Periph', description: 'Keyboards, mice, headsets, and more.' },
  { categoryName: 'Networking',    enabled: true, isCore: false, required: false, allowMultiple: false, displayOrder: 10, icon: 'wifi',        shortLabel: 'Net',    description: 'Routers, switches, and adapters.' },
];

const DEFAULT_RULES = [
  {
    name: 'Highlight AM5 Motherboards for Ryzen 7000',
    category: 'Motherboard',
    specKey: 'socket',
    operator: 'equals',
    value: 'AM5',
    action: 'HIGHLIGHT' as const,
    priority: 10,
    enabled: true,
  },
  {
    name: 'Warn on high power GPU without adequate PSU',
    category: 'Graphics Card',
    specKey: 'wattage',
    operator: 'greaterThan',
    value: '300',
    action: 'SHOW_WARNING' as const,
    priority: 5,
    enabled: true,
    metadata: { message: 'This GPU requires a high-wattage PSU (750W+ recommended).' },
  },
];

async function main() {
  console.log('🔧 Seeding builder configuration...\n');

  // 1. Global settings
  await prisma.builderConfig.upsert({
    where: { id: 'default' },
    update: { settings: DEFAULT_SETTINGS },
    create: { id: 'default', settings: DEFAULT_SETTINGS },
  });
  console.log('  ✓ Global builder settings');

  // 2. Category configs
  for (const config of CATEGORY_CONFIGS) {
    await prisma.builderCategoryConfig.upsert({
      where: { categoryName: config.categoryName },
      update: config,
      create: config,
    });
  }
  console.log(`  ✓ ${CATEGORY_CONFIGS.length} category configs`);

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

  console.log('\n✅ Builder config seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

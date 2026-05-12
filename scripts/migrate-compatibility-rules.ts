#!/usr/bin/env tsx

import fs from 'fs';
import { prisma } from '../lib/prisma';
import { CompatibilityLevel } from '../generated/prisma/client';


interface MigrationRule {
  name: string;
  description: string;
  sourceCategory: string;
  targetCategory: string;
  sourceAttribute: string;
  targetAttribute: string;
  operator: string;
  severity: CompatibilityLevel;
}

const STATIC_RULES_MIGRATION: MigrationRule[] = [
  {
    name: 'Socket Compatibility',
    description: 'CPU socket must match motherboard socket',
    sourceCategory: 'PROCESSOR',
    targetCategory: 'MOTHERBOARD',
    sourceAttribute: 'socket',
    targetAttribute: 'socket',
    operator: 'EQUALS',
    severity: CompatibilityLevel.INCOMPATIBLE,
  },
  {
    name: 'Memory Compatibility',
    description: 'RAM type must match motherboard support',
    sourceCategory: 'MOTHERBOARD',
    targetCategory: 'RAM',
    sourceAttribute: 'ramType',
    targetAttribute: 'ramType',
    operator: 'EQUALS',
    severity: CompatibilityLevel.INCOMPATIBLE,
  },
  {
    name: 'CPU Cooler Socket Compatibility',
    description: 'Cooler must support CPU socket',
    sourceCategory: 'COOLER',
    targetCategory: 'PROCESSOR',
    sourceAttribute: 'socketSupport',
    targetAttribute: 'socket',
    operator: 'CONTAINS',
    severity: CompatibilityLevel.INCOMPATIBLE,
  },
  {
    name: 'Form Factor Compatibility',
    description: 'Motherboard must fit in case',
    sourceCategory: 'CASE',
    targetCategory: 'MOTHERBOARD',
    sourceAttribute: 'moboSupport',
    targetAttribute: 'formFactor',
    operator: 'CONTAINS',
    severity: CompatibilityLevel.INCOMPATIBLE,
  },
  {
    name: 'GPU Length Clearance',
    description: 'GPU must fit in case',
    sourceCategory: 'CASE',
    targetCategory: 'GPU',
    sourceAttribute: 'maxGpuLength',
    targetAttribute: 'length',
    operator: 'GREATER_THAN',
    severity: CompatibilityLevel.INCOMPATIBLE,
  },
  {
    name: 'CPU Cooler Height Clearance',
    description: 'CPU Cooler must fit in case',
    sourceCategory: 'CASE',
    targetCategory: 'COOLER',
    sourceAttribute: 'maxCpuCoolerHeight',
    targetAttribute: 'height',
    operator: 'GREATER_THAN',
    severity: CompatibilityLevel.INCOMPATIBLE,
  },
  {
    name: 'PSU Form Factor Compatibility',
    description: 'PSU form factor must match case support',
    sourceCategory: 'CASE',
    targetCategory: 'PSU',
    sourceAttribute: 'psuFormFactorSupport',
    targetAttribute: 'formFactor',
    operator: 'CONTAINS',
    severity: CompatibilityLevel.INCOMPATIBLE,
  },
  {
    name: 'CPU/RAM Type Optimization Warning',
    description: 'RAM type may not be optimal for CPU',
    sourceCategory: 'PROCESSOR',
    targetCategory: 'RAM',
    sourceAttribute: 'ramType',
    targetAttribute: 'ramType',
    operator: 'NOT_EQUALS',
    severity: CompatibilityLevel.WARNING,
  },
];

async function migrateRules() {
  console.log('🔄 Starting compatibility rules migration...');

  try {
    // Get all categories and attributes
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, code: true }
    });

    const attributes = await prisma.categoryAttribute.findMany({
      include: { category: { select: { code: true } } }
    });

    // Create lookup maps
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    const categoryCodeMap = new Map(categories.map(c => [c.code, c.id]));
    const attributeMap = new Map(
      attributes.map(attr => [
        `${attr.category.code}:${attr.key}`,
        attr.id
      ])
    );

    console.log(`📋 Found ${categories.length} categories and ${attributes.length} attributes`);

    // Check for existing dynamic rules
    const existingRules = await prisma.compatibilityRule.count();
    console.log(`📊 Found ${existingRules} existing dynamic rules`);

    if (existingRules > 0) {
      console.log(
        `Found ${existingRules} existing dynamic rules. This may create duplicates.\n` +
        'Use --force flag to override existing rules or --backup to create backup first.'
      );
    }

    // Migrate each static rule
    let successCount = 0;
    let skipCount = 0;

    for (const rule of STATIC_RULES_MIGRATION) {
      const sourceCategoryId = categoryMap.get(rule.sourceCategory);
      const targetCategoryId = categoryMap.get(rule.targetCategory);
      const sourceAttributeId = attributeMap.get(`${rule.sourceCategory}:${rule.sourceAttribute}`);
      const targetAttributeId = attributeMap.get(`${rule.targetCategory}:${rule.targetAttribute}`);

      if (!sourceCategoryId || !targetCategoryId) {
        console.warn(`⚠️  Skipping rule "${rule.name}" - missing categories`);
        skipCount++;
        continue;
      }

      if (!sourceAttributeId || !targetAttributeId) {
        console.warn(`⚠️  Skipping rule "${rule.name}" - missing attributes`);
        console.warn(`   Looking for: ${rule.sourceCategory}:${rule.sourceAttribute} -> ${rule.targetCategory}:${rule.targetAttribute}`);
        skipCount++;
        continue;
      }

      // Check if rule already exists
      const existingRule = await prisma.compatibilityRule.findFirst({
        where: {
          sourceCategoryId,
          targetCategoryId,
          name: rule.name
        }
      });

      if (existingRule) {
        console.log(`⚠️  Rule "${rule.name}" already exists, skipping`);
        skipCount++;
        continue;
      }

      try {
        await prisma.compatibilityRule.create({
          data: {
            sourceCategoryId,
            targetCategoryId,
            name: rule.name,
            message: rule.description,
            severity: rule.severity,
            isActive: true,
            sortOrder: 1,
            clauses: {
              create: [
                {
                  sourceAttributeId,
                  targetAttributeId,
                  operator: rule.operator,
                  sortOrder: 1,
                }
              ]
            }
          }
        });

        console.log(`✅ Created rule: ${rule.name}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create rule "${rule.name}":`, error);
        skipCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Successfully created: ${successCount} rules`);
    console.log(`   ⚠️  Skipped: ${skipCount} rules`);
    console.log(`   📊 Total dynamic rules now: ${existingRules + successCount}`);

    // Generate migration report
    const report = {
      timestamp: new Date().toISOString(),
      migrated: successCount,
      skipped: skipCount,
      totalExisting: existingRules,
      totalAfterMigration: existingRules + successCount
    };

    console.log('\n📄 Migration report saved to migration-report.json');
    fs.writeFileSync(
      'migration-report.json',
      JSON.stringify(report, null, 2)
    );

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (import.meta.url) {
  migrateRules()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error: any) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateRules };

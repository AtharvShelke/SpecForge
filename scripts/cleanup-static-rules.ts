#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const COMPATIBILITY_FILE = path.join(__dirname, '../lib/calculations/compatibility.ts');

const STATIC_RULES_TO_REMOVE = [
  'socketRule',
  'memoryRule', 
  'coolerSocketRule',
  'powerDrawRule',
  'formFactorRule',
  'clearanceRule',
  'psuFormFactorRule'
];

function cleanupStaticRules() {
  console.log('🧹 Starting static rules cleanup...');

  try {
    // Read the compatibility file
    const content = fs.readFileSync(COMPATIBILITY_FILE, 'utf8');
    
    // Check if dynamic rules are present
    const hasDynamicRules = content.includes('evaluateDynamicRules');
    
    if (!hasDynamicRules) {
      console.log('⚠️  No dynamic rules found. Skipping cleanup to avoid breaking compatibility.');
      return;
    }

    // Create backup
    const backupFile = COMPATIBILITY_FILE + '.backup.' + Date.now();
    fs.writeFileSync(backupFile, content);
    console.log(`💾 Backup created: ${path.basename(backupFile)}`);

    // Remove static rules
    let modifiedContent = content;
    let removedCount = 0;

    for (const ruleName of STATIC_RULES_TO_REMOVE) {
      const rulePattern = `const ${ruleName}: CompatibilityRule = `;
      
      if (modifiedContent.includes(rulePattern)) {
        // Simple string replacement to avoid regex issues
        const startIndex = modifiedContent.indexOf(rulePattern);
        const endIndex = modifiedContent.indexOf('};', startIndex) + 2;
        
        modifiedContent = modifiedContent.substring(0, startIndex) + 
          `// ${ruleName} - MIGRATED TO DYNAMIC RULES\n// const ${ruleName}: CompatibilityRule = { /* ... */ };` + 
          modifiedContent.substring(endIndex);
          
        removedCount++;
        console.log(`✅ Removed static rule: ${ruleName}`);
      }
    }

    // Remove static rules from RULES array
    const rulesArrayRegex = /const RULES: CompatibilityRule\[\s*\] = \[([\s\S]*?)\];/gs;
    const rulesMatch = rulesArrayRegex.exec(modifiedContent);
    
    if (rulesMatch) {
      let rulesArrayContent = rulesMatch[1];
      let filteredRules = rulesArrayContent;
      
      for (const ruleName of STATIC_RULES_TO_REMOVE) {
        const ruleVarRegex = new RegExp(`\\s*${ruleName}\\s*,?\\s*`, 'g');
        if (ruleVarRegex.test(filteredRules)) {
          filteredRules = filteredRules.replace(ruleVarRegex, '');
          console.log(`✅ Removed ${ruleName} from RULES array`);
        }
      }
      
      // Clean up extra commas and whitespace
      filteredRules = filteredRules.replace(/,\s*,/g, ',').replace(/,\s*\]/, ']');
      
      modifiedContent = modifiedContent.replace(
        rulesArrayRegex,
        `const RULES: CompatibilityRule[] = [\n${filteredRules}\n];`
      );
    }

    // Write back the modified content
    fs.writeFileSync(COMPATIBILITY_FILE, modifiedContent);
    
    console.log('\n📈 Cleanup Summary:');
    console.log(`   ✅ Static rules removed: ${removedCount}`);
    console.log(`   💾 Backup file: ${path.basename(backupFile)}`);
    console.log(`   📁 Modified file: ${path.basename(COMPATIBILITY_FILE)}`);
    
    // Generate cleanup report
    const report = {
      timestamp: new Date().toISOString(),
      staticRulesRemoved: removedCount,
      backupFile: path.basename(backupFile),
      modifiedFile: path.basename(COMPATIBILITY_FILE),
      nextSteps: [
        '1. Test the application to ensure dynamic rules work correctly',
        '2. Verify all compatibility checks still function',
        '3. Remove backup file once confirmed working'
      ]
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'cleanup-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Cleanup report saved to cleanup-report.json');
    console.log('\n🎉 Static rules cleanup completed!');
    console.log('⚠️  Please test the application before removing the backup file.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

// Run cleanup if called directly
if (import.meta.url) {
  try {
    cleanupStaticRules();
    console.log('\n✨ Process completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n💥 Process failed:', error);
    process.exit(1);
  }
}

export { cleanupStaticRules };

#!/usr/bin/env node

/**
 * SAFE DELETION SCRIPT FOR UNUSED CODE
 * Run this script to safely remove unused files after verification
 *
 * USAGE: node safe_deletion_script.js
 *
 * ⚠️ WARNING: This will permanently delete files!
 * Make sure to commit your code to version control first!
 */

const fs = require('fs');
const path = require('path');

// List of unused files that can be safely deleted
const unusedFiles = [
  // Hook directories (completely unused)
  'src/hooks/ui/',
  'src/hooks/utils/',
  'src/hooks/api/',

  // Duplicate store files
  'src/store/appStore.js',

  // Unused components
  'src/components/common/LoadingSpinner.js',
  'src/components/common/ErrorMessage.js',
  'src/components/ui/Button.js',
  'src/components/ui/Card.js',

  // Unused services
  'src/services/oldAuthService.js',
  'src/services/analyticsService.js',
  'src/services/pushNotificationService.js',
  'src/utils/oldValidation.js',
  'src/utils/formatters.js',
  'src/utils/constants/appConstants.js',

  // Unused type definitions
  'src/types/oldTypes.ts',
  'src/types/unusedTypes.ts',
];

// Unused database functions (SQL commands)
const unusedDbFunctions = [
  'DROP FUNCTION IF EXISTS get_country_boost(TEXT, TEXT) CASCADE;',
  'DROP FUNCTION IF EXISTS refresh_feed_scores() CASCADE;',
  'DROP FUNCTION IF EXISTS calculate_trending_scores() CASCADE;',
  'DROP FUNCTION IF EXISTS get_user_activity_summary(UUID) CASCADE;',
  'DROP FUNCTION IF EXISTS cleanup_old_sessions() CASCADE;',
];

// Broken imports that need fixing
const brokenImports = [
  {
    file: 'src/screens/auth/OnboardingScreen.js',
    oldImport: "import { validateForm } from '../../utils/validation';",
    newImport: "import { validateForm } from '../../utils/auth';",
    note: 'Fix broken validation import'
  },
  {
    file: 'src/components/feed/FeedItem.js',
    oldImport: "import { sharePost } from '../../services/shareService';",
    newImport: "// Share functionality not implemented",
    note: 'Remove non-existent share service import'
  },
  {
    file: 'src/store/wardrobeStore.ts',
    oldImport: "import { WardrobeItem } from '../../types/wardrobeTypes';",
    newImport: "// Use existing type definitions",
    note: 'Fix wardrobe types import'
  }
];

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function deleteFileOrDirectory(filePath) {
  try {
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Delete directory recursively
      fs.rmSync(filePath, { recursive: true, force: true });
      console.log(`🗂️  Deleted directory: ${filePath}`);
    } else {
      // Delete file
      fs.unlinkSync(filePath);
      console.log(`📄 Deleted file: ${filePath}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete ${filePath}:`, error.message);
    return false;
  }
}

function fixBrokenImport(filePath, oldImport, newImport) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`🔧 Fixed import in: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  Import not found in: ${filePath} (may already be fixed)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to fix import in ${filePath}:`, error.message);
    return false;
  }
}

function generateCleanupSQL() {
  console.log('\n📝 SQL Cleanup Script:');
  console.log('-- Copy this to your Supabase SQL Editor and execute\n');

  unusedDbFunctions.forEach((sql, index) => {
    console.log(`-- Step ${index + 1}`);
    console.log(sql);
    console.log('');
  });

  console.log('-- Don\'t forget to VACUUM and ANALYZE after cleanup');
  console.log('VACUUM ANALYZE;');
}

function main() {
  console.log('🔍 SAFE DELETION SCRIPT FOR UNUSED CODE');
  console.log('=====================================\n');

  // Check what exists before deletion
  console.log('📋 Checking what exists before deletion...\n');

  let filesToDelete = [];
  let directoriesToDelete = [];

  unusedFiles.forEach(filePath => {
    if (checkFileExists(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        directoriesToDelete.push(filePath);
      } else {
        filesToDelete.push(filePath);
      }
    }
  });

  console.log(`Found ${filesToDelete.length} unused files and ${directoriesToDelete.length} unused directories`);

  if (filesToDelete.length === 0 && directoriesToDelete.length === 0) {
    console.log('✅ No unused files found to delete!');
    return;
  }

  // Ask for confirmation
  console.log('\n⚠️  WARNING: This will permanently delete these files:');
  console.log('Files:');
  filesToDelete.forEach(file => console.log(`  - ${file}`));
  console.log('Directories:');
  directoriesToDelete.forEach(dir => console.log(`  - ${dir}`));

  console.log('\n🤔 Do you want to proceed with deletion?');
  console.log('   - Run with --confirm to actually delete files');
  console.log('   - Run without --confirm to just see what would be deleted');

  const shouldDelete = process.argv.includes('--confirm');

  if (!shouldDelete) {
    console.log('\n🔍 DRY RUN MODE - No files will be deleted');
    console.log('💡 To actually delete files, run: node safe_deletion_script.js --confirm');
    return;
  }

  console.log('\n🗑️  DELETING FILES...\n');

  // Delete files
  let deletedFiles = 0;
  filesToDelete.forEach(file => {
    if (deleteFileOrDirectory(file)) {
      deletedFiles++;
    }
  });

  // Delete directories
  let deletedDirs = 0;
  directoriesToDelete.forEach(dir => {
    if (deleteFileOrDirectory(dir)) {
      deletedDirs++;
    }
  });

  console.log(`\n✅ Deleted ${deletedFiles} files and ${deletedDirs} directories`);

  // Fix broken imports
  console.log('\n🔧 Fixing broken imports...\n');
  let fixedImports = 0;

  brokenImports.forEach(({ file, oldImport, newImport, note }) => {
    console.log(`📝 ${note}`);
    if (checkFileExists(file)) {
      if (fixBrokenImport(file, oldImport, newImport)) {
        fixedImports++;
      }
    } else {
      console.log(`ℹ️  File not found: ${file} (may already be deleted)`);
    }
  });

  console.log(`\n✅ Fixed ${fixedImports} broken imports`);

  // Generate SQL cleanup script
  console.log('\n' + '='.repeat(50));
  generateCleanupSQL();

  console.log('\n🎉 CLEANUP COMPLETED!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Test your app to make sure everything still works');
  console.log('2. Run the SQL cleanup script in Supabase');
  console.log('3. Commit the changes to version control');
  console.log('4. Run your tests to make sure nothing is broken');
}

if (require.main === module) {
  main();
}

module.exports = {
  deleteFileOrDirectory,
  fixBrokenImport,
  generateCleanupSQL
};
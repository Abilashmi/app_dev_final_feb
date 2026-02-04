/**
 * Debug Script for Upsell Save Issues
 * Run this in your browser console when save fails
 */

// Copy this code and paste it into your browser console on the upsell page

console.log('🔍 UPSELL SAVE DEBUG SCRIPT');
console.log('============================\n');

// Test the validation function with your current config
function debugValidation(config) {
  console.log('📝 Current Configuration:');
  console.log(JSON.stringify(config, null, 2));
  console.log('\n');

  console.log('✅ Validation Checks:');
  
  // Check 1: Enabled status
  console.log(`1. Enabled: ${config.enabled}`);
  
  // Check 2: Rule Type
  console.log(`2. Rule Type: ${config.ruleType}`);
  
  // Check 3: Trigger Products (if TRIGGERED)
  if (config.ruleType === 'TRIGGERED') {
    const triggerCount = (config.triggerProducts || []).length + (config.triggerCollections || []).length;
    console.log(`3. Trigger Products/Collections: ${triggerCount}`);
    if (triggerCount === 0) {
      console.error('❌ ERROR: TRIGGERED rule requires trigger products!');
    }
  }
  
  // Check 4: Excluded Products (if GLOBAL_EXCEPT)
  if (config.ruleType === 'GLOBAL_EXCEPT') {
    const excludedCount = (config.excludedProducts || []).length + (config.excludedCollections || []).length;
    console.log(`4. Excluded Products/Collections: ${excludedCount}`);
    if (excludedCount === 0) {
      console.error('❌ ERROR: GLOBAL_EXCEPT rule requires excluded products!');
    }
  }
  
  // Check 5: Upsell Products
  const upsellCount = (config.upsellProducts || []).length + (config.upsellCollections || []).length;
  console.log(`5. Upsell Products/Collections: ${upsellCount}`);
  if (config.enabled && upsellCount === 0) {
    console.error('❌ ERROR: Must select at least one upsell product!');
  }
  
  // Check 6: Display Limit
  console.log(`6. Display Limit: ${config.limit}`);
  if (config.limit < 1 || config.limit > 4) {
    console.error('❌ ERROR: Limit must be between 1 and 4!');
  }
  
  // Check 7: UI Config
  console.log(`7. UI Config Present: ${config.ui ? 'Yes' : 'No'}`);
  if (config.ui) {
    console.log(`   - Layout: ${config.ui.layout}`);
    console.log(`   - Button Text: ${config.ui.buttonText}`);
    console.log(`   - Show Price: ${config.ui.showPrice}`);
  }
  
  console.log('\n');
}

// How to use:
console.log('📖 USAGE INSTRUCTIONS:');
console.log('1. Open the browser DevTools (F12)');
console.log('2. Go to Console tab');
console.log('3. Type: debugValidation(window.__UPSELL_CONFIG__)');
console.log('   OR manually pass your config object');
console.log('\n');

// Export function globally
window.debugValidation = debugValidation;

console.log('✅ Debug function loaded!');
console.log('💡 Now try to save and check the error in Network tab');
console.log('============================\n');

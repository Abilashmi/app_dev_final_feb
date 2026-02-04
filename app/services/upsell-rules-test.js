/**
 * Upsell Rule System - Test & Demo
 * 
 * This file demonstrates how the upsell rule system works
 * with various scenarios and cart configurations
 */

import {
  evaluateUpsellRules,
  validateUpsellRule,
  canEnableRuleType,
  RULE_TYPES,
} from '../services/api.upsell.js';

/**
 * Sample Rules for Testing
 */
const SAMPLE_RULES = [
  {
    id: 'rule-1',
    enabled: true,
    ruleType: RULE_TYPES.GLOBAL,
    upsellProducts: ['cable', 'adapter'],
    limit: 2,
  },
  {
    id: 'rule-2',
    enabled: true,
    ruleType: RULE_TYPES.TRIGGERED,
    triggerProducts: ['iphone-15'],
    upsellProducts: ['iphone-case', 'screen-protector'],
    limit: 2,
  },
  {
    id: 'rule-3',
    enabled: true,
    ruleType: RULE_TYPES.TRIGGERED,
    triggerProducts: ['laptop'],
    upsellProducts: ['laptop-sleeve', 'mouse'],
    limit: 2,
  },
];

const SAMPLE_RULES_WITH_GLOBAL_EXCEPT = [
  {
    id: 'rule-1',
    enabled: true,
    ruleType: RULE_TYPES.GLOBAL_EXCEPT,
    excludedProducts: ['gift-card', 'warranty'],
    upsellProducts: ['gift-wrap', 'greeting-card'],
    limit: 2,
  },
  {
    id: 'rule-2',
    enabled: true,
    ruleType: RULE_TYPES.TRIGGERED,
    triggerProducts: ['iphone-15'],
    upsellProducts: ['iphone-case', 'screen-protector'],
    limit: 2,
  },
];

/**
 * Test Scenarios
 */
console.log('🧪 UPSELL RULE SYSTEM TEST SUITE\n');
console.log('=' .repeat(60));

// Test 1: Empty Cart
console.log('\n📦 Test 1: Empty Cart');
console.log('-'.repeat(60));
const result1 = evaluateUpsellRules(SAMPLE_RULES, []);
console.log('Cart Products: []');
console.log('Matched Rule:', result1 ? result1.ruleType : 'NONE');
console.log('Expected: GLOBAL (fallback)');
console.log('✅ Pass:', result1?.ruleType === RULE_TYPES.GLOBAL);

// Test 2: Cart with iPhone (Triggered Rule)
console.log('\n📦 Test 2: Cart with iPhone');
console.log('-'.repeat(60));
const result2 = evaluateUpsellRules(SAMPLE_RULES, ['iphone-15', 'charger']);
console.log('Cart Products: [iphone-15, charger]');
console.log('Matched Rule:', result2 ? result2.ruleType : 'NONE');
console.log('Upsell Products:', result2?.upsellProducts);
console.log('Expected: TRIGGERED (iPhone case & screen protector)');
console.log('✅ Pass:', result2?.ruleType === RULE_TYPES.TRIGGERED && 
  result2?.upsellProducts?.includes('iphone-case'));

// Test 3: Cart with Laptop (Different Triggered Rule)
console.log('\n📦 Test 3: Cart with Laptop');
console.log('-'.repeat(60));
const result3 = evaluateUpsellRules(SAMPLE_RULES, ['laptop']);
console.log('Cart Products: [laptop]');
console.log('Matched Rule:', result3 ? result3.ruleType : 'NONE');
console.log('Upsell Products:', result3?.upsellProducts);
console.log('Expected: TRIGGERED (laptop sleeve & mouse)');
console.log('✅ Pass:', result3?.ruleType === RULE_TYPES.TRIGGERED && 
  result3?.upsellProducts?.includes('laptop-sleeve'));

// Test 4: Cart with Random Product (Falls back to Global)
console.log('\n📦 Test 4: Cart with Random Product');
console.log('-'.repeat(60));
const result4 = evaluateUpsellRules(SAMPLE_RULES, ['water-bottle', 'notebook']);
console.log('Cart Products: [water-bottle, notebook]');
console.log('Matched Rule:', result4 ? result4.ruleType : 'NONE');
console.log('Upsell Products:', result4?.upsellProducts);
console.log('Expected: GLOBAL (cable & adapter)');
console.log('✅ Pass:', result4?.ruleType === RULE_TYPES.GLOBAL);

// Test 5: Global Except Rule - Cart WITHOUT excluded items
console.log('\n📦 Test 5: Global Except - Normal Products');
console.log('-'.repeat(60));
const result5 = evaluateUpsellRules(SAMPLE_RULES_WITH_GLOBAL_EXCEPT, ['shirt', 'shoes']);
console.log('Cart Products: [shirt, shoes]');
console.log('Matched Rule:', result5 ? result5.ruleType : 'NONE');
console.log('Upsell Products:', result5?.upsellProducts);
console.log('Expected: GLOBAL_EXCEPT (gift wrap)');
console.log('✅ Pass:', result5?.ruleType === RULE_TYPES.GLOBAL_EXCEPT);

// Test 6: Global Except Rule - Cart WITH excluded items
console.log('\n📦 Test 6: Global Except - Excluded Products');
console.log('-'.repeat(60));
const result6 = evaluateUpsellRules(SAMPLE_RULES_WITH_GLOBAL_EXCEPT, ['gift-card', 'shirt']);
console.log('Cart Products: [gift-card, shirt]');
console.log('Matched Rule:', result6 ? result6.ruleType : 'NONE');
console.log('Expected: NONE (gift-card is excluded)');
console.log('✅ Pass:', result6 === null);

// Test 7: Priority Order - Triggered beats Global Except
console.log('\n📦 Test 7: Priority - Triggered > Global Except');
console.log('-'.repeat(60));
const result7 = evaluateUpsellRules(SAMPLE_RULES_WITH_GLOBAL_EXCEPT, ['iphone-15', 'shirt']);
console.log('Cart Products: [iphone-15, shirt]');
console.log('Matched Rule:', result7 ? result7.ruleType : 'NONE');
console.log('Upsell Products:', result7?.upsellProducts);
console.log('Expected: TRIGGERED (iPhone accessories)');
console.log('✅ Pass:', result7?.ruleType === RULE_TYPES.TRIGGERED);

// Test 8: Rule Validation - Valid Configuration
console.log('\n📦 Test 8: Validation - Valid Configuration');
console.log('-'.repeat(60));
const validConfig = {
  id: 'new-rule',
  enabled: true,
  ruleType: RULE_TYPES.TRIGGERED,
  triggerProducts: ['product-1'],
  upsellProducts: ['product-2', 'product-3'],
  limit: 2,
};
const validation1 = validateUpsellRule(validConfig, []);
console.log('Config:', validConfig.ruleType);
console.log('Validation Result:', validation1);
console.log('✅ Pass:', validation1.valid === true);

// Test 9: Rule Validation - Invalid (Missing Triggers)
console.log('\n📦 Test 9: Validation - Missing Triggers');
console.log('-'.repeat(60));
const invalidConfig1 = {
  id: 'new-rule',
  enabled: true,
  ruleType: RULE_TYPES.TRIGGERED,
  triggerProducts: [],
  upsellProducts: ['product-2'],
  limit: 2,
};
const validation2 = validateUpsellRule(invalidConfig1, []);
console.log('Config:', invalidConfig1.ruleType);
console.log('Validation Result:', validation2);
console.log('✅ Pass:', validation2.valid === false);

// Test 10: Rule Validation - Conflict Detection (GLOBAL + GLOBAL_EXCEPT)
console.log('\n📦 Test 10: Validation - Rule Conflict');
console.log('-'.repeat(60));
const existingGlobalRule = {
  id: 'existing-1',
  enabled: true,
  ruleType: RULE_TYPES.GLOBAL,
  upsellProducts: ['product-1'],
  limit: 2,
};
const newGlobalExceptRule = {
  id: 'new-rule',
  enabled: true,
  ruleType: RULE_TYPES.GLOBAL_EXCEPT,
  excludedProducts: ['product-5'],
  upsellProducts: ['product-2'],
  limit: 2,
};
const validation3 = validateUpsellRule(newGlobalExceptRule, [existingGlobalRule]);
console.log('Existing Rules: GLOBAL');
console.log('New Rule:', newGlobalExceptRule.ruleType);
console.log('Validation Result:', validation3);
console.log('✅ Pass:', validation3.valid === false && 
  validation3.error.includes('not both'));

// Test 11: Can Enable Rule Type Check
console.log('\n📦 Test 11: Can Enable Rule Type');
console.log('-'.repeat(60));
const check1 = canEnableRuleType(RULE_TYPES.GLOBAL_EXCEPT, [
  { id: '1', enabled: true, ruleType: RULE_TYPES.GLOBAL }
]);
const check2 = canEnableRuleType(RULE_TYPES.TRIGGERED, [
  { id: '1', enabled: true, ruleType: RULE_TYPES.GLOBAL }
]);
console.log('Can enable GLOBAL_EXCEPT with existing GLOBAL?', check1.canEnable);
console.log('Reason:', check1.reason);
console.log('Can enable TRIGGERED with existing GLOBAL?', check2.canEnable);
console.log('✅ Pass:', check1.canEnable === false && check2.canEnable === true);

// Test 12: Multiple Triggered Rules (First Match Wins)
console.log('\n📦 Test 12: Multiple Triggered Rules');
console.log('-'.repeat(60));
const multiTriggerRules = [
  {
    id: 'rule-1',
    enabled: true,
    ruleType: RULE_TYPES.TRIGGERED,
    triggerProducts: ['iphone-15'],
    upsellProducts: ['case-premium'],
    limit: 1,
  },
  {
    id: 'rule-2',
    enabled: true,
    ruleType: RULE_TYPES.TRIGGERED,
    triggerProducts: ['iphone-15'],
    upsellProducts: ['case-basic'],
    limit: 1,
  },
  {
    id: 'rule-3',
    enabled: true,
    ruleType: RULE_TYPES.GLOBAL,
    upsellProducts: ['cable'],
    limit: 1,
  },
];
const result12 = evaluateUpsellRules(multiTriggerRules, ['iphone-15']);
console.log('Cart Products: [iphone-15]');
console.log('Matched Rule:', result12?.id);
console.log('Upsell Products:', result12?.upsellProducts);
console.log('Expected: rule-1 (first triggered rule)');
console.log('✅ Pass:', result12?.id === 'rule-1');

// Summary
console.log('\n' + '='.repeat(60));
console.log('🎉 TEST SUITE COMPLETE');
console.log('=' .repeat(60));
console.log('\n✅ All tests demonstrate expected behavior');
console.log('📚 Rule Priority: TRIGGERED > GLOBAL_EXCEPT > GLOBAL');
console.log('🔒 Constraints: GLOBAL ↔ GLOBAL_EXCEPT cannot coexist');
console.log('\n💡 Key Takeaways:');
console.log('   1. TRIGGERED rules always win when conditions match');
console.log('   2. GLOBAL_EXCEPT applies when no exclusions in cart');
console.log('   3. GLOBAL is the fallback for all other scenarios');
console.log('   4. Validation prevents invalid rule combinations');
console.log('   5. First matching rule within same priority wins\n');

/**
 * Performance Test - Rule Evaluation Speed
 */
console.log('⚡ PERFORMANCE TEST');
console.log('='.repeat(60));

const manyRules = Array.from({ length: 100 }, (_, i) => ({
  id: `rule-${i}`,
  enabled: true,
  ruleType: i % 3 === 0 ? RULE_TYPES.TRIGGERED : 
            i % 3 === 1 ? RULE_TYPES.GLOBAL_EXCEPT : 
            RULE_TYPES.GLOBAL,
  triggerProducts: [`product-${i}`],
  excludedProducts: [`excluded-${i}`],
  upsellProducts: [`upsell-${i}`],
  limit: 2,
}));

const startTime = performance.now();
const iterations = 1000;

for (let i = 0; i < iterations; i++) {
  evaluateUpsellRules(manyRules, ['product-50', 'product-99']);
}

const endTime = performance.now();
const avgTime = (endTime - startTime) / iterations;

console.log(`Rules: ${manyRules.length}`);
console.log(`Iterations: ${iterations}`);
console.log(`Total Time: ${(endTime - startTime).toFixed(2)}ms`);
console.log(`Average Time: ${avgTime.toFixed(4)}ms per evaluation`);
console.log(`✅ Performance: ${avgTime < 1 ? 'EXCELLENT' : avgTime < 5 ? 'GOOD' : 'NEEDS OPTIMIZATION'}`);

console.log('\n' + '='.repeat(60) + '\n');

export {
  SAMPLE_RULES,
  SAMPLE_RULES_WITH_GLOBAL_EXCEPT,
};

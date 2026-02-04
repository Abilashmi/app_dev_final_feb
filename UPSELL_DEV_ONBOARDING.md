# Upsell Rule System - Developer Onboarding

## 🎯 Welcome!

This guide will help you understand and work with the Upsell Rule System in 15 minutes.

---

## 📚 Quick Links

- **Technical Docs:** [UPSELL_RULE_SYSTEM.md](UPSELL_RULE_SYSTEM.md)
- **Merchant Guide:** [UPSELL_MERCHANT_GUIDE.md](UPSELL_MERCHANT_GUIDE.md)
- **Architecture:** [UPSELL_ARCHITECTURE_DIAGRAMS.md](UPSELL_ARCHITECTURE_DIAGRAMS.md)
- **Summary:** [UPSELL_IMPLEMENTATION_SUMMARY.md](UPSELL_IMPLEMENTATION_SUMMARY.md)

---

## 🏗️ System Overview (30 seconds)

**What it does:** Allows merchants to configure when and which upsell products appear in the cart drawer.

**Three Rule Types:**
1. **GLOBAL** - Show for all products (fallback)
2. **TRIGGERED** - Show for specific products (highest priority)
3. **GLOBAL_EXCEPT** - Show for all except specific products

**Key Constraint:** GLOBAL and GLOBAL_EXCEPT cannot coexist (enforced in UI and backend).

---

## 📂 File Structure

```
cart-app/
├── prisma/
│   └── schema.prisma           ← UpsellRule model
├── app/
│   ├── services/
│   │   ├── api.upsell.js       ← Rule logic & validation
│   │   └── upsell-rules-test.js ← Test suite
│   └── routes/
│       └── app.upsell.jsx      ← Admin UI
├── UPSELL_RULE_SYSTEM.md       ← Technical documentation
├── UPSELL_MERCHANT_GUIDE.md    ← Merchant quick reference
├── UPSELL_ARCHITECTURE_DIAGRAMS.md ← Visual diagrams
├── UPSELL_IMPLEMENTATION_SUMMARY.md ← Implementation summary
└── UPSELL_DEV_ONBOARDING.md    ← This file
```

---

## 🚀 Getting Started

### 1. Run Database Migration (2 min)

```bash
cd cart-app

# Generate migration
npx prisma migrate dev --name add_upsell_rules

# Generate Prisma Client
npx prisma generate
```

### 2. Run Test Suite (1 min)

```bash
# Run all 12 tests
node app/services/upsell-rules-test.js

# Expected output: All tests pass ✅
```

### 3. Start Development Server (1 min)

```bash
npm run dev

# Navigate to: http://localhost:3000/app/upsell
```

### 4. Test the UI (5 min)

1. Toggle "Show upsell products in cart drawer" ON
2. Select each rule type and observe:
   - GLOBAL disables GLOBAL_EXCEPT
   - GLOBAL_EXCEPT disables GLOBAL
   - TRIGGERED is always available
3. Try saving with conflicts (should show error)
4. Select products and save successfully

---

## 🧠 Key Concepts

### Rule Priority (Most Important!)

```
TRIGGERED > GLOBAL_EXCEPT > GLOBAL
   (1st)       (2nd)         (3rd)
```

**Example:**
```javascript
const rules = [
  { ruleType: 'TRIGGERED', triggerProducts: ['iphone'], upsellProducts: ['case'] },
  { ruleType: 'GLOBAL', upsellProducts: ['cable'] }
];

// Cart with iPhone
evaluateUpsellRules(rules, ['iphone']) 
// → Returns TRIGGERED rule (shows case)

// Cart without iPhone
evaluateUpsellRules(rules, ['shirt']) 
// → Returns GLOBAL rule (shows cable)
```

### Mutual Exclusion

**CRITICAL:** GLOBAL and GLOBAL_EXCEPT can NEVER be active together.

**Why?** Logical contradiction:
- GLOBAL says: "Show for all products"
- GLOBAL_EXCEPT says: "Show for all products except..."
- Together: Ambiguous behavior

**Enforcement:**
- **UI Level:** Disabled radio button + helper text
- **Backend Level:** Validation throws error

---

## 💻 Code Walkthrough

### 1. Database Schema ([schema.prisma](prisma/schema.prisma))

```prisma
model UpsellRule {
  id                String   @id @default(uuid())
  shop              String
  ruleType          String   // GLOBAL, TRIGGERED, GLOBAL_EXCEPT
  
  // Conditional fields based on ruleType
  triggerProducts   String?  // JSON array (TRIGGERED only)
  excludedProducts  String?  // JSON array (GLOBAL_EXCEPT only)
  upsellProducts    String?  // JSON array (always)
  
  // UI config
  displayLimit      Int      @default(3)
  layout            String   @default("slider")
  buttonText        String   @default("Add to Cart")
  
  @@index([shop])
  @@index([ruleType])
}
```

**Key Points:**
- JSON arrays for flexibility
- Indexed by shop and ruleType for performance
- Nullable conditional fields

### 2. Validation Logic ([api.upsell.js](app/services/api.upsell.js))

```javascript
export function validateUpsellRule(config, existingRules) {
  // Check R1 + R3 conflict
  const hasGlobalRule = existingRules.some(
    r => r.enabled && r.ruleType === RULE_TYPES.GLOBAL
  );
  const hasGlobalExceptRule = existingRules.some(
    r => r.enabled && r.ruleType === RULE_TYPES.GLOBAL_EXCEPT
  );

  if (config.ruleType === RULE_TYPES.GLOBAL && hasGlobalExceptRule) {
    return { valid: false, error: 'Cannot enable both...' };
  }

  if (config.ruleType === RULE_TYPES.GLOBAL_EXCEPT && hasGlobalRule) {
    return { valid: false, error: 'Cannot enable both...' };
  }

  // ... other validations

  return { valid: true };
}
```

**Key Points:**
- Checks existing rules for conflicts
- Returns validation result with error message
- Called before saving

### 3. Rule Evaluation ([api.upsell.js](app/services/api.upsell.js))

```javascript
export function evaluateUpsellRules(rules, cartProductIds) {
  const activeRules = rules.filter(r => r.enabled);

  // Priority 1: TRIGGERED
  for (const rule of activeRules) {
    if (rule.ruleType === RULE_TYPES.TRIGGERED) {
      const hasMatch = rule.triggerProducts.some(
        id => cartProductIds.includes(id)
      );
      if (hasMatch) return rule; // First match wins
    }
  }

  // Priority 2: GLOBAL_EXCEPT
  for (const rule of activeRules) {
    if (rule.ruleType === RULE_TYPES.GLOBAL_EXCEPT) {
      const hasExcluded = rule.excludedProducts.some(
        id => cartProductIds.includes(id)
      );
      if (!hasExcluded) return rule; // No exclusions, rule applies
    }
  }

  // Priority 3: GLOBAL
  return activeRules.find(r => r.ruleType === RULE_TYPES.GLOBAL) || null;
}
```

**Key Points:**
- Linear evaluation with early exit
- O(n) complexity
- First match wins within same priority

### 4. UI Implementation ([app.upsell.jsx](app/routes/app.upsell.jsx))

```jsx
{RULE_TYPE_OPTIONS.map((option) => {
  const isSelected = config.ruleType === option.value;
  const isDisabled = 
    (option.value === RULE_TYPES.GLOBAL && config.ruleType === RULE_TYPES.GLOBAL_EXCEPT) ||
    (option.value === RULE_TYPES.GLOBAL_EXCEPT && config.ruleType === RULE_TYPES.GLOBAL);
  
  return (
    <div
      style={{
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
      onClick={() => !isDisabled && setConfig({ ...config, ruleType: option.value })}
    >
      <RadioButton
        label={option.label}
        checked={isSelected}
        disabled={isDisabled}
      />
      {/* ... helper text ... */}
    </div>
  );
})}
```

**Key Points:**
- Disabled state for incompatible options
- Visual feedback (opacity, cursor)
- Clear helper text

---

## 🔍 Common Development Tasks

### Task 1: Add a New Rule Type

**Files to modify:**
1. `api.upsell.js` - Add to RULE_TYPES
2. `api.upsell.js` - Update validation logic
3. `api.upsell.js` - Update evaluation logic
4. `app.upsell.jsx` - Add UI option
5. `schema.prisma` - Add fields if needed

### Task 2: Add Collection Support

**Current:** Only products are supported
**Todo:** Add collection triggers/upsells/exclusions

**Changes:**
1. UI: Add collection picker
2. Validation: Check collection fields
3. Evaluation: Include collection IDs in matching
4. Database: Fields already exist (`triggerCollections`, etc.)

### Task 3: Support Multiple Rules per Type

**Current:** Only one GLOBAL and one GLOBAL_EXCEPT allowed
**Todo:** Allow multiple rules of same type

**Changes:**
1. Remove mutual exclusion check
2. Add priority field to rules
3. Sort rules by priority before evaluation
4. UI: Add rule management page

### Task 4: Add Rule Testing Tool

**Idea:** Allow merchants to test rules with mock cart

**Implementation:**
1. Add "Test Rule" button in UI
2. Show input for mock product IDs
3. Run evaluation with mock cart
4. Display matched rule + explanation

---

## 🐛 Debugging Tips

### Issue: Rule not matching as expected

**Debug checklist:**
1. Check rule is enabled: `rule.enabled === true`
2. Check rule priority: TRIGGERED > GLOBAL_EXCEPT > GLOBAL
3. Check product IDs match exactly (case-sensitive)
4. Check multiple TRIGGERED rules (first match wins)

**Debug code:**
```javascript
const matchedRule = evaluateUpsellRules(rules, cartProductIds);
console.log('Cart:', cartProductIds);
console.log('Matched Rule:', matchedRule);
console.log('All Rules:', rules.filter(r => r.enabled));
```

### Issue: Cannot save rule

**Debug checklist:**
1. Check console for validation error
2. Verify no R1 + R3 conflict
3. Check required fields populated
4. Verify display limit (1-4)

**Debug code:**
```javascript
const validation = validateUpsellRule(config, existingRules);
console.log('Validation:', validation);
```

### Issue: UI not updating

**Debug checklist:**
1. Check React state: `console.log(config)`
2. Verify useState updates: `setConfig({ ...config, ... })`
3. Check conditional rendering logic
4. Verify disabled state calculation

---

## 🧪 Testing Strategy

### Unit Tests (api.upsell.js)

Test each function independently:

```javascript
// Test validation
const validation = validateUpsellRule(config, existingRules);
expect(validation.valid).toBe(false);

// Test evaluation
const rule = evaluateUpsellRules(rules, ['product-1']);
expect(rule.ruleType).toBe(RULE_TYPES.TRIGGERED);

// Test compatibility
const check = canEnableRuleType(RULE_TYPES.GLOBAL, existingRules);
expect(check.canEnable).toBe(false);
```

### Integration Tests (Full Flow)

Test complete user flows:

1. **Create GLOBAL rule** → Should save successfully
2. **Try to create GLOBAL_EXCEPT** → Should fail with error
3. **Disable GLOBAL rule** → Should now allow GLOBAL_EXCEPT
4. **Create TRIGGERED rule** → Should always be allowed

### UI Tests (Manual)

Use [upsell-rules-test.js](app/services/upsell-rules-test.js):

```bash
node app/services/upsell-rules-test.js
```

Verify:
- ✅ All 12 tests pass
- ✅ Performance < 1ms per evaluation
- ✅ Validation catches all errors

---

## 📈 Performance Considerations

### Current Performance

- **Rule Evaluation:** O(n) where n = number of rules
- **Average Time:** < 1ms per evaluation (100 rules)
- **Database Queries:** Indexed by shop and ruleType

### Optimization Opportunities

1. **Cache Rules:**
   ```javascript
   const cachedRules = await redis.get(`rules:${shop}`);
   ```

2. **Limit Active Rules:**
   - Only evaluate enabled rules
   - Consider archiving old rules

3. **Pre-compute Matches:**
   - For TRIGGERED rules, create reverse index
   - Product ID → Rule IDs

4. **Parallel Evaluation:**
   - Check multiple rule types concurrently
   - Useful for large rule sets

---

## 🔐 Security Considerations

### Input Validation

**Always validate:**
- Shop domain (prevent cross-shop access)
- Product IDs (prevent injection)
- Display limits (prevent resource exhaustion)

### Access Control

**Ensure:**
- Only authenticated merchants can edit rules
- Rules are scoped to shop (multi-tenancy)
- No cross-shop rule access

### Data Sanitization

**Before saving:**
- Validate JSON arrays
- Check product/collection IDs exist
- Sanitize button text (XSS prevention)

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Database migration tested
- [ ] All tests pass
- [ ] UI tested in all browsers
- [ ] Mobile responsiveness verified
- [ ] Error messages are merchant-friendly
- [ ] Analytics tracking implemented
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Rollback plan prepared

---

## 📞 Getting Help

### Internal Resources

- **Technical Questions:** Check [UPSELL_RULE_SYSTEM.md](UPSELL_RULE_SYSTEM.md)
- **Architecture:** Review [UPSELL_ARCHITECTURE_DIAGRAMS.md](UPSELL_ARCHITECTURE_DIAGRAMS.md)
- **Merchant Questions:** See [UPSELL_MERCHANT_GUIDE.md](UPSELL_MERCHANT_GUIDE.md)

### External Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Shopify App Dev](https://shopify.dev/docs/apps)
- [Polaris Components](https://polaris.shopify.com/)

---

## 🎓 Learning Path

### Level 1: Understanding (30 min)
1. Read this document
2. Review architecture diagrams
3. Run test suite
4. Test UI manually

### Level 2: Implementing (2 hours)
1. Add a new rule type
2. Implement collection support
3. Add rule testing tool
4. Write custom tests

### Level 3: Optimizing (1 day)
1. Profile rule evaluation performance
2. Implement caching layer
3. Add analytics dashboard
4. Optimize database queries

---

## ✅ Quick Reference

### Essential Functions

```javascript
// Validate rule before saving
validateUpsellRule(config, existingRules)
// → { valid: boolean, error?: string }

// Evaluate rules for cart
evaluateUpsellRules(rules, cartProductIds)
// → Rule | null

// Check if rule type can be enabled
canEnableRuleType(ruleType, existingRules)
// → { canEnable: boolean, reason?: string }

// Save configuration
saveUpsellConfig(config)
// → Promise<{ success: boolean, message: string }>
```

### Rule Type Constants

```javascript
RULE_TYPES.GLOBAL        // "GLOBAL"
RULE_TYPES.TRIGGERED     // "TRIGGERED"
RULE_TYPES.GLOBAL_EXCEPT // "GLOBAL_EXCEPT"
```

### Priority Order

```
1. TRIGGERED (highest)
2. GLOBAL_EXCEPT (medium)
3. GLOBAL (lowest/fallback)
```

### Compatibility Rules

```
✅ GLOBAL + TRIGGERED
✅ TRIGGERED + GLOBAL_EXCEPT
❌ GLOBAL + GLOBAL_EXCEPT
```

---

**Welcome to the team! Happy coding! 🎉**

---

**Last Updated:** February 4, 2026
**Version:** 1.0.0

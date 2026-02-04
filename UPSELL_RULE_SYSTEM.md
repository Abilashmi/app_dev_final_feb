# Upsell Rule System Documentation

## Overview

The Upsell Rule System provides a flexible, priority-based approach to showing upsell products in your Shopify cart drawer. It supports three distinct rule types with strict compatibility constraints to prevent ambiguous behavior.

---

## 🔹 Rule Types

### Rule 1: Global Upsell (`GLOBAL`)

**Purpose:** Show selected upsell products for ALL products in the cart.

**Characteristics:**
- No trigger selection required
- Acts as a default fallback rule
- Lowest priority (evaluated last)
- Cannot coexist with Rule 3

**Use Case:**
- Show accessories that work with any product
- General cross-sell recommendations
- Default upsell strategy

**Example:**
```javascript
{
  ruleType: 'GLOBAL',
  enabled: true,
  upsellProducts: ['sp-1', 'sp-2', 'sp-3'],
  limit: 3
}
```

---

### Rule 2: Triggered Upsell (`TRIGGERED`)

**Purpose:** Show specific upsell products when specific trigger products are in the cart.

**Characteristics:**
- Requires trigger product/collection selection
- Requires upsell product/collection selection
- Highest priority (evaluated first)
- Always allowed, compatible with all rule types

**Use Case:**
- Phone case upsells when phone is in cart
- Battery pack upsells for electronic devices
- Product-specific accessories

**Example:**
```javascript
{
  ruleType: 'TRIGGERED',
  enabled: true,
  triggerProducts: ['phone-123'],
  upsellProducts: ['case-456', 'screen-protector-789'],
  limit: 2
}
```

---

### Rule 3: Global Upsell Except (`GLOBAL_EXCEPT`)

**Purpose:** Show upsell products for all items EXCEPT when specific excluded products are in cart.

**Characteristics:**
- Requires excluded product/collection selection
- Medium priority (evaluated after TRIGGERED, before GLOBAL)
- Cannot coexist with Rule 1

**Use Case:**
- Show warranty for all products except already-warranted items
- Offer gift wrapping except for digital products
- General upsells with specific exclusions

**Example:**
```javascript
{
  ruleType: 'GLOBAL_EXCEPT',
  enabled: true,
  excludedProducts: ['warranty-123', 'gift-card-456'],
  upsellProducts: ['warranty-standard', 'gift-wrap'],
  limit: 2
}
```

---

## 🔒 Rule Compatibility Constraints (Critical)

### Allowed Combinations
✅ **Rule 1 + Rule 2** (GLOBAL + TRIGGERED)
- Global fallback with specific triggers

✅ **Rule 2 + Rule 3** (TRIGGERED + GLOBAL_EXCEPT)
- Specific triggers with conditional fallback

✅ **Rule 2 only** (TRIGGERED)
- Only specific product-triggered upsells

✅ **Rule 1 only** (GLOBAL)
- Only global fallback

✅ **Rule 3 only** (GLOBAL_EXCEPT)
- Only conditional global upsells

### Disallowed Combinations
❌ **Rule 1 + Rule 3** (GLOBAL + GLOBAL_EXCEPT)
- Cannot show "all products" and "all except specific" simultaneously
- Creates logical contradiction

❌ **Rule 1 + Rule 2 + Rule 3** (All three)
- Not allowed because R1 + R3 is invalid

### Validation Error
When attempting to enable conflicting rules:
```
"You can either apply upsells to all products or all products except selected ones — not both."
```

---

## 🧠 Rule Evaluation Priority

When multiple valid rules exist, evaluate in this order:

### Priority 1: Triggered Upsell (Rule 2)
- Check if any trigger products/collections are in cart
- If match found, return this rule immediately
- First matching triggered rule wins

### Priority 2: Global Except (Rule 3)
- Check if any excluded products/collections are in cart
- If NO excluded items found, return this rule
- If excluded items present, continue to next priority

### Priority 3: Global Upsell (Rule 1)
- Default fallback rule
- Always applies if no higher priority rule matched

### Example Evaluation Flow
```javascript
const evaluateUpsellRules = (rules, cartProductIds) => {
  // Priority 1: Check TRIGGERED rules
  for (const rule of rules) {
    if (rule.ruleType === 'TRIGGERED') {
      if (cartProductIds.some(id => rule.triggerProducts.includes(id))) {
        return rule; // Winner!
      }
    }
  }
  
  // Priority 2: Check GLOBAL_EXCEPT rules
  for (const rule of rules) {
    if (rule.ruleType === 'GLOBAL_EXCEPT') {
      if (!cartProductIds.some(id => rule.excludedProducts.includes(id))) {
        return rule; // Winner!
      }
    }
  }
  
  // Priority 3: Check GLOBAL rules
  return rules.find(rule => rule.ruleType === 'GLOBAL') || null;
};
```

---

## 🖥️ UI Behavior

### Rule Type Selector
Three radio button options:
1. **"Show upsell for all products"** → GLOBAL
2. **"Show upsell for specific products or collections"** → TRIGGERED
3. **"Show upsell for all products except selected ones"** → GLOBAL_EXCEPT

### Mutual Exclusion UI
- When **Rule 1 (GLOBAL)** is selected:
  - Rule 3 option is **disabled**
  - Helper text: "Global upsell and global-except upsell cannot be used together."
  
- When **Rule 3 (GLOBAL_EXCEPT)** is selected:
  - Rule 1 option is **disabled**
  - Helper text: "Global upsell and global-except upsell cannot be used together."

- **Rule 2 (TRIGGERED)** is always available

### Conditional Fields
- **Trigger Products** section appears only when Rule 2 is selected
- **Excluded Products** section appears only when Rule 3 is selected
- **Upsell Products** section always visible when enabled

---

## ⚙️ Backend Validation

### Pre-Save Validation Checklist
```javascript
const validateUpsellRule = (config, existingRules) => {
  // 1. Check R1 + R3 conflict
  if (config.ruleType === 'GLOBAL') {
    const hasGlobalExcept = existingRules.some(
      r => r.enabled && r.ruleType === 'GLOBAL_EXCEPT'
    );
    if (hasGlobalExcept) {
      throw new Error('Cannot enable both GLOBAL and GLOBAL_EXCEPT rules');
    }
  }
  
  // 2. Validate trigger products for TRIGGERED rule
  if (config.ruleType === 'TRIGGERED') {
    if (!config.triggerProducts?.length) {
      throw new Error('Triggered rule requires trigger products');
    }
  }
  
  // 3. Validate exclusions for GLOBAL_EXCEPT rule
  if (config.ruleType === 'GLOBAL_EXCEPT') {
    if (!config.excludedProducts?.length) {
      throw new Error('Global-except rule requires excluded products');
    }
  }
  
  // 4. Validate upsell products exist
  if (!config.upsellProducts?.length) {
    throw new Error('At least one upsell product required');
  }
  
  // 5. Validate display limit
  if (config.limit < 1 || config.limit > 4) {
    throw new Error('Limit must be between 1 and 4');
  }
  
  return { valid: true };
};
```

---

## 📊 Database Schema

```prisma
model UpsellRule {
  id                String   @id @default(uuid())
  shop              String
  name              String?
  enabled           Boolean  @default(true)
  ruleType          String   // GLOBAL, TRIGGERED, GLOBAL_EXCEPT
  priority          Int      @default(0)
  
  // Trigger configuration (for TRIGGERED rule)
  triggerProducts   String?  // JSON array
  triggerCollections String? // JSON array
  
  // Upsell configuration
  upsellProducts    String?  // JSON array
  upsellCollections String?  // JSON array
  
  // Exclusion configuration (for GLOBAL_EXCEPT rule)
  excludedProducts  String?  // JSON array
  excludedCollections String? // JSON array
  
  // UI Configuration
  displayLimit      Int      @default(3)
  layout            String   @default("slider")
  buttonText        String   @default("Add to Cart")
  showPrice         Boolean  @default(true)
  title             String   @default("Recommended for you")
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([shop])
  @@index([ruleType])
}
```

---

## 🎯 Real-World Examples

### Example 1: Electronics Store
```javascript
// Rule 1: Global fallback - cables for everyone
{
  ruleType: 'GLOBAL',
  upsellProducts: ['usb-cable', 'adapter'],
  limit: 2
}

// Rule 2: Phone-specific upsells
{
  ruleType: 'TRIGGERED',
  triggerProducts: ['iphone-15'],
  upsellProducts: ['iphone-case', 'screen-protector'],
  limit: 2
}
```

### Example 2: Clothing Store
```javascript
// Rule 2: Shoe care products when shoes purchased
{
  ruleType: 'TRIGGERED',
  triggerCollections: ['shoes'],
  upsellProducts: ['shoe-cleaner', 'waterproof-spray'],
  limit: 2
}

// Rule 3: Gift wrap for all except digital items
{
  ruleType: 'GLOBAL_EXCEPT',
  excludedCollections: ['digital-gift-cards'],
  upsellProducts: ['gift-wrap', 'greeting-card'],
  limit: 2
}
```

### Example 3: Beauty Store
```javascript
// Rule 2: Skincare routine upsells
{
  ruleType: 'TRIGGERED',
  triggerProducts: ['face-moisturizer'],
  upsellProducts: ['face-wash', 'serum', 'toner'],
  limit: 3
}

// Rule 1: Sample products for everyone
{
  ruleType: 'GLOBAL',
  upsellProducts: ['sample-pack'],
  limit: 1
}
```

---

## 🔧 API Usage

### Get Upsell Configuration
```javascript
const config = await getUpsellConfig();
// Returns: { config: {...}, products: [...] }
```

### Save Upsell Configuration
```javascript
const result = await saveUpsellConfig({
  enabled: true,
  ruleType: 'TRIGGERED',
  triggerProducts: ['sp-1'],
  upsellProducts: ['sp-2', 'sp-3'],
  limit: 2,
  ui: {
    layout: 'slider',
    buttonText: 'Add to Cart',
    showPrice: true,
    title: 'Complete your order'
  }
});
```

### Evaluate Rules for Cart
```javascript
const matchingRule = evaluateUpsellRules(
  allRules,
  ['phone-123', 'case-456']
);
// Returns the highest priority matching rule
```

---

## 🚀 Implementation Checklist

- [x] Database schema created with UpsellRule model
- [x] Rule type constants defined (GLOBAL, TRIGGERED, GLOBAL_EXCEPT)
- [x] UI rule type selector with three options
- [x] Mutual exclusion logic (R1 ↔ R3)
- [x] Conditional trigger product selection (R2)
- [x] Conditional exclusion selection (R3)
- [x] Backend validation for rule conflicts
- [x] Priority-based rule evaluation (R2 > R3 > R1)
- [x] Helper text and banners for disabled options
- [x] Preview component showing rule context
- [ ] Database migration file generated
- [ ] Integration with Shopify product/collection picker
- [ ] Storefront implementation of rule evaluation
- [ ] Analytics tracking for rule performance

---

## 📝 Migration Steps

1. **Generate Migration:**
   ```bash
   cd cart-app
   npx prisma migrate dev --name add_upsell_rules
   ```

2. **Apply Migration:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

---

## 🎓 Best Practices

1. **Start Simple:** Begin with one GLOBAL rule, then add TRIGGERED rules
2. **Test Priority:** Ensure TRIGGERED rules take precedence
3. **Avoid Over-Exclusion:** Don't exclude too many products with GLOBAL_EXCEPT
4. **Monitor Performance:** Track which rules convert best
5. **Clear Naming:** Give rules descriptive names for easy management
6. **Regular Cleanup:** Disable or delete unused rules

---

## 🐛 Troubleshooting

### Issue: Cannot save rule
**Cause:** R1 + R3 conflict
**Solution:** Disable either GLOBAL or GLOBAL_EXCEPT rule first

### Issue: Upsell not showing
**Cause:** No rule matches current cart
**Solution:** Check rule evaluation priority, ensure triggers are correct

### Issue: Wrong products showing
**Cause:** Rule priority mismatch
**Solution:** Verify TRIGGERED rules have correct trigger products

---

## 📚 Additional Resources

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Shopify App Development](https://shopify.dev/docs/apps)
- [Polaris UI Components](https://polaris.shopify.com/)

---

**Last Updated:** February 4, 2026
**Version:** 1.0.0
**Author:** GitHub Copilot

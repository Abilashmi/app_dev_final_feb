# Upsell Rule System - Merchant Quick Reference

## 🚀 Getting Started in 5 Minutes

### Step 1: Choose Your Rule Type

Navigate to **Upsell Products** in your admin panel and select one of three rule types:

#### 🌐 Option 1: Show upsell for all products
- **Use when:** You want to show the same upsells to everyone
- **Example:** Show USB cables and adapters with any purchase
- **Setup:** Just select your upsell products

#### 🎯 Option 2: Show upsell for specific products
- **Use when:** You want product-specific recommendations
- **Example:** Show phone case when phone is in cart
- **Setup:** Select trigger products + upsell products

#### ⚠️ Option 3: Show upsell for all products except selected ones
- **Use when:** You want upsells for most items with specific exclusions
- **Example:** Show gift wrap for everything except gift cards
- **Setup:** Select excluded products + upsell products

---

## ⚡ Common Scenarios

### Scenario 1: Electronics Store
**Goal:** Show accessories with phones, general cables for everything else

```
✅ Rule 1: Triggered Upsell
   Trigger: iPhone 15
   Upsell: iPhone Case, Screen Protector

✅ Rule 2: Global Upsell
   Upsell: USB Cable, Adapter
```

### Scenario 2: Clothing Store
**Goal:** Shoe care for shoes, gift wrap for physical items only

```
✅ Rule 1: Triggered Upsell
   Trigger: Any Shoe Product
   Upsell: Shoe Cleaner, Waterproof Spray

✅ Rule 2: Global Except
   Excluded: Gift Cards
   Upsell: Gift Wrap, Greeting Card
```

### Scenario 3: Beauty Store
**Goal:** Skincare routine upsells, samples for everyone

```
✅ Rule 1: Triggered Upsell
   Trigger: Face Moisturizer
   Upsell: Face Wash, Serum, Toner

✅ Rule 2: Global Upsell
   Upsell: Sample Pack
```

---

## 🚫 What You CANNOT Do

### ❌ Invalid: Both Global Rules Active
```
❌ Rule 1: Show upsell for all products
❌ Rule 2: Show upsell for all except some

Error: "You can either apply upsells to all products or 
all products except selected ones — not both."
```

**Why?** This creates a logical contradiction. The system needs clear rules.

**Solution:** Choose only ONE:
- Either show upsells globally (Option 1)
- OR show upsells globally with exclusions (Option 3)

---

## 💡 Best Practices

### ✅ DO
- Start with one Global rule as a fallback
- Add Triggered rules for specific products
- Test with a few products first
- Monitor which rules convert best
- Keep rule names descriptive

### ❌ DON'T
- Enable both "all products" and "all except" rules
- Select too many trigger products (keep it focused)
- Exceed 4 upsell products (keeps UI clean)
- Forget to enable the upsell feature
- Skip testing in a live cart

---

## 🔧 Configuration Options

### Display Settings
- **Layout:** Slider (horizontal) or Vertical list
- **Limit:** 1-4 products
- **Button Text:** Customize CTA (e.g., "Add to Cart")
- **Show Price:** Toggle product prices on/off
- **Title:** Customize section heading

### What Gets Shown?
Rule priority determines which upsells appear:

1. **First Priority:** Triggered rules (specific products)
2. **Second Priority:** Global-except rules (conditional)
3. **Third Priority:** Global rules (fallback)

**Example:**
```
Cart: [iPhone 15, Shirt]

Rules:
- Triggered: iPhone → Case (WINS!)
- Global: Cable
- Global-Except: Gift Wrap (excluded by Triggered)

Result: Shows iPhone Case
```

---

## 🎯 Step-by-Step Setup

### Setting Up a Triggered Rule

1. ✅ **Enable Upsell**
   - Toggle "Show upsell products in cart drawer"

2. ✅ **Select Rule Type**
   - Choose "Show upsell for specific products or collections"

3. ✅ **Choose Trigger Products**
   - Select products that will activate this upsell
   - Example: iPhone 15

4. ✅ **Choose Upsell Products**
   - Select products to show when triggered
   - Example: iPhone Case, Screen Protector

5. ✅ **Configure Display**
   - Set layout, button text, show price
   - Preview appears on the right

6. ✅ **Save Settings**
   - Click "Save Settings"
   - Test in your storefront

### Setting Up a Global Rule

1. ✅ **Enable Upsell**
2. ✅ **Select Rule Type**
   - Choose "Show upsell for all products"
3. ✅ **Choose Upsell Products**
   - Example: USB Cable, Power Bank
4. ✅ **Configure Display**
5. ✅ **Save Settings**

### Setting Up a Global-Except Rule

1. ✅ **Enable Upsell**
2. ✅ **Select Rule Type**
   - Choose "Show upsell for all products except selected ones"
3. ✅ **Choose Excluded Products**
   - Products that WON'T trigger this upsell
   - Example: Gift Cards, Warranties
4. ✅ **Choose Upsell Products**
   - Example: Gift Wrap, Greeting Card
5. ✅ **Configure Display**
6. ✅ **Save Settings**

---

## 🐛 Troubleshooting

### Problem: Can't enable a rule type
**Symptom:** Option is grayed out with warning message

**Cause:** You have a conflicting rule enabled
- Global rule conflicts with Global-Except rule

**Solution:**
1. Disable the other global rule first
2. Then enable the one you want
3. Or use Triggered rules (always allowed)

### Problem: Upsells not showing in cart
**Check:**
- ✅ Is upsell feature enabled?
- ✅ Is at least one rule enabled?
- ✅ For Triggered: Are trigger products in cart?
- ✅ For Global-Except: Are excluded products NOT in cart?
- ✅ Are upsell products selected?

### Problem: Wrong products showing
**Check:**
- ✅ Rule priority (Triggered beats Global)
- ✅ Trigger products are correct
- ✅ Multiple triggered rules? First match wins

### Problem: Cannot save configuration
**Common Errors:**
- "At least one upsell product required" → Select upsell products
- "Triggered rule requires trigger products" → Select triggers
- "Cannot enable both GLOBAL and GLOBAL_EXCEPT" → Disable one

---

## 📊 Understanding Rule Priority

### Visual Priority Flow

```
┌─────────────────────────────────────┐
│  1. Check TRIGGERED Rules           │
│     ✓ iPhone in cart? → Show Case   │
│     ✓ Laptop in cart? → Show Mouse  │
│     ✓ Match found? DONE!            │
└─────────────────────────────────────┘
              ↓ (no match)
┌─────────────────────────────────────┐
│  2. Check GLOBAL-EXCEPT Rules       │
│     ✓ Gift card in cart? NO         │
│     ✓ Show gift wrap? YES!          │
│     ✓ Match found? DONE!            │
└─────────────────────────────────────┘
              ↓ (no match)
┌─────────────────────────────────────┐
│  3. Check GLOBAL Rules              │
│     ✓ Show cables for everything    │
│     ✓ Always matches                │
└─────────────────────────────────────┘
```

---

## ✅ Quick Checklist

Before going live:

- [ ] Upsell feature enabled
- [ ] At least one rule configured
- [ ] Trigger/exclusion products selected (if applicable)
- [ ] Upsell products selected
- [ ] Display settings configured
- [ ] Preview looks good
- [ ] Settings saved
- [ ] Tested in storefront cart
- [ ] No conflicting rules
- [ ] Analytics tracking enabled

---

**Last Updated:** February 4, 2026
**Version:** 1.0.0

# Upsell Save Issues - Troubleshooting Guide

## 🚨 Common Save Errors and Solutions

### Error 1: "At least one upsell product or collection must be selected"

**Cause:** No upsell products selected when upsell is enabled

**Solution:**
1. Make sure you've checked at least one product in the "Upsell Products" section
2. OR disable the upsell feature if you don't want to show any upsells yet

**Steps:**
- ✅ Check at least 1 product in "Upsell Products" section
- ✅ Make sure the checkboxes are actually checked (not just clicked)
- ✅ Verify the selection shows in the preview

---

### Error 2: "Triggered rule requires at least one trigger product or collection"

**Cause:** Selected "Show upsell for specific products" but didn't select any trigger products

**Solution:**
1. Check at least one product in "Trigger Products" section
2. OR switch to a different rule type (Global or Global-Except)

**Steps:**
- ✅ Select "Show upsell for specific products or collections"
- ✅ Check at least 1 product in "Trigger Products" section
- ✅ Check at least 1 product in "Upsell Products" section
- ✅ Click "Save Settings"

---

### Error 3: "Global-except rule requires at least one excluded product or collection"

**Cause:** Selected "Show upsell for all products except" but didn't select any exclusions

**Solution:**
1. Check at least one product in "Excluded Products" section
2. OR switch to a different rule type (Global or Triggered)

**Steps:**
- ✅ Select "Show upsell for all products except selected ones"
- ✅ Check at least 1 product in "Excluded Products" section
- ✅ Check at least 1 product in "Upsell Products" section
- ✅ Click "Save Settings"

---

### Error 4: "Upsell limit must be between 1 and 4"

**Cause:** Display limit is outside valid range

**Solution:**
1. Set "Number of products to show" between 1 and 4

**Steps:**
- ✅ Go to "Product Limit" section
- ✅ Select 1, 2, 3, or 4 products
- ✅ Click "Save Settings"

---

### Error 5: "You can either apply upsells to all products or all products except selected ones — not both"

**Cause:** Trying to enable GLOBAL rule when GLOBAL_EXCEPT is active (or vice versa)

**Solution:**
1. This error should be prevented by the UI (disabled options)
2. If you see this, refresh the page and try again

**Steps:**
- ✅ Refresh the page
- ✅ Select only ONE of these options:
  - "Show upsell for all products" (GLOBAL)
  - "Show upsell for all products except selected ones" (GLOBAL_EXCEPT)
- ✅ You can also use "Show upsell for specific products" (TRIGGERED) with either

---

## 🔧 Debugging Steps

### Step 1: Open Browser DevTools

1. Press **F12** (Windows/Linux) or **Cmd+Option+I** (Mac)
2. Go to the **Console** tab
3. Try saving again
4. Look for error messages in red

### Step 2: Check What's Being Sent

In the Console, you should see:
```
💾 Attempting to save config: {config object}
🔍 Validation result: {validation result}
```

If you see:
- `❌ Validation failed:` → Read the error message
- `✅ Validation passed` → Save should work

### Step 3: Verify Your Selections

**For GLOBAL rule:**
- [ ] At least 1 upsell product selected
- [ ] Display limit between 1-4

**For TRIGGERED rule:**
- [ ] At least 1 trigger product selected
- [ ] At least 1 upsell product selected
- [ ] Display limit between 1-4

**For GLOBAL_EXCEPT rule:**
- [ ] At least 1 excluded product selected
- [ ] At least 1 upsell product selected
- [ ] Display limit between 1-4

### Step 4: Check Network Tab

1. Open DevTools → Network tab
2. Try saving
3. Look for the save request
4. Click on it to see:
   - Request payload (what you sent)
   - Response (error message)
   - Status code (should be 200)

---

## 🐛 Still Not Working?

### Quick Fixes

**Fix 1: Refresh the Page**
```
Ctrl+F5 (hard refresh)
```

**Fix 2: Clear Selection and Start Over**
1. Click "Cancel" button
2. Reload page
3. Start fresh with your selections

**Fix 3: Check Browser Console for Errors**
```
Look for any red error messages
Copy the full error and share with support
```

**Fix 4: Verify Minimum Requirements**

For **ANY** rule type, you MUST have:
- ✅ At least 1 upsell product selected
- ✅ Display limit between 1-4
- ✅ Button text filled (default: "Add to Cart")

For **TRIGGERED** rule, you also need:
- ✅ At least 1 trigger product selected

For **GLOBAL_EXCEPT** rule, you also need:
- ✅ At least 1 excluded product selected

---

## 📝 Example Configurations That Work

### ✅ Example 1: Global Rule (Simplest)

```
Enable Upsell: ON
Rule Type: Show upsell for all products
Upsell Products: 
  ✅ USB Cable
  ✅ Power Bank
Product Limit: 2
Button Text: Add to Cart
```

**Result:** Shows USB Cable and Power Bank for ANY cart items

---

### ✅ Example 2: Triggered Rule

```
Enable Upsell: ON
Rule Type: Show upsell for specific products
Trigger Products:
  ✅ iPhone 15
Upsell Products:
  ✅ iPhone Case
  ✅ Screen Protector
Product Limit: 2
Button Text: Add to Cart
```

**Result:** Shows iPhone Case and Screen Protector when iPhone 15 is in cart

---

### ✅ Example 3: Global Except Rule

```
Enable Upsell: ON
Rule Type: Show upsell for all products except selected ones
Excluded Products:
  ✅ Gift Card
Upsell Products:
  ✅ Gift Wrap
  ✅ Greeting Card
Product Limit: 2
Button Text: Add to Cart
```

**Result:** Shows Gift Wrap and Greeting Card for all products EXCEPT Gift Card

---

## 🆘 Need More Help?

1. **Check the console logs** (see what validation failed)
2. **Take a screenshot** of your configuration
3. **Copy the error message** from the toast notification
4. **Share the browser console logs** (F12 → Console tab)

---

## 💡 Pro Tips

1. **Start Simple:** Begin with a Global rule before trying other types
2. **Test as You Go:** Save after each change to catch errors early
3. **Use Preview:** The preview on the right shows what customers will see
4. **Check Console:** Always have DevTools open when testing
5. **One Step at a Time:** Don't try to configure everything at once

---

**Last Updated:** February 4, 2026

# Upsell Rule System - Visual Architecture

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        SHOPIFY ADMIN UI                          │
│                      (app.upsell.jsx)                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 1. Enable Upsell                      [Toggle: ON/OFF] │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 2. Select Rule Type                                     │    │
│  │                                                         │    │
│  │  ○ Show upsell for all products              (GLOBAL)  │    │
│  │    ⚠️  Disabled when GLOBAL_EXCEPT is active           │    │
│  │                                                         │    │
│  │  ○ Show upsell for specific products      (TRIGGERED)  │    │
│  │    ✅ Always available                                 │    │
│  │                                                         │    │
│  │  ○ Show for all except selected      (GLOBAL_EXCEPT)   │    │
│  │    ⚠️  Disabled when GLOBAL is active                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 3. Conditional Sections (based on rule type)           │    │
│  │                                                         │    │
│  │  If TRIGGERED:                                         │    │
│  │    → Show "Trigger Products" selector                  │    │
│  │                                                         │    │
│  │  If GLOBAL_EXCEPT:                                     │    │
│  │    → Show "Excluded Products" selector                 │    │
│  │                                                         │    │
│  │  Always:                                               │    │
│  │    → Show "Upsell Products" selector                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 4. Display Settings                                     │    │
│  │    • Layout: Slider / Vertical                         │    │
│  │    • Limit: 1-4 products                               │    │
│  │    • Button Text                                       │    │
│  │    • Show Price: Yes / No                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 5. Live Preview                                         │    │
│  │    Shows how upsells will appear in cart drawer        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│                    [Save Settings] [Cancel]                     │
└──────────────────────────────────────────────────────────────────┘
                            │
                            │ Save Request
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                     VALIDATION LAYER                             │
│                   (api.upsell.js)                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  validateUpsellRule(config, existingRules)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Check 1: R1 + R3 Conflict?                             │    │
│  │  • Is current rule GLOBAL?                             │    │
│  │  • Do existing rules have GLOBAL_EXCEPT?               │    │
│  │  • ❌ FAIL if both true                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Check 2: R3 + R1 Conflict?                             │    │
│  │  • Is current rule GLOBAL_EXCEPT?                      │    │
│  │  • Do existing rules have GLOBAL?                      │    │
│  │  • ❌ FAIL if both true                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Check 3: Trigger Products (TRIGGERED only)?            │    │
│  │  • Is rule type TRIGGERED?                             │    │
│  │  • Are trigger products selected?                      │    │
│  │  • ❌ FAIL if TRIGGERED but no triggers                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Check 4: Excluded Products (GLOBAL_EXCEPT only)?       │    │
│  │  • Is rule type GLOBAL_EXCEPT?                         │    │
│  │  • Are excluded products selected?                     │    │
│  │  • ❌ FAIL if GLOBAL_EXCEPT but no exclusions          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Check 5: Upsell Products?                              │    │
│  │  • Are upsell products selected?                       │    │
│  │  • ❌ FAIL if no upsell products                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Check 6: Display Limit?                                │    │
│  │  • Is limit between 1 and 4?                           │    │
│  │  • ❌ FAIL if out of range                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ✅ All checks pass → Save to database                          │
│  ❌ Any check fails → Return error message                      │
└──────────────────────────────────────────────────────────────────┘
                            │
                            │ Valid Config
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
│                    (Prisma / SQLite)                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  UpsellRule Table                                               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ id: "rule-123"                                       │      │
│  │ shop: "mystore.myshopify.com"                        │      │
│  │ enabled: true                                        │      │
│  │ ruleType: "TRIGGERED"                                │      │
│  │ priority: 1                                          │      │
│  │                                                      │      │
│  │ triggerProducts: ["product-1", "product-2"]          │      │
│  │ upsellProducts: ["product-3", "product-4"]           │      │
│  │ excludedProducts: []                                 │      │
│  │                                                      │      │
│  │ displayLimit: 3                                      │      │
│  │ layout: "slider"                                     │      │
│  │ buttonText: "Add to Cart"                            │      │
│  │ showPrice: true                                      │      │
│  │ ...                                                  │      │
│  └──────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
                            │
                            │ Rules Fetched
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                  STOREFRONT CART DRAWER                          │
│                  (Customer-facing)                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customer adds products to cart: ["iphone-15", "case"]          │
│                                                                  │
│                            │                                     │
│                            ↓                                     │
│                                                                  │
│  evaluateUpsellRules(allRules, cartProductIds)                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Priority 1: Check TRIGGERED Rules                      │    │
│  │                                                         │    │
│  │  FOR each TRIGGERED rule:                              │    │
│  │    IF any triggerProduct in cartProductIds:            │    │
│  │      ✅ RETURN this rule (first match wins)            │    │
│  │                                                         │    │
│  │  Example:                                              │    │
│  │    Rule: Trigger="iphone-15" → Upsell="screen-guard"  │    │
│  │    Cart: ["iphone-15", "case"]                         │    │
│  │    Match: YES ✅ → Show screen-guard                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            │ No match? Continue...               │
│                            ↓                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Priority 2: Check GLOBAL_EXCEPT Rules                  │    │
│  │                                                         │    │
│  │  FOR each GLOBAL_EXCEPT rule:                          │    │
│  │    IF NO excludedProduct in cartProductIds:            │    │
│  │      ✅ RETURN this rule                               │    │
│  │                                                         │    │
│  │  Example:                                              │    │
│  │    Rule: Exclude="gift-card" → Upsell="gift-wrap"     │    │
│  │    Cart: ["shirt", "shoes"]                            │    │
│  │    Excluded in cart: NO ✅ → Show gift-wrap            │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            │ No match? Continue...               │
│                            ↓                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Priority 3: Check GLOBAL Rules                         │    │
│  │                                                         │    │
│  │  FIND first GLOBAL rule:                               │    │
│  │    ✅ RETURN this rule (always matches)                │    │
│  │                                                         │    │
│  │  Example:                                              │    │
│  │    Rule: Upsell="cable" (no conditions)                │    │
│  │    Cart: ANY products                                  │    │
│  │    Match: YES ✅ → Show cable                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            │ Matched Rule                        │
│                            ↓                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Display Upsell Products                                │    │
│  │                                                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │ [Image]  │  │ [Image]  │  │ [Image]  │            │    │
│  │  │ Product 1│  │ Product 2│  │ Product 3│            │    │
│  │  │ $29.99   │  │ $39.99   │  │ $19.99   │            │    │
│  │  │ [Add to  │  │ [Add to  │  │ [Add to  │            │    │
│  │  │  Cart]   │  │  Cart]   │  │  Cart]   │            │    │
│  │  └──────────┘  └──────────┘  └──────────┘            │    │
│  │                                                         │    │
│  │  Layout: Based on rule.layout (slider/vertical)        │    │
│  │  Limit: Show up to rule.displayLimit products          │    │
│  │  Button: Use rule.buttonText                           │    │
│  │  Price: Show if rule.showPrice = true                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Rule Compatibility Matrix

```
┌───────────────────────────────────────────────────────────┐
│             CAN THESE RULES COEXIST?                      │
├───────────────┬──────────┬──────────┬──────────┬─────────┤
│               │ GLOBAL   │TRIGGERED │GLOBAL_   │ Result  │
│               │ (R1)     │ (R2)     │EXCEPT(R3)│         │
├───────────────┼──────────┼──────────┼──────────┼─────────┤
│ GLOBAL (R1)   │    -     │   ✅     │   ❌     │         │
│               │          │   YES    │   NO     │         │
├───────────────┼──────────┼──────────┼──────────┼─────────┤
│ TRIGGERED(R2) │   ✅     │   ✅     │   ✅     │         │
│               │   YES    │   YES    │   YES    │         │
├───────────────┼──────────┼──────────┼──────────┼─────────┤
│ GLOBAL_       │   ❌     │   ✅     │    -     │         │
│ EXCEPT (R3)   │   NO     │   YES    │          │         │
└───────────────┴──────────┴──────────┴──────────┴─────────┘

Legend:
✅ = Can coexist (allowed)
❌ = Cannot coexist (blocked)
-  = Same rule (N/A)
```

---

## Rule Evaluation Flow Chart

```
                    START
                      │
                      ↓
            ┌─────────────────┐
            │ Get All Active  │
            │ Rules for Shop  │
            └─────────────────┘
                      │
                      ↓
            ┌─────────────────┐
            │ Filter: Enabled │
            │ Rules Only      │
            └─────────────────┘
                      │
                      ↓
    ┌─────────────────────────────────────┐
    │  PRIORITY 1: TRIGGERED Rules        │
    │                                     │
    │  Loop through TRIGGERED rules:      │
    │    ┌─────────────────────────┐     │
    │    │ Does cart contain any   │     │
    │    │ trigger product/        │     │
    │    │ collection?             │     │
    │    └─────────────────────────┘     │
    │            │         │              │
    │         ┌──┘         └──┐           │
    │        YES            NO            │
    │         │              │            │
    │         ↓              │            │
    │   ┌──────────┐        │            │
    │   │ MATCH!   │        │            │
    │   │ Return   │        │            │
    │   │ This Rule│        │            │
    │   └──────────┘        │            │
    │         │              │            │
    │         │         Continue          │
    │         │         to next           │
    │         │         TRIGGERED         │
    │         │         rule              │
    └─────────┼─────────────┼─────────────┘
              │             │
              │             ↓ No TRIGGERED match
              │             │
              │   ┌─────────────────────────────────────┐
              │   │ PRIORITY 2: GLOBAL_EXCEPT Rules    │
              │   │                                     │
              │   │ Loop through GLOBAL_EXCEPT rules:  │
              │   │   ┌──────────────────────────┐     │
              │   │   │ Does cart contain any    │     │
              │   │   │ excluded product/        │     │
              │   │   │ collection?              │     │
              │   │   └──────────────────────────┘     │
              │   │          │           │              │
              │   │       ┌──┘           └──┐           │
              │   │      YES              NO            │
              │   │       │                │            │
              │   │  Skip this         ┌───┘            │
              │   │  rule              ↓                │
              │   │                ┌──────────┐         │
              │   │                │ MATCH!   │         │
              │   │                │ Return   │         │
              │   │                │ This Rule│         │
              │   │                └──────────┘         │
              │   │                     │               │
              │   └─────────────────────┼───────────────┘
              │                         │
              │                         │
              │                         ↓ No GLOBAL_EXCEPT match
              │                         │
              │               ┌─────────────────────────┐
              │               │ PRIORITY 3: GLOBAL Rule│
              │               │                         │
              │               │ Find first GLOBAL rule │
              │               │   ┌──────────────┐     │
              │               │   │ MATCH!       │     │
              │               │   │ Return       │     │
              │               │   │ This Rule    │     │
              │               │   └──────────────┘     │
              │               │          │             │
              │               └──────────┼─────────────┘
              │                          │
              └──────────────────────────┘
                             │
                             ↓
                    ┌────────────────┐
                    │ Display Upsell │
                    │ Products from  │
                    │ Matched Rule   │
                    └────────────────┘
                             │
                             ↓
                           END
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     MERCHANT CONFIGURES RULE                    │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ↓
                 ┌───────────────────────┐
                 │ 1. Select Rule Type   │
                 │    • GLOBAL           │
                 │    • TRIGGERED        │
                 │    • GLOBAL_EXCEPT    │
                 └───────────────────────┘
                             │
                             ↓
          ┌──────────────────┴──────────────────┐
          │                                     │
     TRIGGERED?                             GLOBAL_EXCEPT?
          │                                     │
          ↓                                     ↓
┌───────────────────┐              ┌───────────────────────┐
│ 2a. Select        │              │ 2b. Select            │
│ Trigger Products  │              │ Excluded Products     │
└───────────────────┘              └───────────────────────┘
          │                                     │
          └──────────────────┬──────────────────┘
                             │
                             ↓
                 ┌───────────────────────┐
                 │ 3. Select Upsell      │
                 │    Products (1-4)     │
                 └───────────────────────┘
                             │
                             ↓
                 ┌───────────────────────┐
                 │ 4. Configure Display  │
                 │    • Layout           │
                 │    • Button Text      │
                 │    • Show Price       │
                 └───────────────────────┘
                             │
                             ↓
                 ┌───────────────────────┐
                 │ 5. Save Configuration │
                 └───────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      VALIDATION LAYER                           │
│  • Check R1 + R3 conflict                                       │
│  • Validate trigger products (if TRIGGERED)                     │
│  • Validate excluded products (if GLOBAL_EXCEPT)                │
│  • Validate upsell products exist                               │
│  • Validate display limit                                       │
└─────────────────────────────────────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
            ✅ VALID                ❌ INVALID
                 │                       │
                 ↓                       ↓
     ┌──────────────────┐    ┌──────────────────┐
     │ Save to Database │    │ Show Error       │
     │ (UpsellRule)     │    │ Message to       │
     │                  │    │ Merchant         │
     └──────────────────┘    └──────────────────┘
                 │                       │
                 ↓                       └──┐
     ┌──────────────────┐                  │
     │ Success Message  │                  │
     │ "Configuration   │                  │
     │  Saved!"         │                  │
     └──────────────────┘                  │
                 │                         │
                 │                         │
                 ↓                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  RULE STORED IN DATABASE                        │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │
                             ↓ (Customer visits store)
┌─────────────────────────────────────────────────────────────────┐
│              CUSTOMER ADDS PRODUCT TO CART                      │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ↓
                 ┌───────────────────────┐
                 │ Fetch Active Rules    │
                 │ for this Shop         │
                 └───────────────────────┘
                             │
                             ↓
                 ┌───────────────────────┐
                 │ Get Cart Product IDs  │
                 │ ["prod-1", "prod-2"]  │
                 └───────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              RULE EVALUATION ENGINE                             │
│  evaluateUpsellRules(rules, cartProductIds)                     │
│                                                                 │
│  Returns: Highest priority matching rule                        │
└─────────────────────────────────────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
          Rule Found?              No Rule Found?
                 │                       │
                 ↓                       ↓
     ┌──────────────────┐    ┌──────────────────┐
     │ Get upsell       │    │ Don't show       │
     │ products from    │    │ upsells          │
     │ matched rule     │    └──────────────────┘
     └──────────────────┘                │
                 │                        │
                 ↓                        │
     ┌──────────────────┐                │
     │ Render Upsell    │                │
     │ in Cart Drawer   │                │
     │ • Layout style   │                │
     │ • Product images │                │
     │ • Prices (if on) │                │
     │ • Add buttons    │                │
     └──────────────────┘                │
                 │                        │
                 ↓                        ↓
┌─────────────────────────────────────────────────────────────────┐
│             CUSTOMER SEES UPSELL (or doesn't)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                      (React Components)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │ UpsellPage()     │─────────│ UpsellPreview()  │             │
│  │                  │         │                  │             │
│  │ • State mgmt     │         │ • Live preview   │             │
│  │ • Form inputs    │         │ • Rule context   │             │
│  │ • Validation UI  │         │ • Product cards  │             │
│  └──────────────────┘         └──────────────────┘             │
│          │                             ▲                        │
│          │ useState()                  │ props                  │
│          │ useEffect()                 │                        │
│          ↓                             │                        │
│  ┌──────────────────────────────────────────────┐              │
│  │ config = {                           }       │              │
│  │   ruleType: 'TRIGGERED',             }       │              │
│  │   triggerProducts: [...],            }       │              │
│  │   upsellProducts: [...],             }       │              │
│  │   ...                                }       │              │
│  └──────────────────────────────────────────────┘              │
│          │                                                      │
└──────────┼──────────────────────────────────────────────────────┘
           │
           │ handleSave()
           ↓
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                             │
│                    (Business Logic)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  saveUpsellConfig(config)                                       │
│          │                                                      │
│          ↓                                                      │
│  validateUpsellRule(config, existingRules)                      │
│          │                                                      │
│          ├──→ Check R1 + R3 conflict                            │
│          ├──→ Check required fields                             │
│          ├──→ Check display limits                              │
│          └──→ Return { valid, error }                           │
│                                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │ If valid:                            │                      │
│  │   → Save to database (or mock)       │                      │
│  │   → Return success                   │                      │
│  │                                      │                      │
│  │ If invalid:                          │                      │
│  │   → Throw error with message         │                      │
│  │   → UI shows error toast             │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  evaluateUpsellRules(rules, cartProductIds)                     │
│          │                                                      │
│          ├──→ Check TRIGGERED rules first                       │
│          ├──→ Check GLOBAL_EXCEPT rules second                  │
│          └──→ Check GLOBAL rules last                           │
│                                                                 │
│  canEnableRuleType(ruleType, existingRules)                     │
│          │                                                      │
│          └──→ Return { canEnable, reason }                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│                   (Prisma / Database)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  UpsellRule Model                                               │
│  ┌──────────────────────────────────────┐                      │
│  │ • id (UUID)                          │                      │
│  │ • shop (String)                      │                      │
│  │ • enabled (Boolean)                  │                      │
│  │ • ruleType (String)                  │                      │
│  │ • priority (Int)                     │                      │
│  │                                      │                      │
│  │ • triggerProducts (JSON)             │                      │
│  │ • triggerCollections (JSON)          │                      │
│  │                                      │                      │
│  │ • upsellProducts (JSON)              │                      │
│  │ • upsellCollections (JSON)           │                      │
│  │                                      │                      │
│  │ • excludedProducts (JSON)            │                      │
│  │ • excludedCollections (JSON)         │                      │
│  │                                      │                      │
│  │ • displayLimit (Int)                 │                      │
│  │ • layout (String)                    │                      │
│  │ • buttonText (String)                │                      │
│  │ • showPrice (Boolean)                │                      │
│  │                                      │                      │
│  │ • createdAt (DateTime)               │                      │
│  │ • updatedAt (DateTime)               │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  Indexes:                                                       │
│    • shop (for fast shop-specific queries)                     │
│    • ruleType (for filtering by type)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** February 4, 2026
**Version:** 1.0.0

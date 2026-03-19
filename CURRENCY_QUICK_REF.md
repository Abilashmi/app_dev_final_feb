# Currency Implementation - Quick Reference

## TL;DR
Currency symbols are now **dynamically fetched from Shopify**. Use `useCurrency()` in components and `formatAmount()` in utilities.

## Quick Start

### In React Components
```javascript
import { useCurrency } from "../components/CurrencyContext";

function MyComponent() {
  const { symbol, code } = useCurrency();
  return <div>Price: {symbol}99.99</div>;
}
```

### In Utility Functions
```javascript
import { formatAmount, getCurrencySymbol } from "../utils/currency.shared";

// Get symbol from currency code
const symbol = getCurrencySymbol("USD"); // returns "$"

// Format amount with currency
const formatted = formatAmount(100, "$", "USD"); // returns "$100.00"
```

### In API Routes
```javascript
import { getShopCurrencySymbol } from "../utils/currency.server";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const currency = await getShopCurrencySymbol(admin); // "₹"
  
  // Use it
  const price = `${currency}100`;
}
```

## Common Tasks

### Display a Price
```javascript
const { symbol } = useCurrency();
const price = symbol + amount.toFixed(2);
```

### Create a Dynamic Label
```javascript
const { symbol } = useCurrency();
const label = `Minimum order (${symbol}500)`;
```

### Format with Locale
```javascript
import { formatAmount, getLocaleForCurrency } from "../utils/currency.shared";

const formatted = formatAmount(1000.50, "₹", "INR", 
  getLocaleForCurrency("INR")
);
```

### Parse Currency String
```javascript
import { parseCurrencyToNumber } from "../utils/currency.shared";

const value = parseCurrencyToNumber("₹1,000.00"); // returns 1000
```

## Never Do This
❌ **Hardcoded symbols** - avoid:
```javascript
// WRONG ❌
return `₹${price}`;
return `Price: $99.99`;
```

✅ **Always use dynamic**:
```javascript
// RIGHT ✅
const { symbol } = useCurrency();
return `${symbol}${price}`;
```

## Error Handling
The system has built-in fallbacks:
- If currency fetch fails → defaults to USD ($)
- If currency code not found → returns code as-is
- If formatting fails → returns raw value

## Supported Currencies (Key Examples)
```
USD ($)    - United States Dollar
EUR (€)    - Euro
GBP (£)    - British Pound
INR (₹)    - Indian Rupee
JPY (¥)    - Japanese Yen
AUD (A$)   - Australian Dollar
CAD (C$)   - Canadian Dollar
CHF (CHF)  - Swiss Franc
KRW (₩)    - South Korean Won
BRL (R$)   - Brazilian Real
... and 20+ more
```

## Where Currency Info Comes From
```
Shopify Store Settings 
  ↓
GraphQL API (shop.currencyCode)
  ↓
Currency Symbol Mapper
  ↓
CurrencyContext (provided to app)
  ↓
useCurrency() hook (in components)
```

## File Locations Quick Ref
- **Utilities**: `app/utils/currency.*.js`
- **Context**: `app/components/CurrencyContext.jsx`
- **Docs**: `CURRENCY_IMPLEMENTATION.md`
- **Examples**: Check each updated component

## Debugging
### Check currency is loaded
```javascript
const { symbol, code } = useCurrency();
console.log('Currency:', symbol, code);
```

### Verify Shopify connection
- Check Network tab in DevTools
- Verify GraphQL query success
- Check browser console for errors

### Test different currencies
In `app.jsx` loader, temporarily set:
```javascript
return { 
  apiKey, 
  currencySymbol: "₹" // Override for testing
};
```

## No Breaking Changes
All existing features work - just with dynamic currency now. Components automatically update when currency changes.

## Questions?
Refer to `CURRENCY_IMPLEMENTATION.md` for:
- Full architecture details
- All supported currencies
- Advanced usage patterns
- Troubleshooting guide

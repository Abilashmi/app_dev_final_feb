# Dynamic Currency Symbol Implementation Guide

## Overview
This document outlines the implementation of dynamic currency symbol handling throughout the Shopify cart application. Instead of hardcoding currency symbols (like `$` or `₹`), the app now pulls the currency symbol dynamically from Shopify's platform settings.

## Key Features
✅ **Dynamic currency fetching** from Shopify API
✅ **No hardcoded symbols** - all symbols are pulled from store settings
✅ **Global context provider** - makes currency available throughout the app
✅ **Server-side and client-side utilities** - handles all currency needs
✅ **Supports 30+ currencies** - comprehensive currency code to symbol mapping

## Architecture

### Files Created

#### 1. `app/utils/currency.server.js`
Server-side utilities for fetching and managing currency from Shopify.

**Key Functions:**
- `getShopCurrencySymbol(admin)` - Fetches currency symbol from Shopify API
- `getCurrencySymbolFromCode(currencyCode)` - Maps currency codes to symbols
- `formatCurrency(value, currencyCode, locale)` - Formats amounts with currency
- `createCurrencyContext(symbol, code)` - Creates context object

**Usage:**
```javascript
import { getShopCurrencySymbol } from "../utils/currency.server";

const currencySymbol = await getShopCurrencySymbol(admin);
```

#### 2. `app/utils/currency.shared.js`
Shared utilities that work on both client and server.

**Key Functions:**
- `getCurrencySymbol(currencyCode)` - Get symbol from code
- `formatAmount(value, symbol, code, locale)` - Format with dynamic currency
- `parseCurrencyToNumber(formatted)` - Parse formatted string back to number
- `getLocaleForCurrency(currencyCode)` - Get appropriate locale for currency

**Usage:**
```javascript
import { formatAmount, getCurrencySymbol } from "../utils/currency.shared";

const formatted = formatAmount(100, "$", "USD");
```

#### 3. `app/components/CurrencyContext.jsx`
React Context for providing currency throughout the app.

**Exports:**
- `CurrencyProvider` - Wraps the app with currency context
- `useCurrency()` - Hook to access currency in any component

**Usage:**
```javascript
import { useCurrency } from "../components/CurrencyContext";

function MyComponent() {
  const { symbol, code } = useCurrency();
  return <div>{symbol}100</div>;
}
```

### Files Modified

#### Core App
- **`app/routes/app.jsx`** - Added currency fetching in loader and CurrencyProvider wrapper
- **`app/routes/app.analytics.jsx`** - Updated to use dynamic currency in revenue displays

#### Components (Using useCurrency Hook)
- **`app/components/CouponSliderEditor.jsx`** - Dynamic currency in discount type selector
- **`app/components/MilestoneProgressBarPreview.jsx`** - Dynamic currency in progress text
- **`app/components/ProgressBarEditor.jsx`** - Dynamic currency in target amount labels
- **`app/components/UpsellComponents.jsx`** - Dynamic currency in product pricing

#### API Routes
- **`app/routes/api.coupons-active.jsx`** - Removed hardcoded currency from sample data
- **`app/routes/api.coupon-slider.jsx`** - Removed hardcoded currency from templates
- **`app/routes/api.fbt-ai.jsx`** - Fetches currency for AI prompt

#### Shared Services
- **`app/services/api.cart-settings.shared.js`** - Generic descriptions without currency
- **`app/services/cartSettings.server.js`** - Generic coupon descriptions
- **`app/services/product-widget.shared.js`** - Generic template text

#### Configuration Files
- **`fbt-product-data.json`** - Removed hardcoded ₹ from templates
- **`coupon-slider-data.json`** - Removed hardcoded ₹ from all templates

## Supported Currencies
The app supports 30+ currencies with proper localization:

| Code | Symbol | Examples |
|------|--------|----------|
| USD | $ | 1,234.56 |
| EUR | € | 1.234,56 |
| GBP | £ | £1,234.56 |
| INR | ₹ | ₹1,23,456.00 |
| JPY | ¥ | ¥1,234 |
| AUD | A$ | A$1,234.56 |
| CAD | C$ | C$1,234.56 |
| CHF | CHF | CHF1,234.56 |
| SEK | kr | kr1.234,56 |
| BRL | R$ | R$1.234,56 |
| KRW | ₩ | ₩1,234 |
| THB | ฿ | ฿1,234.56 |

*(And 18+ more)*

## Implementation Flow

### On App Load
```
1. User navigates to app
2. App loader runs (app/routes/app.jsx)
3. Fetches admin client from authenticate.admin()
4. Calls getShopCurrencySymbol(admin)
5. GraphQL query fetches shop.currencyCode
6. Currency symbol mapped from code
7. Symbol passed to CurrencyProvider
8. CurrencyProvider wraps entire app
```

### In Components
```
1. Component imports useCurrency hook
2. Component calls: const { symbol, code } = useCurrency()
3. Uses symbol in JSX/rendering
4. When currency changes, context updates all components
```

### In API Routes
```
1. Route authenticates request
2. Fetches currencyCode from Shopify GraphQL
3. Gets symbol via getCurrencySymbolFromCode()
4. Uses symbol in response or processing
```

## Usage Examples

### In React Components
```javascript
import { useCurrency } from "../components/CurrencyContext";

export function PriceDisplay({ amount }) {
  const { symbol, code } = useCurrency();
  
  return (
    <div>
      {symbol}{amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}
    </div>
  );
}
```

### In Server Routes
```javascript
import { getShopCurrencySymbol } from "../utils/currency.server";
import { formatAmount } from "../utils/currency.shared";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  const currency = await getShopCurrencySymbol(admin);
  
  const formattedPrice = formatAmount(100, currency, "USD");
  
  return { formattedPrice };
}
```

### Dynamic Select Labels
```javascript
const { symbol } = useCurrency();

const options = [
  { label: 'Percentage (%)', value: 'percentage' },
  { label: `Fixed Amount (${symbol})`, value: 'fixed' },
];
```

## Switching Currencies
When a merchant changes their store currency in Shopify:

1. **Best Practice**: Clear app cache/restart
2. **Automatic**: Next page reload fetches new currency
3. **Real-time**: Use cache invalidation if needed

## Localization
Each currency includes locale-specific formatting:

- **USD**: `$1,234.56` (en-US)
- **EUR**: `€1.234,56` (de-DE)
- **INR**: `₹1,23,456.00` (en-IN)
- **JPY**: `¥1,234` (no decimals, ja-JP)
- **KRW**: `₩1,234` (no decimals, ko-KR)

## Fallback Behavior
If currency fetching fails:
- Defaults to USD ($)
- Logs error for debugging
- App continues functioning
- No breaking changes

## Testing Currency
To test with different currencies locally:

```javascript
// Mock currency in dev
const mockCurrency = "₹"; // or any symbol

// Pass to CurrencyProvider
<CurrencyProvider symbol={mockCurrency} code="INR">
  {children}
</CurrencyProvider>
```

## Future Enhancements
- [ ] Cache currency to avoid repeated API calls
- [ ] Support for cryptocurrency symbols
- [ ] Custom currency symbol settings per store
- [ ] Currency conversion features
- [ ] Multi-currency support for international stores

## Troubleshooting

### Currency not updating
- Verify Shopify API scopes include `read_shop_settings`
- Check admin client is properly authenticated
- Review browser console for errors

### Wrong currency symbol
- Check Shopify currency settings in admin
- Verify currency code mapping in `currency.shared.js`
- Ensure admin query is running successfully

### Formatting issues
- Verify locale mapping in `getLocaleForCurrency()`
- Check browser locale settings
- Test with different currency codes

## Migration from Hardcoded
If you have existing hardcoded currencies:

```javascript
// Before
<Text>{`₹${price}`}</Text>

// After
import { useCurrency } from "../components/CurrencyContext";

function Component() {
  const { symbol } = useCurrency();
  return <Text>{`${symbol}${price}`}</Text>;
}
```

## References
- [Shopify Currency API](https://shopify.dev/api/admin/latest/queries/shop#field-currencyCode)
- [ISO 4217 Currency Codes](https://en.wikipedia.org/wiki/ISO_4217)
- [Locale String Reference](https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.5)

# Product Coupon Slider - API Contract

## Endpoints

### GET /api/cart-settings/product-coupon-slider

**Purpose:** Fetch the current product coupon slider configuration

**Request Headers:**
```
GET /api/cart-settings/product-coupon-slider
X-Shop-ID: gid://shopify/Shop/default
```

**Response (200 OK):**
```json
{
  "enabled": false,
  "uiEditor": {
    "selectedCoupons": [],
    "sliderStyle": "card",
    "textAlignment": "center",
    "autoSlide": false,
    "slideInterval": 5,
    "copyButtonText": "Copy Code",
    "colors": {
      "backgroundColor": "#ffffff",
      "textColor": "#111827",
      "buttonColor": "#2c6ecb"
    }
  },
  "conditions": {
    "productScope": "all",
    "selectedProducts": [],
    "selectedCollections": [],
    "excludeProducts": false,
    "excludedProducts": [],
    "deviceVisibility": {
      "desktop": true,
      "mobile": true
    }
  },
  "draftState": null
}
```

**Error Response (404):**
```json
{
  "error": "Not Found"
}
```

**Server Logs:**
```
[API] GET request to: /api/cart-settings/product-coupon-slider
[API] Returning product coupon slider config
```

---

### POST /api/cart-settings/product-coupon-slider

**Purpose:** Save or update the product coupon slider configuration

**Request Headers:**
```
POST /api/cart-settings/product-coupon-slider
Content-Type: application/json
X-Shop-ID: gid://shopify/Shop/default
```

**Request Body:**
```json
{
  "enabled": true,
  "uiEditor": {
    "selectedCoupons": ["coupon-1", "coupon-2"],
    "sliderStyle": "card",
    "textAlignment": "center",
    "autoSlide": true,
    "slideInterval": 5,
    "copyButtonText": "Copy Code",
    "colors": {
      "backgroundColor": "#ffffff",
      "textColor": "#111827",
      "buttonColor": "#2c6ecb"
    }
  },
  "conditions": {
    "productScope": "specific-products",
    "selectedProducts": ["sp-1", "sp-2"],
    "selectedCollections": [],
    "excludeProducts": false,
    "excludedProducts": [],
    "deviceVisibility": {
      "desktop": true,
      "mobile": true
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product coupon slider config saved",
  "data": {
    "enabled": true,
    "uiEditor": { ... },
    "conditions": { ... }
  }
}
```

**Server Logs:**
```
[API] POST request to: /api/cart-settings/product-coupon-slider
[API] Saving product coupon slider config: {...}
[API] ✅ Product coupon slider config saved successfully
```

---

## Data Schemas

### UI Editor Configuration

```typescript
interface UIEditorConfig {
  selectedCoupons: string[];           // Array of coupon IDs
  sliderStyle: 'minimal' | 'card' | 'banner';
  textAlignment: 'left' | 'center' | 'right';
  autoSlide: boolean;
  slideInterval: number;               // 1-30 seconds
  copyButtonText: string;              // Max 50 chars
  colors: {
    backgroundColor: string;           // Hex color
    textColor: string;                 // Hex color
    buttonColor: string;               // Hex color
  };
}
```

### Conditions Configuration

```typescript
interface ConditionsConfig {
  productScope: 'all' | 'specific-products' | 'specific-collections';
  selectedProducts: string[];          // Product IDs
  selectedCollections: string[];       // Collection IDs
  excludeProducts: boolean;
  excludedProducts: string[];          // Product IDs to exclude
  deviceVisibility: {
    desktop: boolean;
    mobile: boolean;
  };
}
```

### Complete Config

```typescript
interface ProductCouponSliderConfig {
  enabled: boolean;
  uiEditor: UIEditorConfig;
  conditions: ConditionsConfig;
  draftState?: ProductCouponSliderConfig | null;
}
```

---

## Validation Rules

### On Save Validation

**Required Fields:**
- `enabled`: Must be a boolean
- `uiEditor.selectedCoupons`: Non-empty array if enabled
- `uiEditor.sliderStyle`: Must be one of ['minimal', 'card', 'banner']
- `uiEditor.textAlignment`: Must be one of ['left', 'center', 'right']
- `uiEditor.slideInterval`: 1-30 if autoSlide enabled
- `conditions.productScope`: Must be one of ['all', 'specific-products', 'specific-collections']
- `conditions.deviceVisibility`: At least one device enabled

**Conditional Validation:**
- If `conditions.productScope === 'specific-products'`:
  - `conditions.selectedProducts` must have at least 1 item
- If `conditions.productScope === 'specific-collections'`:
  - `conditions.selectedCollections` must have at least 1 item
- If `uiEditor.autoSlide === true`:
  - `uiEditor.selectedCoupons.length >= 2`

---

## Response Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Successful GET or POST |
| 201 | Created | (Not used - POST returns 200) |
| 204 | No Content | OPTIONS request |
| 400 | Bad Request | Invalid JSON in body |
| 401 | Unauthorized | Missing auth header |
| 404 | Not Found | Invalid route |
| 500 | Server Error | Unhandled exception |

---

## CORS Headers

All responses include:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Shop-ID, X-Mode
```

---

## Error Handling

**Client-Side Error:**
```javascript
const response = await fetch('/api/cart-settings/product-coupon-slider', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(config),
});

if (!response.ok) {
  const error = await response.json();
  console.error('Save failed:', error);
  // User sees: "❌ Error saving settings"
}
```

**Server Logs on Error:**
```
[API] POST request to: /api/cart-settings/product-coupon-slider
[API] 404 - Route not found: invalid-route
```

---

## Usage Example (React)

```javascript
// Load config
const loadConfig = async (shopId) => {
  const response = await fetch('/api/cart-settings/product-coupon-slider', {
    headers: { 'X-Shop-ID': shopId },
  });
  const config = await response.json();
  return config;
};

// Save config
const saveConfig = async (shopId, config) => {
  const response = await fetch('/api/cart-settings/product-coupon-slider', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shop-ID': shopId,
    },
    body: JSON.stringify(config),
  });
  const result = await response.json();
  return result;
};
```

---

## Authentication

**Current Status:** No authentication (demo mode)

**shopId Handling:**
- Extracted from `X-Shop-ID` header
- Defaults to `'gid://shopify/Shop/default'`
- Used server-side for data isolation
- Never exposed in frontend UI

**Future Enhancement:**
```javascript
// Production: Validate shopId matches authenticated user
const shopId = request.headers.get('X-Shop-ID');
const authenticatedShopId = await authenticate(request);
if (shopId !== authenticatedShopId) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## Rate Limiting

**Current Status:** No rate limiting (demo mode)

**Future Enhancement:**
```javascript
const rateLimit = new Map();

export async function action({ request, params }) {
  const shopId = getShopId(request);
  const now = Date.now();
  
  if (rateLimit.has(shopId)) {
    const lastRequest = rateLimit.get(shopId);
    if (now - lastRequest < 1000) { // 1 request per second
      return jsonResponse({ error: 'Rate limit exceeded' }, {}, 429);
    }
  }
  rateLimit.set(shopId, now);
  // ... rest of handler
}
```

---

## Testing with cURL

```bash
# GET config
curl -H "X-Shop-ID: gid://shopify/Shop/default" \
  http://localhost:3000/api/cart-settings/product-coupon-slider

# POST config
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Shop-ID: gid://shopify/Shop/default" \
  -d '{
    "enabled": true,
    "uiEditor": { ... },
    "conditions": { ... }
  }' \
  http://localhost:3000/api/cart-settings/product-coupon-slider
```

---

## Integration Points

### Backend Persistence
Currently: In-memory (`SAMPLE_APP_DATA`)
Production: Add database layer

```javascript
// Example: Add to database
const saveToDatabase = async (shopId, config) => {
  await db.productCouponSliders.upsert(
    { shopId },
    { config, updatedAt: new Date() }
  );
};
```

### Webhook Integration
When merchant saves settings:
```javascript
webhookQueue.enqueue({
  event: 'product_coupon_slider_updated',
  shopId,
  config,
  timestamp: new Date(),
});
```

### Analytics
```javascript
const trackAnalytics = (shopId, event, data) => {
  analytics.track({
    userId: shopId,
    event,
    properties: data,
    timestamp: new Date(),
  });
};

// On save
trackAnalytics(shopId, 'product_coupon_slider_saved', {
  enabled: config.enabled,
  couponCount: config.uiEditor.selectedCoupons.length,
  productScope: config.conditions.productScope,
});
```

---

**Last Updated:** February 5, 2026
**Version:** 1.0.0
**Status:** ✅ Complete

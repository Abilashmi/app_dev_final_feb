# Upsell Products Feature - Implementation Guide

## Overview

A production-ready Upsell Products feature for Shopify Cart Drawer App with admin dashboard, storefront integration, and analytics tracking.

## Architecture

```
├── Admin Dashboard (app/routes/app.upsell.jsx)
│   ├── Settings Form (Left Column)
│   │   ├── Enable/Disable Toggle
│   │   ├── Product Selection (Checkboxes)
│   │   ├── Product Limit (1-4)
│   │   ├── Button Text Input
│   │   ├── Layout Selection (Slider/Vertical)
│   │   └── Show Price Toggle
│   └── Live Preview (Right Column)
│
├── API Endpoints (app/routes/api.upsell.jsx)
│   ├── GET /api/upsell → Fetch config + products
│   └── POST /api/upsell → Save configuration
│
├── Storefront Components (app/components/UpsellComponents.jsx)
│   ├── <UpsellContainer /> - Main wrapper
│   ├── <UpsellProductCard /> - Individual product
│   └── <UpsellAddButton /> - CTA button
│
├── Service Layer (app/services/api.upsell.js)
│   ├── Sample products (6 products)
│   ├── Default configuration
│   ├── API functions (get/save)
│   ├── Event tracking
│   └── Shopify Cart API integration
│
└── Storefront Integration (app/services/storefront-upsell-integration.js)
    ├── Fetch configuration
    ├── Render UI
    ├── Handle add to cart
    ├── Track events
    └── CSS styles
```

## File Structure

```
app/
├── routes/
│   ├── app.jsx (Updated - added Upsell nav link)
│   ├── app.upsell.jsx (NEW - Admin dashboard)
│   └── api.upsell.jsx (NEW - API endpoints)
├── components/
│   └── UpsellComponents.jsx (NEW - Storefront components)
└── services/
    ├── api.upsell.js (NEW - Service layer)
    └── storefront-upsell-integration.js (NEW - Storefront JS)
```

## Features

### 1. Admin Dashboard (`app.upsell.jsx`)

**Left Column - Settings:**
- **Enable/Disable Toggle**: Turn upsell on/off
- **Rule Type**: Currently supports "Manual" selection
- **Product Selection**: Checkbox list of 6 sample products
- **Product Limit**: Select 1-4 products to display
- **Button Text**: Customize CTA button text
- **Layout**: Choose between Horizontal Slider or Vertical List
- **Show Price**: Toggle product price visibility
- **Save/Cancel**: Global action buttons

**Right Column - Live Preview:**
- Real-time preview of cart drawer upsell section
- Reflects all setting changes instantly
- Shows both layout types
- Responsive design

### 2. Sample Products

6 pre-configured products in `api.upsell.js`:

```javascript
[
  Premium Wireless Earbuds (₹299),
  Protective Phone Case (₹49),
  USB-C Cable Pack (₹39),
  Portable Power Bank (₹89),
  Screen Protector Glass (₹19),
  Premium Device Stand (₹29)
]
```

### 3. API Endpoints

**GET /api/upsell**
```json
{
  "success": true,
  "data": {
    "config": {
      "enabled": true,
      "trigger": "ANY_CART",
      "ruleType": "MANUAL",
      "products": ["sp-1", "sp-2"],
      "limit": 3,
      "ui": {
        "layout": "slider",
        "buttonText": "Add to Cart",
        "showPrice": true,
        "title": "Recommended for you"
      }
    },
    "products": [/* array of product objects */]
  }
}
```

**POST /api/upsell**
```json
{
  "enabled": true,
  "products": ["sp-1", "sp-2", "sp-3"],
  "limit": 3,
  "ui": {
    "layout": "slider",
    "buttonText": "Add to Cart",
    "showPrice": true,
    "title": "Recommended for you"
  }
}
```

### 4. Storefront Components

**UpsellContainer**
- Main wrapper component
- Handles layout rendering
- Manages product display limit
- Responsive mobile support

```jsx
<UpsellContainer
  config={config}
  products={products}
  onProductAdd={handleAdd}
  isLoading={loading}
/>
```

**UpsellProductCard**
- Individual product card
- Image, title, price, description
- Add to cart button
- Supports both layouts

```jsx
<UpsellProductCard
  product={product}
  buttonText="Add to Cart"
  showPrice={true}
  onAddClick={handleAdd}
  layout="slider"
/>
```

**UpsellAddButton**
- Customizable CTA button
- Loading state
- Disabled state
- Hover effects

```jsx
<UpsellAddButton
  productId="sp-1"
  buttonText="Add to Cart"
  onClick={handleAdd}
  loading={false}
/>
```

### 5. Analytics Events

Tracked events (stored in sessionStorage + console logs):

- **upsell_viewed**: When upsell section is displayed
- **upsell_clicked**: When a product is clicked
- **upsell_added_to_cart**: When product added successfully
- **upsell_add_error**: When add fails
- **upsell_config_saved**: When admin saves settings

### 6. Service Layer (`api.upsell.js`)

Functions:
- `getUpsellConfig()` - Fetch configuration
- `saveUpsellConfig(config)` - Save/update configuration
- `getProductById(id)` - Get single product
- `getProductsByIds(ids)` - Get multiple products
- `trackUpsellEvent(event, data)` - Track analytics
- `addToCartViaShopifyAPI(gid, qty)` - Mock Shopify API

### 7. Storefront Integration

**Key Functions:**
- `fetchUpsellConfig()` - Get config from admin
- `renderUpsellSection(selector)` - Render HTML
- `addUpsellProductToCart(gid, qty)` - Add to cart
- `trackUpsellEvent(event, data)` - Track events
- `refreshCartDrawer()` - Refresh UI after add

**Usage:**
```html
<!-- Add container to cart drawer template -->
<div data-cart-drawer-upsell></div>

<!-- Include script -->
<script src="/storefront-upsell-integration.js"></script>
```

## Data Model

**Upsell Configuration:**
```javascript
{
  enabled: boolean,
  trigger: "ANY_CART", // Future: CART_VALUE_ABOVE, PRODUCT_IN_CART, etc.
  ruleType: "MANUAL", // Future: BEHAVIORAL, RULES_ENGINE, etc.
  products: string[], // Product IDs
  limit: number, // 1-4
  ui: {
    layout: "slider" | "vertical",
    buttonText: string,
    buttonColor: string,
    showPrice: boolean,
    title: string,
    position: "bottom" | "top"
  },
  analytics: {
    trackViews: boolean,
    trackClicks: boolean,
    trackAddToCart: boolean
  }
}
```

**Product Object:**
```javascript
{
  id: string,
  gid: string, // Shopify GraphQL ID
  title: string,
  price: number,
  image: string, // URL
  description: string,
  sku: string,
  variants: number,
  status: "active" | "draft" | "archived" | "outofstock"
}
```

## Integration Checklist

- [x] Admin dashboard page with two-column layout
- [x] Live preview component
- [x] API endpoints (GET/POST)
- [x] Storefront components (Container, Card, Button)
- [x] Sample product data (6 products)
- [x] Analytics event tracking
- [x] Polaris styling
- [x] Mobile responsive design
- [x] Error handling
- [x] Loading states
- [x] Toast notifications
- [x] Validation (limit 1-4, min 1 product)
- [x] Navigation menu link

## Styling

All components use Shopify Polaris tokens and custom CSS:

- **Colors**: Using Polaris color system (#000000, #ffffff, etc.)
- **Typography**: Semibold headers, body text, subdued text
- **Spacing**: Consistent gap values (8px, 12px, 16px)
- **Borders**: 1px solid #e5e7eb
- **Shadows**: Subtle hover shadows
- **Border Radius**: 6-8px
- **Mobile**: Full responsive support (480px breakpoint)

## Next Steps (Future Enhancements)

1. **Dynamic Rules**: Behavioral rules (cart value, product type, quantity)
2. **A/B Testing**: Compare layouts and products
3. **Database Integration**: Persist config with Prisma
4. **Shopify GraphQL**: Real product data from Shopify
5. **Variant Selection**: Choose specific variants
6. **Discount Integration**: Apply discounts to upsell
7. **Performance Metrics**: Conversion tracking
8. **Admin Analytics**: View upsell performance
9. **Mobile Optimization**: Native app integration
10. **Smart Recommendations**: AI-based product suggestions

## Notes

- In-memory storage (use database in production)
- Mock Shopify Cart API (use real API in storefront)
- Session storage for analytics (integrate with analytics service)
- Sample products use placeholder images
- Polaris components for admin UI
- Vanilla JS for storefront integration

## Support

For issues or questions about the implementation, refer to:
- `app/routes/app.upsell.jsx` - Admin UI
- `app/services/api.upsell.js` - Business logic
- `app/components/UpsellComponents.jsx` - Storefront components
- `app/services/storefront-upsell-integration.js` - Storefront JS example

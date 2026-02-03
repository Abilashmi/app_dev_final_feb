# Upsell Products Feature - Quick Start Guide

## 🚀 Getting Started

### 1. Access Admin Dashboard

Navigate to:
```
http://your-app-url/app/upsell
```

The page is now available in the app navigation menu as "Upsell Products".

### 2. Configure Upsell Settings

**Step 1: Enable Feature**
- Toggle "Show upsell products in cart drawer" to enable

**Step 2: Select Products**
- Check up to 4 products from the available list
- Choose from 6 sample products (Earbuds, Cases, Cables, Power Banks, etc.)

**Step 3: Set Product Limit**
- Choose how many products to display (1-4)

**Step 4: Customize Button**
- Enter button text (e.g., "Add for ₹199", "Quick Add")

**Step 5: Choose Layout**
- **Horizontal Slider**: Scrollable row (recommended for mobile)
- **Vertical List**: Full-width list items

**Step 6: Display Options**
- Toggle "Show product price" to display/hide prices

**Step 7: Save**
- Click "Save Settings"
- Success toast confirms the save

### 3. View Live Preview

The right panel shows real-time preview:
- Updates as you adjust settings
- Shows exact cart drawer appearance
- Both layout types previewed

### 4. Integrate into Storefront

#### Option A: React Component Integration
```jsx
import { UpsellContainer } from './components/UpsellComponents';
import { getUpsellConfig, SAMPLE_UPSELL_PRODUCTS } from './services/api.upsell';

export function CartDrawer() {
  const [config, setConfig] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getUpsellConfig().then(data => {
      setConfig(data.config);
      setProducts(data.products);
    });
  }, []);

  return (
    <div>
      {/* Your cart items */}
      <UpsellContainer
        config={config}
        products={products}
        onProductAdd={handleAdd}
      />
    </div>
  );
}
```

#### Option B: Vanilla JavaScript Integration
```html
<!-- In your cart drawer template -->
<div data-cart-drawer-upsell></div>

<!-- Include the integration script -->
<script src="/path/to/storefront-upsell-integration.js"></script>

<script>
  // Initialize on cart drawer open
  document.addEventListener('cartDrawerOpen', () => {
    renderUpsellSection('[data-cart-drawer-upsell]');
  });
</script>
```

### 5. Track Analytics

Events are automatically tracked and logged:

```javascript
// View tracked events
import { getTrackedEvents } from './services/api.upsell';

const events = getTrackedEvents();
console.log(events);

// Clear events
import { clearTrackedEvents } from './services/api.upsell';
clearTrackedEvents();
```

## 📊 Sample Data

**6 Pre-configured Products:**

| ID | Title | Price | Status |
|----|-------|-------|--------|
| sp-1 | Premium Wireless Earbuds | ₹299 | active |
| sp-2 | Protective Phone Case | ₹49 | active |
| sp-3 | USB-C Cable Pack (3-Piece) | ₹39 | active |
| sp-4 | Portable Power Bank 20000mAh | ₹89 | active |
| sp-5 | Screen Protector Glass (2-Pack) | ₹19 | active |
| sp-6 | Premium Device Stand | ₹29 | active |

## 🎯 API Endpoints

### Fetch Configuration
```bash
GET /api/upsell
```

**Response:**
```json
{
  "success": true,
  "data": {
    "config": { /* upsell config */ },
    "products": [ /* selected products */ ]
  }
}
```

### Save Configuration
```bash
POST /api/upsell
Content-Type: application/json

{
  "enabled": true,
  "products": ["sp-1", "sp-2"],
  "limit": 2,
  "ruleType": "MANUAL",
  "ui": {
    "layout": "slider",
    "buttonText": "Add to Cart",
    "showPrice": true,
    "title": "Recommended for you"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration saved successfully",
  "data": { /* updated config */ }
}
```

## 🎨 Layouts

### Horizontal Slider (Default)
- Products display in scrollable horizontal row
- Best for mobile
- Compact and space-efficient
- Auto-scroll on overflow

### Vertical List
- Full-width product cards
- Desktop-friendly
- Product images on left, info on right
- Better for detailed product info

## 🔧 Configuration Options

### Basic Settings
- **Enabled**: Toggle upsell on/off
- **Rule Type**: Manual selection (future: behavioral rules)
- **Products**: List of selected product IDs
- **Limit**: Number of products to display (1-4)

### UI Settings
- **Layout**: slider | vertical
- **Button Text**: CTA button label
- **Show Price**: Display product price
- **Title**: Section header text
- **Position**: bottom (future: top)

### Analytics
- **Track Views**: Log when section is viewed
- **Track Clicks**: Log when product is clicked
- **Track Add to Cart**: Log successful adds

## 📱 Mobile Responsive

The feature is fully responsive:
- Horizontal slider on mobile (recommended)
- Vertical list adapts to screen size
- Touch-friendly button sizes
- Optimized spacing for small screens
- Font sizes scale appropriately

## ⚙️ Customization

### Change Product Limit
Edit in admin and select 1-4 from dropdown

### Change Button Color
Update in `UpsellAddButton` component:
```javascript
backgroundColor: '#your-color'
```

### Change Layout
Toggle between Slider and Vertical in admin

### Add Custom Analytics
In `trackUpsellEvent` function:
```javascript
export function trackUpsellEvent(event, data) {
  // Your analytics service here
  myAnalyticsService.track(event, data);
}
```

## 🐛 Troubleshooting

### Upsell not showing
1. Verify "Enable Upsell" toggle is ON
2. Check if products are selected
3. Check browser console for errors
4. Verify API endpoint is accessible

### Products not loading
1. Check if SAMPLE_UPSELL_PRODUCTS is populated
2. Verify product IDs match
3. Check network requests in DevTools

### Analytics not tracking
1. Check `api.upsell.js` implementation
2. Verify event tracking function is called
3. Check sessionStorage for `upsell_events` key

## 🚀 Production Deployment

Before deploying:

1. **Replace sample data** with real Shopify products
   - Use GraphQL API to fetch products
   - Store in database instead of service layer

2. **Implement persistence**
   - Save config to Prisma database
   - Use app metadata or custom table

3. **Integrate real analytics**
   - Connect to Segment, Mixpanel, Google Analytics
   - Track conversion rates

4. **Test on storefront**
   - Test all layouts on mobile/desktop
   - Test add to cart workflow
   - Test analytics events

5. **Performance optimization**
   - Lazy load product images
   - Cache configuration
   - Debounce API calls

6. **Security**
   - Validate all inputs
   - Protect API endpoints
   - Use CSRF tokens

## 📚 Files Overview

| File | Purpose |
|------|---------|
| `app/routes/app.upsell.jsx` | Admin dashboard page |
| `app/routes/api.upsell.jsx` | API endpoints |
| `app/components/UpsellComponents.jsx` | Storefront React components |
| `app/services/api.upsell.js` | Business logic & sample data |
| `app/services/storefront-upsell-integration.js` | Vanilla JS for storefront |
| `UPSELL_IMPLEMENTATION.md` | Detailed implementation guide |

## 💡 Tips

- Start with horizontal slider for best mobile UX
- Show prices to increase conversion
- Keep button text short (e.g., "Add")
- Test different product combinations
- Monitor conversion metrics
- A/B test layouts and products

## 🤝 Support

For detailed implementation information, see:
- `UPSELL_IMPLEMENTATION.md` - Full architecture guide
- Code comments in each file
- Component prop documentation

---

**Ready to use!** Navigate to `/app/upsell` to get started.

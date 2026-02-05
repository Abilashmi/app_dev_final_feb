# Product Page Coupon Slider - Quick Start

## 🚀 Access the Feature

1. Start the app: `shopify app dev`
2. Open app: Navigate to the Shopify admin
3. Click navigation: **Product Coupon Slider**
4. URL: `/app/product-coupon-slider`

## 📋 What You'll See

### Tab 1: UI Editor
Configure how the coupon slider looks on product pages.

**Steps:**
1. Toggle **"Enable Coupon Slider"** → ON
2. Select at least one coupon from "Select Coupons"
3. Choose a **Slider Style**: Minimal, Card, or Banner
4. Set **Text Alignment**: Left, Center, or Right
5. Enter **Copy Button Text**: e.g., "Copy Code"
6. Toggle **Auto-Slide** (if 2+ coupons selected)
7. Set **Slide Interval**: 5-30 seconds
8. Customize **Colors** using color pickers
9. View **Preview** - updates instantly

### Tab 2: Conditions
Define when and where the slider should appear.

**Steps:**
1. Select **Product Scope**:
   - "All products" → Show everywhere
   - "Specific products" → Choose products
   - "Specific collections" → Choose collections

2. (Optional) Toggle **"Exclude Products"**
   - Select products to hide the slider from

3. Check **Device Visibility**:
   - ✅ Desktop, Mobile, or both

## 💾 Save Your Changes

**Save:** Click "Save Settings" button
- POST request sent to `/api/cart-settings/product-coupon-slider`
- Success message displays for 3 seconds
- Changes persist in backend

**Cancel:** Click "Cancel" button
- All changes revert to last saved state
- Draft discarded

## 🔍 Debugging

### Check Network Requests
1. Open DevTools → **Network** tab
2. Click "Save Settings"
3. Look for: `POST /api/cart-settings/product-coupon-slider`
4. Check headers: `X-Shop-ID` present
5. Check response: Success message and data

### Check Console Logs
```
Filter: [Product Coupon Slider]

Expected logs:
[Product Coupon Slider] Loaded config: {...}
[Product Coupon Slider] Saving config: {...}
[Product Coupon Slider] Response status: 200
[Product Coupon Slider] Saved successfully: {...}
```

## ⚠️ Validation Rules

**UI Editor:**
- ❌ Cannot save if enabled but no coupons selected
- ❌ Cannot save if all validation checks fail

**Conditions:**
- ❌ Cannot save if specific products/collections selected but none chosen
- ⚠️ Auto-slide disabled if fewer than 2 coupons

**All sections:**
- Errors shown inline with warning boxes
- Save button disabled until valid

## 🎨 Features Overview

| Feature | Type | Required | Notes |
|---------|------|----------|-------|
| Enable Toggle | Boolean | No | Controls if widget appears |
| Coupon Selection | Multi-select | Yes (if enabled) | At least 1 required |
| Slider Style | Radio | Yes | Minimal/Card/Banner |
| Text Alignment | Segmented | Yes | Left/Center/Right |
| Auto-Slide | Toggle | No | Only if 2+ coupons |
| Slide Interval | Number | No | 1-30 seconds |
| Copy Button Text | Text | Yes | Default: "Copy Code" |
| Colors | Color pickers | Yes | 3 colors customizable |
| Product Scope | Radio | Yes | All/Specific/Collections |
| Device Visibility | Checkboxes | Yes | Desktop/Mobile |
| Exclude Products | Toggle | No | Optional exclusion list |

## 📊 Data Structure

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
    "productScope": "all",
    "selectedProducts": [],
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

## 🔑 Key Behaviors

1. **Draft vs Saved**
   - Changes not saved until "Save Settings" clicked
   - Cancel reverts all changes
   - Preview always shows current draft

2. **Conditional Fields**
   - Product selector only shows when "Specific products" selected
   - Collection selector only shows when "Specific collections" selected
   - Slide interval only shows when auto-slide enabled
   - Color picker fields always visible

3. **Validation Feedback**
   - Warning boxes appear inline
   - Save button disabled if validation fails
   - Helpful error messages provided

4. **API Integration**
   - All data persisted to backend
   - shopId managed server-side only
   - Draft state maintained client-side only

## 🛠️ Technical Details

**Files Involved:**
- `api.cart-settings.jsx` - Data structures and exports
- `api.cart-settings.$.jsx` - API endpoint handlers
- `app.product-coupon-slider.jsx` - UI component
- `app.jsx` - Navigation link

**Data Persistence:**
- Runtime: `SAMPLE_APP_DATA.productCouponSlider`
- No database yet (for production: add DB layer)
- Per-shop isolation ready (shopId support)

**State Management:**
- React hooks (useState, useEffect)
- Draft state pattern
- Async save with loading states

## 📱 Responsive Design

The UI is built with Polaris components:
- ✅ Mobile responsive
- ✅ Touch-friendly controls
- ✅ Accessible form inputs
- ✅ Dark mode support

## 🎯 Next Steps

After testing:
1. Verify all saves appear in Network tab
2. Check console for debug logs
3. Test cancel functionality
4. Try validation edge cases
5. Verify shopId never appears in UI

---

**Questions?** Check `PRODUCT_COUPON_SLIDER_GUIDE.md` for detailed documentation.

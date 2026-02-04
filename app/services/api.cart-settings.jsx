// ==========================================
// SAMPLE COUPON DATA - SINGLE SOURCE OF TRUTH
// ==========================================

// Global style configuration (applies to ALL coupons)
export const COUPON_STYLES = {
  STYLE_1: 'style-1',
  STYLE_2: 'style-2', 
  STYLE_3: 'style-3',
};

// Style metadata with preview images
export const COUPON_STYLE_METADATA = {
  [COUPON_STYLES.STYLE_1]: {
    name: 'Blue Banner',
    description: 'Classic discount badge with shop branding',
    previewImage: 'https://via.placeholder.com/320x140/0052cc/ffffff?text=25%25+OFF', // Replace with actual preview
  },
  [COUPON_STYLES.STYLE_2]: {
    name: 'Pink Card',
    description: 'Rounded card with soft colors',
    previewImage: 'https://via.placeholder.com/320x140/fce7f3/db2777?text=BAWSE5', // Replace with actual preview
  },
  [COUPON_STYLES.STYLE_3]: {
    name: 'Ticket Design',
    description: 'Event-style ticket with side banner',
    previewImage: 'https://via.placeholder.com/320x140/fbbf24/ffffff?text=TICKET', // Replace with actual preview
  },
};

// Global selected style (applies to all coupons)
export let globalCouponStyle = COUPON_STYLES.STYLE_1;

// Sample coupon data (simplified per-coupon configuration)
export const sampleCoupons = [
  {
    id: 'coupon-1',
    enabled: true,
    code: 'SAVE25',
    label: "Sam's CLUB",
    description: 'Valid until 01-31-2025',
    textAlign: 'left',
    iconUrl: '🏪',
    backgroundColor: '#0052cc',
    textColor: '#ffffff',
    borderRadius: 4,
    discountType: 'percentage',
    discountValue: 25,
    button: {
      text: 'Shop Now',
      textColor: '#ffffff',
      backgroundColor: '#ff9500',
      borderRadius: 4,
    },
  },
  {
    id: 'coupon-2',
    enabled: true,
    code: 'BAWSE5',
    label: 'Baby Sale',
    description: 'Enjoy 5% off sitewide—just for you!',
    textAlign: 'center',
    iconUrl: '✨',
    backgroundColor: '#fce7f3',
    textColor: '#db2777',
    borderRadius: 12,
    discountType: 'percentage',
    discountValue: 5,
    button: {
      text: 'Tap to Apply',
      textColor: '#ffffff',
      backgroundColor: '#ec4899',
      borderRadius: 20,
    },
  },
  {
    id: 'coupon-3',
    enabled: true,
    code: 'TICKET2024',
    label: 'Event Special',
    description: 'Get your tickets now!',
    textAlign: 'center',
    iconUrl: '🎟️',
    backgroundColor: '#ffffff',
    textColor: '#374151',
    borderRadius: 4,
    discountType: 'fixed',
    discountValue: 50,
    button: {
      text: 'BUY TICKETS',
      textColor: '#ffffff',
      backgroundColor: '#ef4444',
      borderRadius: 6,
    },
  },
];

// ==========================================
// SHOPIFY PRODUCTS & COLLECTIONS
// ==========================================

export const shopifyProducts = [
  {
    id: 'sp-1',
    title: 'Gift Card',
    price: '10.00',
    image: '🎁',
    variants: 4,
    status: 'outofstock',
  },
  {
    id: 'sp-2',
    title: 'The Inventory Not Tracked Snowboard',
    price: '949.95',
    image: '🏂',
    variants: 1,
    status: 'active',
  },
  {
    id: 'sp-3',
    title: 'The Archived Snowboard',
    price: '629.95',
    image: '🏂',
    variants: 1,
    status: 'archived',
  },
  {
    id: 'sp-4',
    title: 'The Draft Snowboard',
    price: '2629.95',
    image: '🏂',
    variants: 1,
    status: 'draft',
  },
  {
    id: 'sp-5',
    title: 'The Out of Stock Snowboard',
    price: '885.95',
    image: '🏂',
    variants: 1,
    status: 'outofstock',
  },
  {
    id: 'sp-6',
    title: 'Premium Hoodie',
    price: '129.99',
    image: '🧥',
    variants: 3,
    status: 'active',
  },
  {
    id: 'sp-7',
    title: 'Classic Jeans',
    price: '89.99',
    image: '👖',
    variants: 5,
    status: 'active',
  },
  {
    id: 'sp-8',
    title: 'Sports Cap',
    price: '39.99',
    image: '🧢',
    variants: 2,
    status: 'active',
  },
];

export const mockCollections = [
  { id: 'col-1', title: 'Winter Gear', productCount: 15 },
  { id: 'col-2', title: 'Gifts & Bundles', productCount: 8 },
  { id: 'col-3', title: 'Premium Accessories', productCount: 12 },
  { id: 'col-4', title: 'Discountable Items', productCount: 20 },
  { id: 'col-5', title: 'New Arrivals', productCount: 10 },
];

// ==========================================
// UPSELL CONFIGURATION API
// ==========================================

// In-memory storage (replace with database in production)
let upsellConfigStore = {};

/**
 * Get upsell configuration for a shop
 * SECURITY: Does not return config in response body
 * Config only visible via Network tab API inspection
 */
export const getUpsellConfig = async (shopId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const config = upsellConfigStore[shopId] || {
        shopId,
        useAI: false,
        manualRules: [],
        updatedAt: null,
      };
      // Return only status, not config in response
      resolve({ status: 'success', shopId });
    }, 300);
  });
};

/**
 * Save upsell configuration for a shop
 * SECURITY: Config stored server-side, not exposed to frontend
 */
export const saveUpsellConfig = async (shopId, configData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Validate config
      if (!configData.manualRules || configData.manualRules.length === 0) {
        if (!configData.useAI) {
          reject(new Error('At least one rule or AI mode must be enabled'));
          return;
        }
      }

      // Validate each rule
      const validRules = configData.manualRules.every(rule => {
        if (rule.triggerType === 'specific') {
          const hasTrigger = (rule.triggerProductIds?.length > 0) || (rule.triggerCollectionIds?.length > 0);
          const hasUpsell = rule.upsellProductIds?.length > 0;
          return hasTrigger && hasUpsell;
        }
        if (rule.triggerType === 'all') {
          return rule.upsellProductIds?.length > 0;
        }
        return false;
      });

      if (!validRules) {
        reject(new Error('Each rule must have trigger products and upsell products'));
        return;
      }

      // Store config (secure: not in frontend state)
      upsellConfigStore[shopId] = {
        shopId,
        useAI: configData.useAI,
        manualRules: configData.manualRules.map((rule, idx) => ({
          ...rule,
          priority: idx,
        })),
        updatedAt: new Date().toISOString(),
      };

      // Return only status
      resolve({
        status: 'success',
        message: 'Upsell configuration saved',
        shopId,
      });
    }, 500);
  });
};

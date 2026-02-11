/**
 * In-memory storage for cart settings and coupons.
 * This is configuration-driven, not transactional.
 */

let CART_SETTINGS = {
  progressBar: {
    enabled: true,
    mode: "amount",
    showOnEmpty: true,
    barBackgroundColor: "#e5e7eb",
    barForegroundColor: "#93D3FF",
    borderRadius: 8,
    completionText: "Free shipping unlocked!",
    rewardsCalculation: ["cartTotal"],
    tiers: [
      {
        id: 1,
        rewardType: "product",
        minValue: 500,
        description: "Free Shipping",
        titleBeforeAchieving: "You're {COUNT} away from Free Shipping",
        products: ["sp-1", "sp-2"],
      },
      {
        id: 2,
        rewardType: "product",
        minValue: 1000,
        description: "Free Gift",
        titleBeforeAchieving: "You're {COUNT} away from Free Gift",
        products: ["sp-3"],
      },
    ],
  },
  coupons: {
    selectedStyle: "style-1",
    position: "top",
    layout: "grid",
    alignment: "horizontal",
  },
  upsell: {
    enabled: true,
    upsellMode: "manual",
    manualRules: [],
  },
};

let COUPONS = [
  {
    id: "co-1",
    coupon_code_text: "SAVE10",
    description_text: "Save 10% on orders over ₹500",
    is_enabled: true,
  },
  {
    id: "co-2",
    coupon_code_text: "FLAT75",
    description_text: "Flat ₹75 off on your first order",
    is_enabled: true,
  },
];

// --- Static Data (Moved from shared or route for centralization) ---

export const shopifyProducts = [
  { id: 'sp-1', title: 'Gift Card', price: '10.00', image: '🎁' },
  { id: 'sp-2', title: 'The Inventory Not Tracked Snowboard', price: '949.95', image: '🏂' },
  { id: 'sp-6', title: 'Premium Hoodie', price: '129.99', image: '🧥' },
];

export const mockCollections = [
  { id: 'col-1', title: 'Winter Gear', productCount: 15 },
  { id: 'col-2', title: 'Gifts & Bundles', productCount: 8 },
];

export const cartData = {
  cartValue: 100,
  totalQuantity: 3,
  items: [
    { id: 1, title: 'Premium Hoodie', price: 50, qty: 1 },
    { id: 2, title: 'Classic T-Shirt', price: 25, qty: 2 },
  ],
};

// --- Getters ---

export function getCartSettings() {
  return CART_SETTINGS;
}

export function getCoupons() {
  return COUPONS;
}

export function getStaticData() {
  return {
    shopifyProducts,
    mockCollections,
    cartData,
  };
}

// --- Save/Update Functions ---

export function saveProgressBarSettings(data) {
  CART_SETTINGS.progressBar = {
    ...CART_SETTINGS.progressBar,
    ...data,
  };
  return CART_SETTINGS.progressBar;
}

export function saveCouponSettings(data) {
  CART_SETTINGS.coupons = {
    ...CART_SETTINGS.coupons,
    ...data,
  };
  return CART_SETTINGS.coupons;
}

export function saveUpsellSettings(data) {
  CART_SETTINGS.upsell = {
    ...CART_SETTINGS.upsell,
    ...data,
  };
  return CART_SETTINGS.upsell;
}

export function saveCoupons(data) {
  if (data && Array.isArray(data.allCoupons)) {
    COUPONS = data.allCoupons;
  }
  return COUPONS;
}

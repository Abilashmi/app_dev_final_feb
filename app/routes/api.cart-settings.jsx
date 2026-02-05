// app/routes/api.cart-settings.jsx

// ==========================================
// COUPON DATA & STYLES
// ==========================================

export const COUPON_STYLES = {
  STYLE_1: 'style-1',
  STYLE_2: 'style-2', 
  STYLE_3: 'style-3',
};

export const COUPON_STYLE_METADATA = {
  [COUPON_STYLES.STYLE_1]: {
    name: 'Blue Banner',
    description: 'Classic discount badge with shop branding',
    previewImage: 'https://via.placeholder.com/320x140/0052cc/ffffff?text=25%25+OFF',
  },
  [COUPON_STYLES.STYLE_2]: {
    name: 'Pink Card',
    description: 'Rounded card with soft colors',
    previewImage: 'https://via.placeholder.com/320x140/fce7f3/db2777?text=BAWSE5',
  },
  [COUPON_STYLES.STYLE_3]: {
    name: 'Ticket Design',
    description: 'Event-style ticket with side banner',
    previewImage: 'https://via.placeholder.com/320x140/fbbf24/ffffff?text=TICKET',
  },
};

export let globalCouponStyle = COUPON_STYLES.STYLE_1;

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
// UPSELL CONFIGURATION
// ==========================================

let upsellConfigStore = {};

export const getUpsellConfig = async (shopId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const config = upsellConfigStore[shopId] || {
        shopId,
        useAI: false,
        manualRules: [],
        updatedAt: null,
      };
      resolve({ status: 'success', shopId });
    }, 300);
  });
};

export const saveUpsellConfig = async (shopId, configData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!configData.manualRules || configData.manualRules.length === 0) {
        if (!configData.useAI) {
          reject(new Error('At least one rule or AI mode must be enabled'));
          return;
        }
      }

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

      upsellConfigStore[shopId] = {
        shopId,
        useAI: configData.useAI,
        manualRules: configData.manualRules.map((rule, idx) => ({
          ...rule,
          priority: idx,
        })),
        updatedAt: new Date().toISOString(),
      };

      resolve({
        status: 'success',
        message: 'Upsell configuration saved',
        shopId,
      });
    }, 500);
  });
};

// ==========================================
// UPSELL RULE TYPES & CONFIGURATIONS
// ==========================================

export const RULE_TYPES = {
  GLOBAL: 'GLOBAL',
  TRIGGERED: 'TRIGGERED',
  GLOBAL_EXCEPT: 'GLOBAL_EXCEPT',
  CART_CONDITIONS: 'CART_CONDITIONS',
};

export const RULE_TYPE_OPTIONS = [
  {
    value: RULE_TYPES.GLOBAL,
    label: 'Show upsell for all products',
    description: 'Display upsell products for any item in the cart',
    helpText: 'Acts as a default fallback rule',
  },
  {
    value: RULE_TYPES.TRIGGERED,
    label: 'Show upsell for specific products or collections',
    description: 'Display upsells only when specific trigger products are in cart',
    helpText: 'This rule has the highest priority',
  },
  {
    value: RULE_TYPES.GLOBAL_EXCEPT,
    label: 'Show upsell for all products except selected ones',
    description: 'Display upsells for everything except excluded products',
    helpText: 'Show for all products except when excluded items are in cart',
  },
  {
    value: RULE_TYPES.CART_CONDITIONS,
    label: 'Show upsell based on cart value',
    description: 'Display upsells when cart total meets a threshold',
    helpText: 'This rule has higher priority than the global fallback',
  },
];

export const SAMPLE_UPSELL_PRODUCTS = [
  {
    id: 'sp-1',
    gid: 'gid://shopify/Product/8365147292',
    title: 'Premium Wireless Earbuds',
    price: 299,
    image: 'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/earbud_400x400.jpg?v=1',
    description: 'High-quality audio with noise cancellation',
    sku: 'EARBUDS-001',
    variants: 3,
    status: 'active',
  },
  {
    id: 'sp-2',
    gid: 'gid://shopify/Product/8365147293',
    title: 'Protective Phone Case',
    price: 49,
    image: 'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/case_400x400.jpg?v=1',
    description: 'Durable protection for all smartphone models',
    sku: 'CASE-001',
    variants: 5,
    status: 'active',
  },
  {
    id: 'sp-3',
    gid: 'gid://shopify/Product/8365147294',
    title: 'USB-C Cable Pack (3-Piece)',
    price: 39,
    image: 'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/cable_400x400.jpg?v=1',
    description: 'Fast charging cables for all devices',
    sku: 'CABLE-003',
    variants: 2,
    status: 'active',
  },
  {
    id: 'sp-4',
    gid: 'gid://shopify/Product/8365147295',
    title: 'Portable Power Bank 20000mAh',
    price: 89,
    image: 'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/powerbank_400x400.jpg?v=1',
    description: 'Quick charge your devices on the go',
    sku: 'POWER-001',
    variants: 2,
    status: 'active',
  },
  {
    id: 'sp-5',
    gid: 'gid://shopify/Product/8365147296',
    title: 'Screen Protector Glass (2-Pack)',
    price: 19,
    image: 'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/glass_400x400.jpg?v=1',
    description: 'Tempered glass with HD clarity',
    sku: 'GLASS-002',
    variants: 1,
    status: 'active',
  },
  {
    id: 'sp-6',
    gid: 'gid://shopify/Product/8365147297',
    title: 'Premium Device Stand',
    price: 29,
    image: 'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/stand_400x400.jpg?v=1',
    description: 'Adjustable stand for any device',
    sku: 'STAND-001',
    variants: 2,
    status: 'active',
  },
];

export const DEFAULT_UPSELL_CONFIG = {
  rule1: {
    enabled: true,
    upsellProducts: ['sp-1', 'sp-2'],
  },
  rule2: {
    enabled: false,
    triggerProducts: [],
    upsellProducts: [],
  },
  rule3: {
    enabled: false,
    cartValueThreshold: 1000,
    upsellProducts: [],
  },
};

export function validateUpsellRule(config, allRules = []) {
  const hasGlobalRule = allRules.some(
    (rule) => rule.enabled && rule.ruleType === RULE_TYPES.GLOBAL && rule.id !== config.id
  );
  const hasGlobalExceptRule = allRules.some(
    (rule) => rule.enabled && rule.ruleType === RULE_TYPES.GLOBAL_EXCEPT && rule.id !== config.id
  );

  const currentRuleType = config.ruleType;

  if (currentRuleType === RULE_TYPES.GLOBAL && hasGlobalExceptRule) {
    return {
      valid: false,
      error: 'You can either apply upsells to all products or all products except selected ones — not both.',
    };
  }

  if (currentRuleType === RULE_TYPES.GLOBAL_EXCEPT && hasGlobalRule) {
    return {
      valid: false,
      error: 'You can either apply upsells to all products or all products except selected ones — not both.',
    };
  }

  if (currentRuleType === RULE_TYPES.TRIGGERED) {
    if (
      (!config.triggerProducts || config.triggerProducts.length === 0) &&
      (!config.triggerCollections || config.triggerCollections.length === 0)
    ) {
      return {
        valid: false,
        error: 'Triggered rule requires at least one trigger product or collection',
      };
    }
  }

  if (currentRuleType === RULE_TYPES.GLOBAL_EXCEPT) {
    if (
      (!config.excludedProducts || config.excludedProducts.length === 0) &&
      (!config.excludedCollections || config.excludedCollections.length === 0)
    ) {
      return {
        valid: false,
        error: 'Global-except rule requires at least one excluded product or collection',
      };
    }
  }

  if (config.enabled && 
    (!config.upsellProducts || config.upsellProducts.length === 0) &&
    (!config.upsellCollections || config.upsellCollections.length === 0)
  ) {
    return {
      valid: false,
      error: 'At least one upsell product or collection must be selected',
    };
  }

  if (config.limit < 1 || config.limit > 4) {
    return {
      valid: false,
      error: 'Upsell limit must be between 1 and 4',
    };
  }

  return { valid: true };
}

export function evaluateUpsellRules(rules, cartProductIds = [], cartTotal = 0) {
  if (!rules || rules.length === 0) {
    return null;
  }

  const activeRules = rules.filter((rule) => rule.enabled);

  for (const rule of activeRules) {
    if (rule.ruleType === RULE_TYPES.TRIGGERED) {
      const triggers = [...(rule.triggerProducts || []), ...(rule.triggerCollections || [])];
      const hasMatch = triggers.some((triggerId) => cartProductIds.includes(triggerId));
      if (hasMatch) {
        return rule;
      }
    }
  }

  for (const rule of activeRules) {
    if (rule.ruleType === RULE_TYPES.CART_CONDITIONS) {
      const threshold = Number(rule.cartValueThreshold || 0);
      if (threshold > 0 && cartTotal >= threshold) {
        return rule;
      }
    }
  }

  for (const rule of activeRules) {
    if (rule.ruleType === RULE_TYPES.GLOBAL_EXCEPT) {
      const exclusions = [...(rule.excludedProducts || []), ...(rule.excludedCollections || [])];
      const hasExcluded = exclusions.some((excludedId) => cartProductIds.includes(excludedId));
      if (!hasExcluded) {
        return rule;
      }
    }
  }

  const globalRule = activeRules.find((rule) => rule.ruleType === RULE_TYPES.GLOBAL);
  return globalRule || null;
}

export function canEnableRuleType(ruleType, existingRules = []) {
  const activeRules = existingRules.filter((rule) => rule.enabled);

  if (ruleType === RULE_TYPES.GLOBAL) {
    const hasGlobalExcept = activeRules.some((rule) => rule.ruleType === RULE_TYPES.GLOBAL_EXCEPT);
    if (hasGlobalExcept) {
      return {
        canEnable: false,
        reason: 'Global upsell and global-except upsell cannot be used together.',
      };
    }
  }

  if (ruleType === RULE_TYPES.GLOBAL_EXCEPT) {
    const hasGlobal = activeRules.some((rule) => rule.ruleType === RULE_TYPES.GLOBAL);
    if (hasGlobal) {
      return {
        canEnable: false,
        reason: 'Global upsell and global-except upsell cannot be used together.',
      };
    }
  }

  return { canEnable: true };
}

export function getProductById(productId) {
  return SAMPLE_UPSELL_PRODUCTS.find((p) => p.id === productId);
}

export function getProductsByIds(productIds) {
  return productIds
    .map((id) => getProductById(id))
    .filter((p) => p !== undefined);
}

export function trackUpsellEvent(event, data = {}) {
  console.log(`[Analytics] ${event}:`, {
    timestamp: new Date().toISOString(),
    ...data,
  });

  if (typeof sessionStorage !== 'undefined') {
    const events = JSON.parse(sessionStorage.getItem('upsell_events') || '[]');
    events.push({
      event,
      data,
      timestamp: new Date().toISOString(),
    });
    sessionStorage.setItem('upsell_events', JSON.stringify(events));
  }
}

export function getTrackedEvents() {
  return JSON.parse(sessionStorage.getItem('upsell_events') || '[]');
}

export function clearTrackedEvents() {
  sessionStorage.removeItem('upsell_events');
}

export async function addToCartViaShopifyAPI(productGid, quantity = 1) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    success: true,
    message: 'Product added to cart',
    cartData: {
      itemCount: 5,
      totalPrice: '499.99',
      lastAddedItem: {
        gid: productGid,
        quantity,
      },
    },
  };
}

// ==========================================
// PRODUCT PAGE COUPON SLIDER CONFIGURATION
// ==========================================

export const PRODUCT_COUPON_SLIDER_STYLES = {
  MINIMAL: 'minimal',
  CARD: 'card',
  BANNER: 'banner',
};

export const PRODUCT_COUPON_SLIDER_STYLE_OPTIONS = [
  { value: PRODUCT_COUPON_SLIDER_STYLES.MINIMAL, label: 'Minimal', description: 'Clean, simple design' },
  { value: PRODUCT_COUPON_SLIDER_STYLES.CARD, label: 'Card', description: 'Rounded card layout' },
  { value: PRODUCT_COUPON_SLIDER_STYLES.BANNER, label: 'Banner', description: 'Full-width banner' },
];

export const PRODUCT_COUPON_SLIDER_ALIGNMENTS = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
};

export const DEFAULT_PRODUCT_COUPON_SLIDER_CONFIG = {
  enabled: false,
  uiEditor: {
    selectedCoupons: [],
    sliderStyle: PRODUCT_COUPON_SLIDER_STYLES.CARD,
    textAlignment: PRODUCT_COUPON_SLIDER_ALIGNMENTS.CENTER,
    autoSlide: false,
    slideInterval: 5,
    copyButtonText: 'Copy Code',
    colors: {
      backgroundColor: '#ffffff',
      textColor: '#111827',
      buttonColor: '#2c6ecb',
    },
  },
  conditions: {
    productScope: 'all', // 'all', 'specific-products', 'specific-collections'
    selectedProducts: [],
    selectedCollections: [],
    excludeProducts: false,
    excludedProducts: [],
    deviceVisibility: {
      desktop: true,
      mobile: true,
    },
  },
  draftState: null,
};

// In-memory storage for product coupon slider configs
let productCouponSliderStore = {};

// ==========================================
// SAMPLE APP DATA
// ==========================================

export const SAMPLE_APP_DATA = {
  cartStatus: true,
  previewCartState: 'items',
  selectedTab: 'progress-bar',
  featureStates: {
    progressBarEnabled: true,
    couponSliderEnabled: true,
    upsellEnabled: true,
  },
  productCouponSlider: {
    ...DEFAULT_PRODUCT_COUPON_SLIDER_CONFIG,
  },
  progressBarSettings: {
    showOnEmpty: true,
    barBackgroundColor: '#e5e7eb',
    barForegroundColor: '#93D3FF',
    completionText: 'Free shipping unlocked!',
    rewardsCalculation: ['cartTotal'],
    tiers: [
      {
        id: 1,
        rewardType: 'product',
        minValue: 500,
        description: 'Free Shipping',
        titleBeforeAchieving: 'You\'re {COUNT} away from Free Shipping',
        products: ['sp-1', 'sp-2'],
      },
      {
        id: 2,
        rewardType: 'product',
        minValue: 1000,
        description: 'Free Gift',
        titleBeforeAchieving: 'You\'re {COUNT} away from Free Gift',
        products: ['sp-3'],
      },
    ],
  },
  couponSliderSettings: {
    enabled: true,
    sectionSettings: {
      section_title: 'Available offers',
      section_title_color: '#111827',
      section_title_font_size: 14,
      section_title_font_weight: 700,
      section_background_color: '#fef3c7',
      section_padding: 12,
      section_border_radius: 10,
    },
    cardStyleSettings: {
      card_background_color: '#ffffff',
      card_border_color: '#fcd34d',
      card_border_width: 1,
      card_border_radius: 8,
      card_shadow: true,
      card_padding: 10,
      card_gap_between_cards: 8,
    },
    offers: [
      {
        id: 'co-1',
        coupon_code_text: 'SAVE10',
        coupon_code_color: '#111827',
        coupon_code_font_size: 14,
        coupon_code_font_weight: 700,
        coupon_code_letter_spacing: 1,
        description_text: 'Save 10% on orders over ₹500',
        description_color: '#4b5563',
        description_font_size: 12,
        description_font_weight: 500,
        description_line_height: 1.4,
        button_text: 'Copy code',
        button_text_color: '#ffffff',
        button_background_color: '#111827',
        button_font_size: 12,
        button_font_weight: 600,
        button_padding_top_bottom: 6,
        button_padding_left_right: 12,
        button_border_radius: 6,
        button_border_color: '#111827',
        button_border_width: 1,
        show_button: true,
        icon_image_url: 'https://via.placeholder.com/40',
        icon_width: 32,
        icon_height: 32,
        icon_border_radius: 8,
        icon_background_color: '#fef3c7',
        icon_alignment: 'left',
        show_icon: true,
        discount_type: 'percentage',
        discount_value: 10,
        minimum_order_value: 500,
        is_enabled: true,
      },
      {
        id: 'co-2',
        coupon_code_text: 'FLAT75',
        coupon_code_color: '#111827',
        coupon_code_font_size: 14,
        coupon_code_font_weight: 700,
        coupon_code_letter_spacing: 1,
        description_text: 'Flat ₹75 off on your first order',
        description_color: '#4b5563',
        description_font_size: 12,
        description_font_weight: 500,
        description_line_height: 1.4,
        button_text: 'Apply now',
        button_text_color: '#ffffff',
        button_background_color: '#0f172a',
        button_font_size: 12,
        button_font_weight: 600,
        button_padding_top_bottom: 6,
        button_padding_left_right: 12,
        button_border_radius: 6,
        button_border_color: '#0f172a',
        button_border_width: 1,
        show_button: true,
        icon_image_url: 'https://via.placeholder.com/40',
        icon_width: 32,
        icon_height: 32,
        icon_border_radius: 8,
        icon_background_color: '#e0f2fe',
        icon_alignment: 'left',
        show_icon: true,
        discount_type: 'flat',
        discount_value: 75,
        minimum_order_value: 0,
        is_enabled: true,
      },
      {
        id: 'co-3',
        coupon_code_text: 'SHIPFREE',
        coupon_code_color: '#111827',
        coupon_code_font_size: 14,
        coupon_code_font_weight: 700,
        coupon_code_letter_spacing: 1,
        description_text: 'Free shipping above ₹900',
        description_color: '#4b5563',
        description_font_size: 12,
        description_font_weight: 500,
        description_line_height: 1.4,
        button_text: 'Reveal code',
        button_text_color: '#0f172a',
        button_background_color: '#ffffff',
        button_font_size: 12,
        button_font_weight: 600,
        button_padding_top_bottom: 6,
        button_padding_left_right: 12,
        button_border_radius: 6,
        button_border_color: '#0f172a',
        button_border_width: 1,
        show_button: false,
        icon_image_url: 'https://via.placeholder.com/40',
        icon_width: 32,
        icon_height: 32,
        icon_border_radius: 8,
        icon_background_color: '#dcfce7',
        icon_alignment: 'top',
        show_icon: true,
        discount_type: 'flat',
        discount_value: 0,
        minimum_order_value: 900,
        is_enabled: false,
      },
    ],
  },
  upsellSettings: {
    enabled: true,
    showOnEmptyCart: false,
    useAIRecommendation: false,
    aiRecommendationType: 'related',
    useManualUpsell: true,
    manualTriggerMode: 'all',
    triggeredProducts: [],
    triggeredCollections: [],
    upsellProducts: ['sp-2', 'sp-6', 'sp-8'],
    title: 'Recommended for you',
    titleFormatting: { bold: false, italic: false, underline: false },
    buttonStyle: 'box',
    position: 'bottom',
    layout: 'grid',
    alignment: 'horizontal',
    showNavigationArrows: true,
    showProductReviews: false,
    ruleType: 'MANUAL',
    trigger: 'ANY_CART',
    products: ['sp-2', 'sp-4', 'sp-6'],
    limit: 3,
    manualRules: [],
    ui: {
      layout: 'slider',
      buttonText: 'Add to Cart',
      buttonColor: '#000000',
      showPrice: true,
      title: 'Recommended for you',
      position: 'bottom',
    },
    analytics: {
      trackViews: true,
      trackClicks: true,
      trackAddToCart: true,
    },
  },
  cartData: {
    cartValue: 640,
    totalQuantity: 3,
    items: [
      {
        id: 1,
        title: 'Premium T-Shirt',
        price: 320,
        qty: 2,
        image: '👕',
      },
      {
        id: 2,
        title: 'Classic Cap',
        price: 0,
        qty: 1,
        image: '🧢',
      },
    ],
  },
  milestones: {
    amount: [
      {
        id: 'm1',
        type: 'amount',
        target: 500,
        label: '₹500',
        rewardText: 'Free Shipping',
        associatedProducts: ['sp-1'],
      },
      {
        id: 'm2',
        type: 'amount',
        target: 1000,
        label: '₹1000',
        rewardText: 'Free Gift',
        associatedProducts: ['sp-2'],
      },
    ],
    quantity: [
      {
        id: 'qm1',
        type: 'quantity',
        target: 5,
        label: '5 items',
        rewardText: '10% OFF',
        associatedProducts: ['sp-3'],
      },
      {
        id: 'qm2',
        type: 'quantity',
        target: 10,
        label: '10 items',
        rewardText: 'Free Surprise Gift',
        associatedProducts: ['sp-4'],
      },
    ],
  },
  shopifyProducts: [
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
  ],
  mockCollections: [
    { id: 'col-1', title: 'Winter Gear', productCount: 15 },
    { id: 'col-2', title: 'Gifts & Bundles', productCount: 8 },
    { id: 'col-3', title: 'Premium Accessories', productCount: 12 },
    { id: 'col-4', title: 'Discountable Items', productCount: 20 },
    { id: 'col-5', title: 'New Arrivals', productCount: 10 },
  ],
};

// This loader function acts as our GET endpoint for the cart drawer
export async function loader() {
  // Return sample coupons data
  return new Response(JSON.stringify({ coupons: SAMPLE_APP_DATA.couponSliderSettings.offers }), {
    headers: {
      'Content-Type': 'application/json',
      // Add CORS headers to allow the storefront to fetch this
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// This action function is the single endpoint for saving settings
export async function action({ request }) {
  const url = new URL(request.url);
  const path = url.pathname;
  const shopId = request.headers.get('X-Shop-ID') || 'gid://shopify/Shop/default';

  // Handle upsell settings GET request
  if (path.includes('/upsell') && request.method === 'GET') {
    console.log(`[API] GET upsell settings for shop: ${shopId}`);
    return new Response(JSON.stringify(SAMPLE_APP_DATA.upsellSettings), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Shop-ID': shopId,
      },
    });
  }

  // Handle upsell settings POST/PUT request
  if (path.includes('/upsell') && (request.method === 'POST' || request.method === 'PUT')) {
    const body = await request.json();
    console.log(`[API] ${request.method} upsell settings for shop: ${shopId}`, body);
    SAMPLE_APP_DATA.upsellSettings = { ...SAMPLE_APP_DATA.upsellSettings, ...body };
    return new Response(JSON.stringify({ success: true, data: SAMPLE_APP_DATA.upsellSettings }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Shop-ID': shopId,
      },
    });
  }

  // Handle products GET request
  if (path.includes('/products') && request.method === 'GET') {
    console.log(`[API] GET products for shop: ${shopId}`);
    return new Response(JSON.stringify(SAMPLE_APP_DATA.shopifyProducts), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Shop-ID': shopId,
      },
    });
  }

  // Handle collections GET request
  if (path.includes('/collections') && request.method === 'GET') {
    console.log(`[API] GET collections for shop: ${shopId}`);
    return new Response(JSON.stringify(SAMPLE_APP_DATA.mockCollections), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Shop-ID': shopId,
      },
    });
  }

  // Handle cart data GET request
  if (path.includes('/cart-data') && request.method === 'GET') {
    console.log(`[API] GET cart data for shop: ${shopId}`);
    return new Response(JSON.stringify(SAMPLE_APP_DATA.cartData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Shop-ID': shopId,
      },
    });
  }

  // Handle milestones GET request
  if (path.includes('/milestones') && request.method === 'GET') {
    const mode = request.headers.get('X-Mode') || 'amount';
    console.log(`[API] GET milestones (${mode}) for shop: ${shopId}`);
    const milestones = mode === 'amount' ? SAMPLE_APP_DATA.milestones.amount : SAMPLE_APP_DATA.milestones.quantity;
    return new Response(JSON.stringify(milestones), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Shop-ID': shopId,
        'X-Mode': mode,
      },
    });
  }

  // Default: handle form data settings
  const formData = await request.formData();
  const settings = JSON.parse(formData.get('settings'));
  console.log(`[API] Default handler for shop: ${shopId}`, settings);
  // Sample data is updated in memory
  return new Response(JSON.stringify({ success: true }), {
    headers: { 
      'Content-Type': 'application/json',
      'X-Shop-ID': shopId,
    },
  });
}

// Endpoint to get sample data
export async function getSampleData() {
  return new Response(JSON.stringify(SAMPLE_APP_DATA), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

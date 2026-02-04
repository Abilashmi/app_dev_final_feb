/**
 * Upsell Products Service
 * Fake backend API for upsell configuration and products
 */

/**
 * Rule Types for Upsell System
 */
export const RULE_TYPES = {
  GLOBAL: 'GLOBAL',               // Show for all products (Rule 1)
  TRIGGERED: 'TRIGGERED',         // Show when specific products present (Rule 2)
  GLOBAL_EXCEPT: 'GLOBAL_EXCEPT', // Show for all except specific products (Rule 3)
};

/**
 * Rule Type Labels and Descriptions
 */
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
];

/**
 * Sample Shopify products for upsell
 * In production, these would be fetched from Shopify GraphQL API
 */
export const SAMPLE_UPSELL_PRODUCTS = [
  {
    id: 'sp-1',
    gid: 'gid://shopify/Product/8365147292',
    title: 'Premium Wireless Earbuds',
    price: 299,
    image:
      'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/earbud_400x400.jpg?v=1',
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
    image:
      'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/case_400x400.jpg?v=1',
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
    image:
      'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/cable_400x400.jpg?v=1',
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
    image:
      'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/powerbank_400x400.jpg?v=1',
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
    image:
      'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/glass_400x400.jpg?v=1',
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
    image:
      'https://cdn.shopify.com/s/files/1/0604/9635/8808/products/stand_400x400.jpg?v=1',
    description: 'Adjustable stand for any device',
    sku: 'STAND-001',
    variants: 2,
    status: 'active',
  },
];

/**
 * Default upsell configuration
 */
export const DEFAULT_UPSELL_CONFIG = {
  enabled: true,
  ruleType: RULE_TYPES.GLOBAL,
  
  // Trigger configuration (for TRIGGERED rule)
  triggerProducts: [],
  triggerCollections: [],
  
  // Upsell products to show
  upsellProducts: ['sp-1', 'sp-2'],
  upsellCollections: [],
  
  // Exclusion configuration (for GLOBAL_EXCEPT rule)
  excludedProducts: [],
  excludedCollections: [],
  
  limit: 3,
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
};

/**
 * Validate upsell rule configuration
 * @param {Object} config - Configuration to validate
 * @param {Object[]} allRules - All existing rules (for conflict checking)
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateUpsellRule(config, allRules = []) {
  console.log('🔍 VALIDATING CONFIG:', {
    enabled: config.enabled,
    ruleType: config.ruleType,
    triggerProducts: config.triggerProducts,
    upsellProducts: config.upsellProducts,
    excludedProducts: config.excludedProducts,
    limit: config.limit
  });

  // Check if both GLOBAL and GLOBAL_EXCEPT are active
  const hasGlobalRule = allRules.some(
    (rule) => rule.enabled && rule.ruleType === RULE_TYPES.GLOBAL && rule.id !== config.id
  );
  const hasGlobalExceptRule = allRules.some(
    (rule) => rule.enabled && rule.ruleType === RULE_TYPES.GLOBAL_EXCEPT && rule.id !== config.id
  );

  // Current rule type
  const currentRuleType = config.ruleType;

  // CRITICAL: Rule 1 (GLOBAL) and Rule 3 (GLOBAL_EXCEPT) cannot coexist
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

  // Validate based on rule type
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

  // Validate upsell products exist (unless disabled)
  if (config.enabled && 
    (!config.upsellProducts || config.upsellProducts.length === 0) &&
    (!config.upsellCollections || config.upsellCollections.length === 0)
  ) {
    return {
      valid: false,
      error: 'At least one upsell product or collection must be selected',
    };
  }

  // Validate limit
  if (config.limit < 1 || config.limit > 4) {
    return {
      valid: false,
      error: 'Upsell limit must be between 1 and 4',
    };
  }

  return { valid: true };
}

/**
 * Evaluate which upsell rule applies to a cart
 * Priority: TRIGGERED > GLOBAL_EXCEPT > GLOBAL
 * @param {Object[]} rules - All active rules
 * @param {string[]} cartProductIds - Product IDs currently in cart
 * @returns {Object|null} The matching rule or null
 */
export function evaluateUpsellRules(rules, cartProductIds = []) {
  if (!rules || rules.length === 0) {
    return null;
  }

  // Filter only enabled rules
  const activeRules = rules.filter((rule) => rule.enabled);

  // Priority 1: Check TRIGGERED rules first
  for (const rule of activeRules) {
    if (rule.ruleType === RULE_TYPES.TRIGGERED) {
      const triggers = [...(rule.triggerProducts || []), ...(rule.triggerCollections || [])];
      const hasMatch = triggers.some((triggerId) => cartProductIds.includes(triggerId));
      
      if (hasMatch) {
        return rule; // First matching triggered rule wins
      }
    }
  }

  // Priority 2: Check GLOBAL_EXCEPT rules
  for (const rule of activeRules) {
    if (rule.ruleType === RULE_TYPES.GLOBAL_EXCEPT) {
      const exclusions = [...(rule.excludedProducts || []), ...(rule.excludedCollections || [])];
      const hasExcluded = exclusions.some((excludedId) => cartProductIds.includes(excludedId));
      
      if (!hasExcluded) {
        return rule; // Cart doesn't contain excluded items, rule applies
      }
    }
  }

  // Priority 3: Check GLOBAL rules (fallback)
  const globalRule = activeRules.find((rule) => rule.ruleType === RULE_TYPES.GLOBAL);
  return globalRule || null;
}

/**
 * Check if a rule type can be enabled given existing rules
 * @param {string} ruleType - Rule type to check
 * @param {Object[]} existingRules - Currently enabled rules
 * @returns {Object} { canEnable: boolean, reason: string }
 */
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

  // TRIGGERED rules are always allowed
  return { canEnable: true };
}

/**
 * Get upsell configuration
 * @returns {Object} Upsell configuration
 */
export async function getUpsellConfig() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    config: DEFAULT_UPSELL_CONFIG,
    products: SAMPLE_UPSELL_PRODUCTS,
  };
}

/**
 * Save upsell configuration
 * @param {Object} config - Updated configuration
 * @returns {Object} Success response
 */
export async function saveUpsellConfig(config) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log('💾 Attempting to save config:', config);

  // Get all existing rules (simulated - in production, fetch from DB)
  const existingRules = []; // Would be fetched from database

  // Validate configuration with rule compatibility checks
  const validation = validateUpsellRule(config, existingRules);
  
  console.log('🔍 Validation result:', validation);
  
  if (!validation.valid) {
    console.error('❌ Validation failed:', validation.error);
    throw new Error(validation.error);
  }

  console.log('✅ Validation passed, saving config');

  return {
    success: true,
    message: 'Upsell configuration saved successfully',
    config,
  };
}

/**
 * Get specific product by ID
 * @param {string} productId - Product ID
 * @returns {Object} Product data
 */
export function getProductById(productId) {
  return SAMPLE_UPSELL_PRODUCTS.find((p) => p.id === productId);
}

/**
 * Get multiple products by IDs
 * @param {string[]} productIds - Array of product IDs
 * @returns {Object[]} Array of products
 */
export function getProductsByIds(productIds) {
  return productIds
    .map((id) => getProductById(id))
    .filter((p) => p !== undefined);
}

/**
 * Track analytics event
 * @param {string} event - Event name (upsell_viewed, upsell_clicked, etc.)
 * @param {Object} data - Event data
 */
export function trackUpsellEvent(event, data = {}) {
  // In production, send to analytics service (Segment, Mixpanel, etc.)
  console.log(`[Analytics] ${event}:`, {
    timestamp: new Date().toISOString(),
    ...data,
  });

  // Store in sessionStorage for demo purposes (guarded)
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

/**
 * Get all tracked events (for debugging)
 * @returns {Object[]} Array of events
 */
export function getTrackedEvents() {
  return JSON.parse(sessionStorage.getItem('upsell_events') || '[]');
}

/**
 * Clear tracked events
 */
export function clearTrackedEvents() {
  sessionStorage.removeItem('upsell_events');
}

/**
 * Mock Shopify Ajax Cart API integration
 * In production, this would use Shopify's actual cart API
 * @param {string} productGid - Shopify product GID
 * @param {number} quantity - Quantity to add
 * @returns {Object} Cart response
 */
export async function addToCartViaShopifyAPI(productGid, quantity = 1) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock response - in production use window.Shopify.cart API
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

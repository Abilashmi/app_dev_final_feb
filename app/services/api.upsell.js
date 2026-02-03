/**
 * Upsell Products Service
 * Fake backend API for upsell configuration and products
 */

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
  trigger: 'ANY_CART',
  ruleType: 'MANUAL',
  products: ['sp-1', 'sp-2'],
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

  // Validate configuration
  if (config.limit < 1 || config.limit > 4) {
    throw new Error('Upsell limit must be between 1 and 4');
  }

  if (config.products.length === 0 && config.enabled) {
    throw new Error('At least one product must be selected');
  }

  console.log('Upsell config saved:', config);

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

  // Store in sessionStorage for demo purposes
  const events = JSON.parse(sessionStorage.getItem('upsell_events') || '[]');
  events.push({
    event,
    data,
    timestamp: new Date().toISOString(),
  });
  sessionStorage.setItem('upsell_events', JSON.stringify(events));
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

// app/routes/api.cart-settings.jsx
import db from "../db.server";
import {
  COUPON_STYLES,
  COUPON_STYLE_METADATA,
  globalCouponStyle,
  sampleCoupons,
  shopifyProducts,
  mockCollections,
  getUpsellConfig,
  saveUpsellConfig,
  UPSELL_STYLES,
  UPSELL_STYLE_METADATA,
  RULE_TYPES,
  RULE_TYPE_OPTIONS,
  SAMPLE_UPSELL_PRODUCTS,
  DEFAULT_UPSELL_CONFIG,
  validateUpsellRule,
  evaluateUpsellRules,
  canEnableRuleType,
  getProductById,
  getProductsByIds,
  trackUpsellEvent,
  getTrackedEvents,
  clearTrackedEvents,
  addToCartViaShopifyAPI,
  PRODUCT_COUPON_SLIDER_STYLES,
  PRODUCT_COUPON_SLIDER_STYLE_OPTIONS,
  PRODUCT_COUPON_SLIDER_ALIGNMENTS,
  DEFAULT_PRODUCT_COUPON_SLIDER_CONFIG,
  reconstructUpsellConfig,
  SAMPLE_APP_DATA
} from "../services/api.cart-settings.shared";

export {
  COUPON_STYLES,
  COUPON_STYLE_METADATA,
  globalCouponStyle,
  sampleCoupons,
  shopifyProducts,
  mockCollections,
  getUpsellConfig,
  saveUpsellConfig,
  UPSELL_STYLES,
  UPSELL_STYLE_METADATA,
  RULE_TYPES,
  RULE_TYPE_OPTIONS,
  SAMPLE_UPSELL_PRODUCTS,
  DEFAULT_UPSELL_CONFIG,
  validateUpsellRule,
  evaluateUpsellRules,
  canEnableRuleType,
  getProductById,
  getProductsByIds,
  trackUpsellEvent,
  getTrackedEvents,
  clearTrackedEvents,
  addToCartViaShopifyAPI,
  PRODUCT_COUPON_SLIDER_STYLES,
  PRODUCT_COUPON_SLIDER_STYLE_OPTIONS,
  PRODUCT_COUPON_SLIDER_ALIGNMENTS,
  DEFAULT_PRODUCT_COUPON_SLIDER_CONFIG,
  SAMPLE_APP_DATA
};

// ==========================================
// DATABASE PERSISTENCE (SERVER-ONLY)
// ==========================================

// Helper to get or create settings
export const getSettings = async (shopId) => {
  let settings = await db.widgetSettings.findUnique({ where: { shop: shopId } });
  if (!settings) {
    settings = await db.widgetSettings.create({
      data: {
        shop: shopId,
        coupons: JSON.stringify(SAMPLE_APP_DATA.couponSliderSettings),
        fbt: JSON.stringify({ manualRules: [] }),
        progressBar: JSON.stringify(SAMPLE_APP_DATA.progressBarSettings),
        upsell: JSON.stringify(SAMPLE_APP_DATA.upsellSettings),
      }
    });
  }
  return settings;
};

// --- SAMPLE COUPONS API ENDPOINT ---
export async function loader({ request }) {
  const url = new URL(request.url);
  const shopId = request.headers.get('X-Shop-ID') || url.searchParams.get('shop') || 'demo-shop.myshopify.com';

  console.log(`[Loader] Fetching settings from Prisma for shop: ${shopId}`);

  try {
    const settings = await getSettings(shopId);
    const couponsConfig = settings.coupons ? JSON.parse(settings.coupons) : SAMPLE_APP_DATA.couponSliderSettings;
    const coupons = couponsConfig.offers || [];

    // Fetch real upsell rules from DB
    const upsellRules = await db.upsellRule.findMany({
      where: { shop: shopId },
      orderBy: { priority: 'asc' }
    });

    const reconstructedUpsell = reconstructUpsellConfig(upsellRules);

    return new Response(JSON.stringify({
      coupons,
      settings: {
        coupons: couponsConfig,
        upsell: reconstructedUpsell,
        progressBar: settings.progressBar ? JSON.parse(settings.progressBar) : SAMPLE_APP_DATA.progressBarSettings,
      },
      success: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Shop-ID': shopId,
      },
    });
  } catch (error) {
    console.error('[Loader] Error fetching settings:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// This action function is the single endpoint for saving settings
export async function action({ request }) {
  const url = new URL(request.url);
  const path = url.pathname;
  const shopId = request.headers.get('X-Shop-ID') || 'demo-shop.myshopify.com';

  // Handle upsell settings GET request
  if (path.includes('/upsell') && request.method === 'GET') {
    console.log(`[API] GET upsell settings from DB for shop: ${shopId}`);
    const settings = await getSettings(shopId);
    const upsellSettings = settings.upsell ? JSON.parse(settings.upsell) : SAMPLE_APP_DATA.upsellSettings;

    return new Response(JSON.stringify(upsellSettings), {
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
    console.log(`[API] ${request.method} upsell settings to DB for shop: ${shopId}`, body);

    // Get current settings to merge
    const current = await getSettings(shopId);
    const currentUpsell = current.upsell ? JSON.parse(current.upsell) : SAMPLE_APP_DATA.upsellSettings;
    const updatedUpsell = { ...currentUpsell, ...body };

    await db.widgetSettings.update({
      where: { shop: shopId },
      data: { upsell: JSON.stringify(updatedUpsell) }
    });

    return new Response(JSON.stringify({ success: true, data: updatedUpsell }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Shop-ID': shopId,
      },
    });
  }

  // Handle coupon style POST request
  if ((path.includes('/style') || url.searchParams.get('action') === 'save-style') && request.method === 'POST') {
    const body = await request.json();
    console.log(`[API] POST coupon style to DB for shop: ${shopId}`, body);

    const settings = await getSettings(shopId);
    const coupons = JSON.parse(settings.coupons);
    coupons.selectedStyle = body.style;

    await db.widgetSettings.update({
      where: { shop: shopId },
      data: { coupons: JSON.stringify(coupons) }
    });

    return new Response(JSON.stringify({ success: true, style: body.style }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Shop-ID': shopId,
      },
    });
  }

  // Handle progress bar settings POST request
  if (path.includes('/progress-bar') && (request.method === 'POST' || request.method === 'PUT')) {
    const body = await request.json();
    console.log(`[API] ${request.method} progress bar settings to DB for shop: ${shopId}`, body);

    const settings = await getSettings(shopId);
    let progressBar = settings.progressBar ? JSON.parse(settings.progressBar) : SAMPLE_APP_DATA.progressBarSettings;

    if (body.settings) {
      progressBar = { ...progressBar, ...body.settings };
    }

    // Update DB
    await db.widgetSettings.update({
      where: { shop: shopId },
      data: { progressBar: JSON.stringify(progressBar) }
    });

    return new Response(JSON.stringify({
      success: true,
      settings: progressBar,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Shop-ID': shopId,
      },
    });
  }

  // Handle individual coupon save POST request
  if (path.includes('/coupons') && request.method === 'POST') {
    const body = await request.json();
    console.log(`[API] POST coupon to DB for shop: ${shopId}`, body);

    const settings = await getSettings(shopId);
    const couponsConfig = settings.coupons ? JSON.parse(settings.coupons) : SAMPLE_APP_DATA.couponSliderSettings;

    if (body.allCoupons) {
      couponsConfig.offers = body.allCoupons;
    }

    await db.widgetSettings.update({
      where: { shop: shopId },
      data: { coupons: JSON.stringify(couponsConfig) }
    });

    return new Response(JSON.stringify({ success: true, data: couponsConfig }), {
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
    console.log(`[API] GET milestones (${mode}) from DB for shop: ${shopId}`);

    const settings = await getSettings();
    const progressBar = settings.progressBar ? JSON.parse(settings.progressBar) : SAMPLE_APP_DATA.progressBarSettings;
    const milestones = mode === 'amount' ? progressBar.tiers.filter(t => t.rewardType === 'product' || t.rewardType === 'shipping') : progressBar.tiers;
    // Simplified mapping for milestones

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
  try {
    const formData = await request.formData();
    const settings = JSON.parse(formData.get('settings'));
    console.log(`[API] Default handler for shop: ${shopId}`, settings);
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Shop-ID': shopId,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
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
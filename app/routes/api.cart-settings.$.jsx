// app/routes/api.cart-settings.$.jsx
import { SAMPLE_APP_DATA } from './api.cart-settings';

const jsonResponse = (data, headers = {}, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Shop-ID, X-Mode',
      ...headers,
    },
  });

const getShopId = (request) =>
  request.headers.get('X-Shop-ID') || 'gid://shopify/Shop/default';

export async function handle({ request, params }) {
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, {}, 204);
  }
}

export async function loader({ request, params }) {
  const route = params['*'] || '';
  const shopId = getShopId(request);
  
  console.log(`[API] GET request to: /api/cart-settings/${route}`);

  if (route === 'upsell') {
    console.log('[API] Returning upsell settings');
    return jsonResponse(SAMPLE_APP_DATA.upsellSettings, { 'X-Shop-ID': shopId });
  }

  if (route === 'products') {
    console.log('[API] Returning products');
    return jsonResponse(SAMPLE_APP_DATA.shopifyProducts, { 'X-Shop-ID': shopId });
  }

  if (route === 'shopify-products') {
    console.log('[API] Returning shopify products');
    return jsonResponse(SAMPLE_APP_DATA.shopifyProducts, { 'X-Shop-ID': shopId });
  }

  if (route === 'collections') {
    console.log('[API] Returning collections');
    return jsonResponse(SAMPLE_APP_DATA.mockCollections, { 'X-Shop-ID': shopId });
  }

  if (route === 'cart-data') {
    console.log('[API] Returning cart data');
    return jsonResponse(SAMPLE_APP_DATA.cartData, { 'X-Shop-ID': shopId });
  }

  if (route === 'milestones') {
    const mode = request.headers.get('X-Mode') || 'amount';
    console.log(`[API] Returning milestones (${mode})`);
    const milestones = mode === 'amount'
      ? SAMPLE_APP_DATA.milestones.amount
      : SAMPLE_APP_DATA.milestones.quantity;
    return jsonResponse(milestones, { 'X-Shop-ID': shopId, 'X-Mode': mode });
  }

  if (route === 'coupons') {
    console.log('[API] Returning coupons');
    return jsonResponse({ coupons: SAMPLE_APP_DATA.couponSliderSettings.offers }, { 'X-Shop-ID': shopId });
  }

  if (route === 'product-coupon-slider') {
    console.log('[API] Returning product coupon slider config');
    return jsonResponse(SAMPLE_APP_DATA.productCouponSlider, { 'X-Shop-ID': shopId });
  }

  console.log(`[API] 404 - Route not found: ${route}`);
  return jsonResponse({ error: 'Not Found' }, { 'X-Shop-ID': shopId }, 404);
}

export async function action({ request, params }) {
  const route = params['*'] || '';
  const shopId = getShopId(request);
  
  console.log(`[API] ${request.method} request to: /api/cart-settings/${route}`);

  if (route === 'upsell' && (request.method === 'POST' || request.method === 'PUT')) {
    const body = await request.json();
    console.log('[API] Saving upsell settings', body);
    SAMPLE_APP_DATA.upsellSettings = { ...SAMPLE_APP_DATA.upsellSettings, ...body };
    console.log('[API] ✅ Upsell settings saved successfully');
    return jsonResponse({ success: true, message: 'Upsell settings saved', data: SAMPLE_APP_DATA.upsellSettings }, { 'X-Shop-ID': shopId });
  }

  if (route === 'coupons' && request.method === 'POST') {
    const body = await request.json();
    console.log('[API] Saving coupon:', body.coupon);
    
    // Update SAMPLE_APP_DATA with new coupons
    SAMPLE_APP_DATA.couponSliderSettings.offers = body.allCoupons;
    
    return jsonResponse({ 
      success: true, 
      message: 'Coupon saved successfully',
      data: SAMPLE_APP_DATA.couponSliderSettings.offers 
    }, { 'X-Shop-ID': shopId });
  }

  if (route === 'products' && request.method === 'POST') {
    const body = await request.json();
    const productIds = body?.productIds || [];
    console.log('[API] Filtering products for IDs:', productIds);
    const products = SAMPLE_APP_DATA.shopifyProducts.filter((product) =>
      productIds.includes(product.id)
    );
    return jsonResponse(products, { 'X-Shop-ID': shopId });
  }

  if (route === 'product-coupon-slider' && request.method === 'POST') {
    const body = await request.json();
    console.log('[API] Saving product coupon slider config:', body);
    SAMPLE_APP_DATA.productCouponSlider = { ...SAMPLE_APP_DATA.productCouponSlider, ...body };
    return jsonResponse({
      success: true,
      message: 'Product coupon slider config saved',
      data: SAMPLE_APP_DATA.productCouponSlider,
    }, { 'X-Shop-ID': shopId });
  }

  console.log(`[API] 404 - Route not found: ${route}`);
  return jsonResponse({ error: 'Not Found' }, { 'X-Shop-ID': shopId }, 404);
}

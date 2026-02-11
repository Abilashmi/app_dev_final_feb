// app/services/cartSettings.server.js
import { SAMPLE_APP_DATA } from "./api.cart-settings.shared";

/**
 * IN-MEMORY DATA STORAGE
 * Initialized with sample data from shared service.
 */

let CART_SETTINGS = {
  progressBar: SAMPLE_APP_DATA.progressBarSettings,
  coupons: {
    selectedStyle: "style-2",
    position: "top",
    layout: "grid",
    alignment: "horizontal",
    enabled: SAMPLE_APP_DATA.featureStates.couponSliderEnabled,
    offers: SAMPLE_APP_DATA.couponSliderSettings.offers
  },
  upsell: {
    ...SAMPLE_APP_DATA.upsellSettings,
    enabled: SAMPLE_APP_DATA.featureStates.upsellEnabled,
    upsellMode: "manual",
    manualRules: []
  }
};

/**
 * GETTERS
 */

export function getCartSettings() {
  return {
    progressBar: CART_SETTINGS.progressBar,
    coupons: {
      selectedStyle: CART_SETTINGS.coupons.selectedStyle,
      position: CART_SETTINGS.coupons.position,
      layout: CART_SETTINGS.coupons.layout,
      alignment: CART_SETTINGS.coupons.alignment,
      enabled: CART_SETTINGS.coupons.enabled
    },
    upsell: CART_SETTINGS.upsell,
    // Include additional data for the UI
    shopifyProducts: SAMPLE_APP_DATA.shopifyProducts,
    mockCollections: SAMPLE_APP_DATA.mockCollections,
    cartData: SAMPLE_APP_DATA.cartData
  };
}

export function getCoupons() {
  return CART_SETTINGS.coupons.offers;
}

/**
 * SAVERS
 */

export function saveProgressBarSettings(data) {
  if (data.settings) {
    CART_SETTINGS.progressBar = { ...CART_SETTINGS.progressBar, ...data.settings };
  } else {
    CART_SETTINGS.progressBar = { ...CART_SETTINGS.progressBar, ...data };
  }

  if (data.enabled !== undefined) CART_SETTINGS.progressBar.enabled = data.enabled;

  return CART_SETTINGS.progressBar;
}

export function saveCouponSettings(data) {
  CART_SETTINGS.coupons = {
    ...CART_SETTINGS.coupons,
    ...data
  };
  return CART_SETTINGS.coupons;
}

export function saveCoupons(data) {
  const coupons = Array.isArray(data) ? data : (data.allCoupons || data.offers);
  if (coupons) {
    CART_SETTINGS.coupons.offers = coupons;
  }
  return CART_SETTINGS.coupons.offers;
}

export function saveUpsellSettings(data) {
  CART_SETTINGS.upsell = {
    ...CART_SETTINGS.upsell,
    ...data
  };
  return CART_SETTINGS.upsell;
}

// app/routes/api.cart-settings.jsx
import * as cartService from "../services/cartSettings.server";

/**
 * GET /api/cart-settings
 * Loads all cart configuration data.
 */
export async function loader() {
  const settings = cartService.getCartSettings();
  const coupons = cartService.getCoupons();

  return {
    success: true,
    settings,
    coupons,
    // Provide these directly if needed by the frontend mockApi
    shopifyProducts: settings.shopifyProducts,
    mockCollections: settings.mockCollections,
    cartData: settings.cartData
  };
}

/**
 * POST /api/cart-settings?action=...
 * Saves individual configuration sections.
 */
export async function action({ request }) {
  const url = new URL(request.url);
  const actionType = url.searchParams.get("action");

  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();

    switch (actionType) {
      case "progress-bar": {
        const updated = cartService.saveProgressBarSettings(body);
        return { success: true, data: updated };
      }

      case "coupon-style": {
        const updated = cartService.saveCouponSettings(body);
        return { success: true, data: updated };
      }

      case "coupons": {
        const updated = cartService.saveCoupons(body);
        return { success: true, data: updated };
      }

      case "upsell": {
        const updated = cartService.saveUpsellSettings(body);
        return { success: true, data: updated };
      }

      default:
        return Response.json(
          { success: false, error: `Invalid action: ${actionType}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API Error]", error);
    return Response.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
// app/routes/api.cart-settings.jsx
import { authenticate } from "../shopify.server";
import * as cartService from "../services/cartSettings.server";

/**
 * GET /api/cart-settings
 * Loads all cart configuration data.
 */
export async function loader({ request }) {
  const settings = cartService.getCartSettings();
  const coupons = cartService.getCoupons();
  const couponSelections = cartService.getCouponSelections();

  // Initialize with static fallback data
  let shopifyProducts = settings.shopifyProducts;
  let shopifyCollections = settings.mockCollections; // Initialize fallback

  try {
    const { admin } = await authenticate.admin(request);

    if (admin) {
      const response = await admin.graphql(
        `#graphql
        query getProducts {
          products(first: 50, sortKey: TITLE) {
            edges {
              node {
                id
                title
                status
                totalInventory
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                featuredImage {
                  url
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      price
                    }
                  }
                }
                totalVariants
              }
            }
          }
          collections(first: 50, sortKey: TITLE) {
            edges {
              node {
                id
                title
                productsCount {
                  count
                }
              }
            }
          }
        }`
      );

      const data = await response.json();

      if (data.data?.products?.edges) {
        shopifyProducts = data.data.products.edges.map(({ node }) => ({
          id: node.id,
          title: node.title,
          price: node.priceRangeV2?.minVariantPrice?.amount || "0.00",
          image: node.featuredImage?.url || "",
          variantId: node.variants?.edges?.[0]?.node?.id || "",
          variantCount: node.totalVariants || 0,
          status: (node.status || "ACTIVE").toLowerCase(),
          legacyId: node.id.split("/").pop()
        }));
      }

      if (data.data?.collections?.edges) {
        shopifyCollections = data.data.collections.edges.map(({ node }) => ({
          id: node.id,
          title: node.title,
          productCount: node.productsCount?.count || 0,
          legacyId: node.id.split("/").pop()
        }));
      }
    }
  } catch (error) {
    console.error("Failed to fetch Shopify products/collections:", error);
  }

  return {
    success: true,
    settings,
    coupons,
    couponSelections,
    shopifyProducts,
    shopifyCollections, // Now dynamic!
    mockCollections: settings.mockCollections, // Keep as fallback/unused
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

      case "coupon-selections": {
        const updated = cartService.saveCouponSelections(body);
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
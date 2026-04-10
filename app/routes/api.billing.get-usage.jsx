import { authenticate } from "../shopify.server";

/**
 * GET /api/billing/get-usage
 * Fetches today's usage and pending charges from PHP backend
 */
export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    if (!shop) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shop not found in session",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call PHP endpoint
    const phpUrl = `https://int.thecartninja.com/get-billing-history.php?shop=${encodeURIComponent(shop)}`;

    const response = await fetch(phpUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      console.error(`[Billing] PHP error: ${response.status}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch usage from PHP backend",
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    if (!data.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error || "PHP endpoint failed",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          today: data.today,
          threshold: data.threshold,
          has_overage: data.today.overage_orders > 0,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("[Billing] get-usage error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

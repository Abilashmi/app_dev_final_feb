import { authenticate } from "../shopify.server";

/**
 * GET /api/billing/charges
 * Fetches billing charge history from PHP backend
 */
export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const url = new URL(request.url);
    const days = url.searchParams.get("days") || "30";

    if (!shop) {
      return new Response(
        JSON.stringify({ success: false, error: "Shop not found" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call PHP endpoint
    const phpUrl = `https://int.thecartninja.com/get-billing-history.php?shop=${encodeURIComponent(shop)}&days=${encodeURIComponent(days)}`;

    const response = await fetch(phpUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "PHP backend error" }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    if (!data.success) {
      return new Response(
        JSON.stringify({ success: false, error: data.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          history: data.charges,
          totals: data.totals,
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
    console.error("[Billing] charges error:", error);
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

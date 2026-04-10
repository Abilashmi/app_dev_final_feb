import { authenticate } from "../shopify.server";

const PHP_URL = "https://int.thecartninja.com/update-subscription-status.php";

/**
 * Webhook: app_subscriptions/update
 * Triggered when a subscription status changes.
 * Syncs status to PHP backend so it's available for order-tracking logic.
 */
export async function action({ request }) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { shop, body } = await authenticate.webhook(request);

    if (!shop) {
      console.error("[Webhook] No shop found");
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = JSON.parse(body);
    const { id, status, name, billing_on, cancelled_on, trial_ends_on, activated_on } = payload;

    console.log(`[Webhook] app_subscriptions/update for ${shop}: status=${status}, plan=${name}`);

    // Sync to PHP backend
    await syncSubscriptionToPHP({
      shop_domain:          shop,
      subscription_id:      id,
      subscription_status:  status,
      plan_name:            name,
      trial_ends_on:        trial_ends_on  || null,
      billing_on:           billing_on     || null,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function syncSubscriptionToPHP(data) {
  try {
    const res = await fetch(PHP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    console.log("[Webhook] PHP sync:", result);
  } catch (err) {
    console.error("[Webhook] PHP sync failed:", err.message);
  }
}

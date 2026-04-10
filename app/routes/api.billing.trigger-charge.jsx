import { authenticate } from "../shopify.server";

/**
 * POST /api/billing/trigger-charge
 * 1. Calculate overage via PHP
 * 2. Get active subscription usage line item ID
 * 3. Create appUsageRecord (auto-billed in monthly invoice, no merchant approval needed)
 * 4. Update charge status in PHP
 */
export async function action({ request }) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "POST only" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;
    const today = new Date().toISOString().split("T")[0];

    if (!shop) {
      return new Response(
        JSON.stringify({ success: false, error: "Shop not found" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[Billing] Triggering usage charge for shop: ${shop}, date: ${today}`);

    // ===== STEP 1: CALCULATE OVERAGE VIA PHP =====
    const calcResponse = await fetch(
      "https://int.thecartninja.com/calculate-charges.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_domain: shop, date: today }),
      }
    );

    if (!calcResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to calculate charges via PHP" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const calcData = await calcResponse.json();
    console.log(`[Billing] Calc response:`, calcData);

    if (!calcData.success) {
      return new Response(
        JSON.stringify({ success: false, error: calcData.error || "Charge calculation failed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const chargeAmount = calcData.data.charge_amount;
    const overageOrders = calcData.data.overage_orders;

    // ===== STEP 2: GET USAGE LINE ITEM ID FROM ACTIVE SUBSCRIPTION =====
    const subResponse = await admin.graphql(`
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            status
            lineItems {
              id
              plan {
                pricingDetails {
                  __typename
                }
              }
            }
          }
        }
      }
    `);
    const subData = await subResponse.json();
    const activeSub = subData.data?.currentAppInstallation?.activeSubscriptions?.find(
      s => s.status === "ACTIVE"
    );

    if (!activeSub) {
      return new Response(
        JSON.stringify({ success: false, error: "No active subscription found for this shop" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const usageLineItem = activeSub.lineItems?.find(
      li => li.plan.pricingDetails.__typename === "AppUsagePricing"
    );

    if (!usageLineItem) {
      return new Response(
        JSON.stringify({ success: false, error: "Subscription has no usage pricing line item" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[Billing] Usage line item: ${usageLineItem.id}`);

    // ===== STEP 3: CREATE USAGE RECORD =====
    const usageResponse = await admin.graphql(
      `mutation AppUsageRecordCreate(
        $subscriptionLineItemId: ID!
        $price: MoneyInput!
        $description: String!
      ) {
        appUsageRecordCreate(
          subscriptionLineItemId: $subscriptionLineItemId
          price: $price
          description: $description
        ) {
          appUsageRecord {
            id
            createdAt
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          subscriptionLineItemId: usageLineItem.id,
          price: { amount: chargeAmount.toFixed(2), currencyCode: "USD" },
          description: `${overageOrders} overage orders × $0.10 (${today})`,
        },
      }
    );

    const usageData = await usageResponse.json();
    const userErrors = usageData.data?.appUsageRecordCreate?.userErrors;

    if (userErrors?.length > 0) {
      console.error(`[Billing] Usage record error:`, userErrors);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create usage record",
          shopify_error: userErrors[0].message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const usageRecordId = usageData.data?.appUsageRecordCreate?.appUsageRecord?.id;
    console.log(`[Billing] Usage record created: ${usageRecordId}`);

    // ===== STEP 4: UPDATE PHP CHARGE STATUS =====
    await fetch(
      "https://int.thecartninja.com/update-charge-status.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_domain: shop,
          date: today,
          status: "charged",
          shopify_charge_id: usageRecordId,
        }),
      }
    ).catch(err => console.warn(`[Billing] Failed to update PHP status: ${err.message}`));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usage charge of $${chargeAmount.toFixed(2)} recorded`,
        usage_record_id: usageRecordId,
        amount: chargeAmount,
        overage_orders: overageOrders,
        shop,
        date: today,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Billing] trigger-charge error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

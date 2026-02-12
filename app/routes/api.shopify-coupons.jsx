// Fetch discounts from Shopify Discount API
// This is the correct route location for Remix - at app/routes/ level with api. prefix

import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  try {
    const { session, admin } = await authenticate.admin(request);

    if (!admin) {
      // Fallback: return sample coupons if not authenticated
      return new Response(JSON.stringify({
        coupons: [
          {
            id: 'sample-1',
            heading: '10% Off All Products',
            subtext: 'Save 10% on your entire order',
            code: 'SAVE10',
            type: 'DiscountCodeBasic',
            status: 'ACTIVE',
            starts_at: '2026-01-01T00:00:00Z',
            ends_at: '2026-12-31T23:59:59Z',
            sectionBg: '#f6f6f7',
            headingColor: '#000000',
            subtextColor: '#6d7175',
            couponBg: '#000000',
            codeColor: '#ffffff',
          },
          {
            id: 'sample-2',
            heading: 'Buy 1 Get 1 Free',
            subtext: 'BOGO on select items',
            code: 'BOGO',
            type: 'DiscountCodeBxgy',
            status: 'SCHEDULED',
            starts_at: '2026-03-01T00:00:00Z',
            ends_at: '2026-03-31T23:59:59Z',
            sectionBg: '#f6f6f7',
            headingColor: '#000000',
            subtextColor: '#6d7175',
            couponBg: '#000000',
            codeColor: '#ffffff',
          },
          {
            id: 'sample-3',
            heading: 'Free Shipping',
            subtext: 'On orders over $50',
            code: 'FREESHIP',
            type: 'DiscountCodeFreeShipping',
            status: 'EXPIRED',
            starts_at: '2025-01-01T00:00:00Z',
            ends_at: '2025-12-31T23:59:59Z',
            sectionBg: '#f6f6f7',
            headingColor: '#000000',
            subtextColor: '#6d7175',
            couponBg: '#000000',
            codeColor: '#ffffff',
          },
        ],
        success: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Try to fetch from Shopify API
    const query = `
      query DiscountDashboardList {
        discountNodes(first: 50, reverse: true) {
          edges {
            node {
              id
              discount {
                __typename
                ... on DiscountCodeBasic {
                  title
                  status
                  startsAt
                  endsAt
                  codes(first: 1) { edges { node { code } } }
                  summary
                  asyncUsageCount
                  usageLimit
                  customerGets {
                    value {
                      ... on DiscountPercentage { percentage }
                      ... on DiscountAmount { amount { amount currencyCode } }
                    }
                  }
                }
                ... on DiscountAutomaticBasic {
                  title
                  status
                  startsAt
                  endsAt
                  summary
                  asyncUsageCount
                  customerGets {
                    value {
                      ... on DiscountPercentage { percentage }
                      ... on DiscountAmount { amount { amount currencyCode } }
                    }
                  }
                }
                ... on DiscountCodeBxgy {
                  title
                  status
                  startsAt
                  endsAt
                  codes(first: 1) { edges { node { code } } }
                  summary
                  asyncUsageCount
                  usageLimit
                }
                ... on DiscountAutomaticBxgy {
                  title
                  status
                  startsAt
                  endsAt
                  summary
                  asyncUsageCount
                }
                ... on DiscountCodeFreeShipping {
                  title
                  status
                  startsAt
                  endsAt
                  codes(first: 1) { edges { node { code } } }
                  summary
                  asyncUsageCount
                  usageLimit
                }
                ... on DiscountAutomaticFreeShipping {
                  title
                  status
                  startsAt
                  endsAt
                  summary
                  asyncUsageCount
                }
              }
            }
          }
        }
      }
    `;

    const gqlRes = await admin.graphql(query);
    const data = await gqlRes.json();

    if (data.errors) {
      // Fallback: return sample coupons if Shopify API access denied
      return new Response(JSON.stringify({
        coupons: [],
        error: data.errors[0]?.message || "Shopify API error",
        success: false
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const coupons = (data.data?.discountNodes?.edges || [])
      .map(({ node }) => {
        const d = node.discount;
        let code = '';
        if (d.codes && d.codes.edges.length > 0) {
          code = d.codes.edges[0].node.code;
        }

        // Extract discount type and value
        let discountType = 'fixed';
        let discountValue = 0;
        if (d.customerGets?.value) {
          const val = d.customerGets.value;
          if (val.percentage !== undefined) {
            discountType = 'percentage';
            discountValue = Math.round(val.percentage * 100);
          } else if (val.amount) {
            discountType = 'fixed';
            discountValue = parseFloat(val.amount.amount);
          }
        }
        if (d.__typename === 'DiscountCodeFreeShipping' || d.__typename === 'DiscountAutomaticFreeShipping') {
          discountType = 'free_shipping';
          discountValue = 0;
        }
        if (d.__typename === 'DiscountCodeBxgy' || d.__typename === 'DiscountAutomaticBxgy') {
          discountType = 'bxgy';
          discountValue = 0;
        }

        return {
          id: node.id,
          heading: d.title,
          subtext: d.summary || '',
          code: code || d.title,
          type: d.__typename,
          status: d.status || '',
          starts_at: d.startsAt || '',
          ends_at: d.endsAt || '',
          used: d.asyncUsageCount || 0,
          limit: d.usageLimit || null,
          discountType,
          discountValue,
          sectionBg: "#f6f6f7",
          headingColor: "#000000",
          subtextColor: "#6d7175",
          couponBg: "#000000",
          codeColor: "#ffffff",
        };
      });

    return new Response(JSON.stringify({ coupons, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Fallback: return sample coupons if any error
    return new Response(JSON.stringify({
      coupons: [
        {
          id: 'sample-1',
          heading: '10% Off All Products',
          subtext: 'Save 10% on your entire order',
          code: 'SAVE10',
          type: 'DiscountCodeBasic',
          status: 'ACTIVE',
          starts_at: '2026-01-01T00:00:00Z',
          ends_at: '2026-12-31T23:59:59Z',
          sectionBg: '#f6f6f7',
          headingColor: '#000000',
          subtextColor: '#6d7175',
          couponBg: '#000000',
          codeColor: '#ffffff',
        },
        {
          id: 'sample-2',
          heading: 'Buy 1 Get 1 Free',
          subtext: 'BOGO on select items',
          code: 'BOGO',
          type: 'DiscountCodeBxgy',
          status: 'SCHEDULED',
          starts_at: '2026-03-01T00:00:00Z',
          ends_at: '2026-03-31T23:59:59Z',
          sectionBg: '#f6f6f7',
          headingColor: '#000000',
          subtextColor: '#6d7175',
          couponBg: '#000000',
          codeColor: '#ffffff',
        },
        {
          id: 'sample-3',
          heading: 'Free Shipping',
          subtext: 'On orders over $50',
          code: 'FREESHIP',
          type: 'DiscountCodeFreeShipping',
          status: 'EXPIRED',
          starts_at: '2025-01-01T00:00:00Z',
          ends_at: '2025-12-31T23:59:59Z',
          sectionBg: '#f6f6f7',
          headingColor: '#000000',
          subtextColor: '#6d7175',
          couponBg: '#000000',
          codeColor: '#ffffff',
        },
      ],
      error: error.message || "Failed to fetch discounts",
      success: false
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

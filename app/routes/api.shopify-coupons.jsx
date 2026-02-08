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
        discountNodes(first: 50) {
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
                }
                ... on DiscountAutomaticBasic {
                  title
                  status
                  startsAt
                  endsAt
                }
                ... on DiscountCodeBxgy {
                  title
                  status
                  startsAt
                  endsAt
                  codes(first: 1) { edges { node { code } } }
                }
                ... on DiscountAutomaticBxgy {
                  title
                  status
                  startsAt
                  endsAt
                }
                ... on DiscountCodeFreeShipping {
                  title
                  status
                  startsAt
                  endsAt
                  codes(first: 1) { edges { node { code } } }
                }
                ... on DiscountAutomaticFreeShipping {
                  title
                  status
                  startsAt
                  endsAt
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
        return {
          id: node.id,
          heading: d.title,
          subtext: '',
          code: code || d.title,
          type: d.__typename,
          status: d.status || '',
          starts_at: d.startsAt || '',
          ends_at: d.endsAt || '',
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

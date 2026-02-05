/**
 * Upsell API Endpoints
 * GET /api/upsell - Retrieve upsell configuration
 * POST /api/upsell - Save upsell configuration
 * GET /api/upsell/products - Get available upsell products
 */

import {
  DEFAULT_UPSELL_CONFIG,
  getProductsByIds,
  validateUpsellRulesConfig,
} from './api.cart-settings';

// In-memory storage (in production, use a database)
let currentUpsellConfig = { ...DEFAULT_UPSELL_CONFIG };

const collectUpsellProductIds = (config) => {
  const ids = [
    ...(config?.rule1?.enabled ? (config.rule1.upsellProducts || []) : []),
    ...(config?.rule2?.enabled ? (config.rule2.upsellProducts || []) : []),
    ...(config?.rule3?.enabled ? (config.rule3.upsellProducts || []) : []),
  ];
  return [...new Set(ids)];
};

/**
 * GET /api/upsell
 * Retrieve current upsell configuration
 */
export async function loader({ request }) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    // Get upsell config
    const response = {
      success: true,
      data: {
        config: currentUpsellConfig,
        products: getProductsByIds(collectUpsellProductIds(currentUpsellConfig)),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  } catch (error) {
    console.error('Error in upsell loader:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to retrieve upsell configuration',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

/**
 * POST /api/upsell
 * Save upsell configuration
 */
export async function action({ request }) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();

      // Validate configuration
      const validation = validateUpsellRulesConfig(body);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: validation.error || 'Invalid upsell configuration',
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Update config (in memory)
      currentUpsellConfig = {
        ...currentUpsellConfig,
        ...body,
      };

      // Log for debugging
      console.log('[Upsell API] Configuration saved:', currentUpsellConfig);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Upsell configuration saved successfully',
          data: {
            config: currentUpsellConfig,
            products: getProductsByIds(collectUpsellProductIds(currentUpsellConfig)),
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error) {
      console.error('Error in upsell action:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to save upsell configuration',
          details: error.message,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed',
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

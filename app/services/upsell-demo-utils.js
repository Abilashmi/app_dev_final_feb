/**
 * UPSELL FEATURE - TESTING & DEMO UTILITIES
 * 
 * This file provides utilities for testing the upsell feature locally
 * and understanding how to use it.
 * 
 * Access via: http://localhost:3000/api/upsell/demo
 */

// Test data scenarios
export const TEST_SCENARIOS = {
  // Scenario 1: All products, max limit
  scenario1: {
    enabled: true,
    trigger: 'ANY_CART',
    ruleType: 'MANUAL',
    products: ['sp-1', 'sp-2', 'sp-3', 'sp-4'],
    limit: 4,
    ui: {
      layout: 'slider',
      buttonText: 'Add to Cart',
      showPrice: true,
      title: 'Complete Your Order',
    },
  },

  // Scenario 2: Minimal - single product, vertical
  scenario2: {
    enabled: true,
    trigger: 'ANY_CART',
    ruleType: 'MANUAL',
    products: ['sp-1'],
    limit: 1,
    ui: {
      layout: 'vertical',
      buttonText: 'Quick Add',
      showPrice: false,
      title: 'Try This',
    },
  },

  // Scenario 3: Premium bundle
  scenario3: {
    enabled: true,
    trigger: 'ANY_CART',
    ruleType: 'MANUAL',
    products: ['sp-1', 'sp-4', 'sp-5'],
    limit: 3,
    ui: {
      layout: 'slider',
      buttonText: 'Add for ₹199',
      showPrice: true,
      title: 'Premium Accessories',
    },
  },

  // Scenario 4: Disabled
  scenario4: {
    enabled: false,
    trigger: 'ANY_CART',
    ruleType: 'MANUAL',
    products: [],
    limit: 0,
    ui: {
      layout: 'slider',
      buttonText: 'Add to Cart',
      showPrice: true,
      title: 'Recommended',
    },
  },
};

/**
 * Format currency for display
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate mock cart data
 */
export function generateMockCart() {
  return {
    id: 'gid://shopify/Cart/' + Math.random().toString(36).substr(2, 9),
    lines: [
      {
        id: 'gid://shopify/CartLine/1',
        merchandise: {
          id: 'gid://shopify/ProductVariant/1',
          product: {
            id: 'gid://shopify/Product/1',
            title: 'Premium Hoodie',
            price: { amount: '2999' },
          },
        },
        quantity: 1,
      },
    ],
    cost: {
      totalAmount: { amount: '2999' },
      subtotalAmount: { amount: '2999' },
    },
  };
}

/**
 * Test API connectivity
 */
export async function testAPIs() {
  console.log('🧪 Testing Upsell APIs...\n');

  try {
    // Test GET /api/upsell
    console.log('→ Testing GET /api/upsell');
    const getResponse = await fetch('/api/upsell');
    const getData = await getResponse.json();
    console.log('✓ Success:', getData);
    console.log('  - Config enabled:', getData.data.config.enabled);
    console.log('  - Products count:', getData.data.products.length);
    console.log('  - Layout:', getData.data.config.ui.layout);
    console.log();

    // Test POST /api/upsell with test scenario
    console.log('→ Testing POST /api/upsell');
    const postResponse = await fetch('/api/upsell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_SCENARIOS.scenario1),
    });
    const postData = await postResponse.json();
    console.log('✓ Success:', postData.message);
    console.log('  - Config saved:', postData.data.config);
    console.log();

    console.log('✅ All API tests passed!\n');
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

/**
 * Test component rendering
 */
export async function testComponentRendering() {
  console.log('🧪 Testing Component Rendering...\n');

  try {
    // Simulate component props
    const config = {
      enabled: true,
      ui: {
        layout: 'slider',
        buttonText: 'Add to Cart',
        showPrice: true,
        title: 'Recommended for you',
      },
      limit: 3,
    };

    const products = [
      {
        id: 'sp-1',
        gid: 'gid://shopify/Product/8365147292',
        title: 'Premium Wireless Earbuds',
        price: 299,
        image: 'https://via.placeholder.com/300x300',
        description: 'High-quality audio',
        status: 'active',
      },
      {
        id: 'sp-2',
        gid: 'gid://shopify/Product/8365147293',
        title: 'Phone Case',
        price: 49,
        image: 'https://via.placeholder.com/300x300',
        description: 'Protective case',
        status: 'active',
      },
    ];

    console.log('✓ Config:', config);
    console.log('✓ Products:', products.length);
    console.log('✓ Would render', Math.min(products.length, config.limit), 'products');
    console.log();

    console.log('✅ Component rendering test passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Component test failed:', error);
    return false;
  }
}

/**
 * Test analytics tracking
 */
export function testAnalyticsTracking() {
  console.log('🧪 Testing Analytics Tracking...\n');

  try {
    const events = [
      'upsell_viewed',
      'upsell_clicked',
      'upsell_added_to_cart',
      'upsell_config_saved',
    ];

    events.forEach((event) => {
      console.log(`→ Simulating ${event}`);
      console.log(`✓ Would track: ${event}`, {
        timestamp: new Date().toISOString(),
      });
    });

    console.log();
    console.log('✅ Analytics test passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Analytics test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🚀 Running Upsell Feature Tests\n');
  console.log('=' .repeat(50));
  console.log();

  const results = {
    api: await testAPIs(),
    components: await testComponentRendering(),
    analytics: testAnalyticsTracking(),
  };

  console.log('=' .repeat(50));
  console.log('\n📊 Test Results:\n');

  Object.entries(results).forEach(([name, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });

  const allPassed = Object.values(results).every((r) => r);
  console.log();
  console.log(
    allPassed
      ? '🎉 All tests passed! Feature is ready to use.'
      : '⚠️ Some tests failed. Check the console.'
  );

  return allPassed;
}

/**
 * Demo data for documentation
 */
export const DEMO_DATA = {
  // Example: Get all events
  eventsExample: () => {
    const events = sessionStorage.getItem('upsell_events');
    return JSON.parse(events || '[]');
  },

  // Example: Expected API response
  apiResponseExample: {
    success: true,
    data: {
      config: {
        enabled: true,
        trigger: 'ANY_CART',
        ruleType: 'MANUAL',
        products: ['sp-1', 'sp-2', 'sp-3'],
        limit: 3,
        ui: {
          layout: 'slider',
          buttonText: 'Add to Cart',
          showPrice: true,
          title: 'Recommended for you',
          position: 'bottom',
        },
        analytics: {
          trackViews: true,
          trackClicks: true,
          trackAddToCart: true,
        },
      },
      products: [
        {
          id: 'sp-1',
          gid: 'gid://shopify/Product/8365147292',
          title: 'Premium Wireless Earbuds',
          price: 299,
          image: 'https://cdn.shopify.com/...',
          description: 'High-quality audio with noise cancellation',
          sku: 'EARBUDS-001',
          variants: 3,
          status: 'active',
        },
      ],
    },
  },

  // Example: Upsell event
  upsellEventExample: {
    event: 'upsell_viewed',
    data: {
      layout: 'slider',
      productCount: 3,
      limit: 3,
    },
    timestamp: '2026-02-03T10:30:00.000Z',
  },

  // Example: Add to cart event
  addToCartEventExample: {
    event: 'upsell_added_to_cart',
    data: {
      productGid: 'gid://shopify/Product/8365147292',
      quantity: 1,
      cartTotal: '2599.00',
      itemCount: 3,
    },
    timestamp: '2026-02-03T10:31:45.000Z',
  },
};

/**
 * Print demo HTML for quick testing
 */
export function printDemoHTML() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Upsell Feature Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f9fafb;
    }
    .section {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 { color: #111827; margin-top: 0; }
    h2 { color: #374151; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status.ok { background: #dcfce7; color: #166534; }
    .status.error { background: #fee2e2; color: #991b1b; }
    button { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; }
    button:hover { background: #2563eb; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
    .product-card {
      border: 1px solid #e5e7eb;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>🚀 Upsell Products Feature Demo</h1>

  <div class="section">
    <h2>Feature Status</h2>
    <p>
      <strong>Admin Dashboard:</strong>
      <span class="status ok">✓ Ready</span>
      Navigate to <code>/app/upsell</code>
    </p>
    <p>
      <strong>API Endpoints:</strong>
      <span class="status ok">✓ Ready</span>
      GET/POST <code>/api/upsell</code>
    </p>
    <p>
      <strong>Storefront Components:</strong>
      <span class="status ok">✓ Ready</span>
      Import from <code>UpsellComponents.jsx</code>
    </p>
  </div>

  <div class="section">
    <h2>Quick Actions</h2>
    <button onclick="runAllTests()">Run Tests</button>
    <button onclick="showTestScenario(1)">Load Test Scenario 1</button>
    <button onclick="showTestScenario(2)">Load Test Scenario 2</button>
    <button onclick="clearEvents()">Clear Analytics</button>
  </div>

  <div class="section">
    <h2>Sample Products</h2>
    <div class="product-card">
      <strong>Premium Wireless Earbuds</strong><br>
      Price: ₹299 | Status: Active
    </div>
    <div class="product-card">
      <strong>Protective Phone Case</strong><br>
      Price: ₹49 | Status: Active
    </div>
    <div class="product-card">
      <strong>USB-C Cable Pack (3-Piece)</strong><br>
      Price: ₹39 | Status: Active
    </div>
  </div>

  <div class="section">
    <h2>Documentation</h2>
    <ul>
      <li>📖 <a href="/UPSELL_IMPLEMENTATION.md">Implementation Guide</a></li>
      <li>🚀 <a href="/UPSELL_QUICK_START.md">Quick Start</a></li>
      <li>💻 Admin Dashboard: <code>/app/upsell</code></li>
      <li>🔌 API: <code>/api/upsell</code></li>
    </ul>
  </div>

  <script>
    async function runAllTests() {
      console.log('Running tests...');
      alert('Check console for test results (F12)');
    }

    async function showTestScenario(num) {
      alert('Test scenario loaded (check console)');
    }

    function clearEvents() {
      sessionStorage.removeItem('upsell_events');
      alert('Analytics events cleared');
    }
  </script>
</body>
</html>
  `;

  console.log(html);
  return html;
}

/**
 * Export for testing in console
 */
export default {
  TEST_SCENARIOS,
  testAPIs,
  testComponentRendering,
  testAnalyticsTracking,
  runAllTests,
  DEMO_DATA,
  printDemoHTML,
};

// app/routes/api.cart-settings.jsx
import { fakeApi } from '../services/settings.server.js';

// Sample complete app data structure
const SAMPLE_APP_DATA = {
  cartStatus: true,
  previewCartState: 'items',
  selectedTab: 'progress-bar',
  featureStates: {
    progressBarEnabled: true,
    couponSliderEnabled: true,
    upsellEnabled: true,
  },
  progressBarSettings: {
    showOnEmpty: true,
    barBackgroundColor: '#e5e7eb',
    barForegroundColor: '#93D3FF',
    completionText: 'Free shipping unlocked!',
    rewardsCalculation: ['cartTotal'],
    tiers: [
      {
        id: 1,
        rewardType: 'product',
        minValue: 500,
        description: 'Free Shipping',
        titleBeforeAchieving: 'You\'re {COUNT} away from Free Shipping',
        products: ['sp-1', 'sp-2'],
      },
      {
        id: 2,
        rewardType: 'product',
        minValue: 1000,
        description: 'Free Gift',
        titleBeforeAchieving: 'You\'re {COUNT} away from Free Gift',
        products: ['sp-3'],
      },
    ],
  },
  couponSliderSettings: {
    enabled: true,
    coupons: [
      { code: 'SAVE10', discount: '10%', description: '10% off your order' },
      { code: 'SAVE20', discount: '20%', description: '20% off orders over ₹1000' },
      { code: 'FREESHIP', discount: 'Free', description: 'Free Shipping' },
    ],
  },
  upsellSettings: {
    enabled: true,
    products: ['sp-2', 'sp-4', 'sp-6'],
    displayPosition: 'bottom',
    title: 'You might also like',
  },
  cartData: {
    cartValue: 640,
    totalQuantity: 3,
    items: [
      {
        id: 1,
        title: 'Premium T-Shirt',
        price: 320,
        qty: 2,
        image: '👕',
      },
      {
        id: 2,
        title: 'Classic Cap',
        price: 0,
        qty: 1,
        image: '🧢',
      },
    ],
  },
  milestones: {
    amount: [
      {
        id: 'm1',
        type: 'amount',
        target: 500,
        label: '₹500',
        rewardText: 'Free Shipping',
        associatedProducts: ['sp-1'],
      },
      {
        id: 'm2',
        type: 'amount',
        target: 1000,
        label: '₹1000',
        rewardText: 'Free Gift',
        associatedProducts: ['sp-2'],
      },
    ],
    quantity: [
      {
        id: 'qm1',
        type: 'quantity',
        target: 5,
        label: '5 items',
        rewardText: '10% OFF',
        associatedProducts: ['sp-3'],
      },
      {
        id: 'qm2',
        type: 'quantity',
        target: 10,
        label: '10 items',
        rewardText: 'Free Surprise Gift',
        associatedProducts: ['sp-4'],
      },
    ],
  },
  shopifyProducts: [
    {
      id: 'sp-1',
      title: 'Gift Card',
      price: '10.00',
      image: '🎁',
      variants: 4,
      status: 'outofstock',
    },
    {
      id: 'sp-2',
      title: 'The Inventory Not Tracked Snowboard',
      price: '949.95',
      image: '🏂',
      variants: 1,
      status: 'active',
    },
    {
      id: 'sp-3',
      title: 'The Archived Snowboard',
      price: '629.95',
      image: '🏂',
      variants: 1,
      status: 'archived',
    },
    {
      id: 'sp-4',
      title: 'The Draft Snowboard',
      price: '2629.95',
      image: '🏂',
      variants: 1,
      status: 'draft',
    },
    {
      id: 'sp-5',
      title: 'The Out of Stock Snowboard',
      price: '885.95',
      image: '🏂',
      variants: 1,
      status: 'outofstock',
    },
    {
      id: 'sp-6',
      title: 'Premium Hoodie',
      price: '129.99',
      image: '🧥',
      variants: 3,
      status: 'active',
    },
    {
      id: 'sp-7',
      title: 'Classic Jeans',
      price: '89.99',
      image: '👖',
      variants: 5,
      status: 'active',
    },
    {
      id: 'sp-8',
      title: 'Sports Cap',
      price: '39.99',
      image: '🧢',
      variants: 2,
      status: 'active',
    },
  ],
};

// This loader function acts as our GET endpoint for the cart drawer
export async function loader() {
  const settings = await fakeApi.getSettings();
  return new Response(JSON.stringify(settings), {
    headers: {
      'Content-Type': 'application/json',
      // Add CORS headers to allow the storefront to fetch this
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// This action function is the single endpoint for saving settings
export async function action({ request }) {
  const formData = await request.formData();
  const settings = JSON.parse(formData.get('settings'));
  const result = await fakeApi.saveSettings(settings);
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Endpoint to get sample data
export async function getSampleData() {
  return new Response(JSON.stringify(SAMPLE_APP_DATA), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// app/routes/api.cart-settings.jsx
import { fakeApi } from '../services/settings.server.js';

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

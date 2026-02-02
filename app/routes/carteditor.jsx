import React, { useState } from 'react';
import { useLoaderData, useFetcher } from 'react-router-dom';
import classNames from 'classnames';
import { fakeApi } from '../services/settings.server.js';

// The loader now gets the initial settings for the editor page
export async function loader() {
  const settings = await fakeApi.getSettings();
  return new Response(JSON.stringify(settings), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export default function CartEditor() {
  const initialSettings = useLoaderData();
  const fetcher = useFetcher();

  const [settings, setSettings] = useState(initialSettings);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    if (name.startsWith('progressBar.') || name.startsWith('couponSlider.') || name.startsWith('upsellProducts.')) {
        const [parent, child] = name.split('.');
        setSettings((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [child]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
            },
        }));
    } else if (type === 'checkbox') {
      setSettings((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      }));
    }
  };

  const handleSave = () => {
    // Point the fetcher to the centralized API route
    fetcher.submit(
      { settings: JSON.stringify(settings) },
      { method: 'post', action: '/api/cart-settings' }
    );
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cart Drawer Customizer</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">General Settings</h2>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="cartDrawerEnabled"
            className="form-checkbox h-5 w-5 text-blue-600"
            checked={settings.cartDrawerEnabled}
            onChange={handleChange}
          />
          <span className="ml-2 text-gray-700">Enable Cart Drawer</span>
        </label>
      </div>

      {settings.cartDrawerEnabled && (
        <>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Progress Bar</h2>
            <label className="flex items-center cursor-pointer mb-4">
              <input
                type="checkbox"
                name="progressBar.enabled"
                className="form-checkbox h-5 w-5 text-blue-600"
                checked={settings.progressBar.enabled}
                onChange={handleChange}
              />
              <span className="ml-2 text-gray-700">Enable Progress Bar</span>
            </label>

            {settings.progressBar.enabled && (
              <div className="pl-6 border-l-2 border-gray-200">
                <div className="mb-4">
                  <label htmlFor="progressBarGoal" className="block text-sm font-medium text-gray-700">
                    Goal
                  </label>
                  <select
                    id="progressBarGoal"
                    name="progressBar.goal"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={settings.progressBar.goal}
                    onChange={handleChange}
                  >
                    <option value="price">Price</option>
                    <option value="quantity">Quantity</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="progressBarTargetValue" className="block text-sm font-medium text-gray-700">
                    Target Value
                  </label>
                  <input
                    type="number"
                    id="progressBarTargetValue"
                    name="progressBar.targetValue"
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={settings.progressBar.targetValue}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="progressBarColor" className="block text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <input
                    type="color"
                    id="progressBarColor"
                    name="progressBar.color"
                    className="mt-1 h-10 w-24 block rounded-md border border-gray-300"
                    value={settings.progressBar.color}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Coupon Slider</h2>
            <label className="flex items-center cursor-pointer mb-4">
              <input
                type="checkbox"
                name="couponSlider.enabled"
                className="form-checkbox h-5 w-5 text-blue-600"
                checked={settings.couponSlider.enabled}
                onChange={handleChange}
              />
              <span className="ml-2 text-gray-700">Enable Coupon Slider</span>
            </label>

            {settings.couponSlider.enabled && (
              <div className="pl-6 border-l-2 border-gray-200">
                <div className="mb-4">
                  <label htmlFor="couponCodes" className="block text-sm font-medium text-gray-700">
                    Coupon Codes (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="couponCodes"
                    name="couponSlider.couponCodes"
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={Array.isArray(settings.couponSlider.couponCodes) ? settings.couponSlider.couponCodes.join(', ') : ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        couponSlider: {
                          ...prev.couponSlider,
                          couponCodes: e.target.value.split(',').map((code) => code.trim()),
                        },
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Upsell Products</h2>
            <label className="flex items-center cursor-pointer mb-4">
              <input
                type="checkbox"
                name="upsellProducts.enabled"
                className="form-checkbox h-5 w-5 text-blue-600"
                checked={settings.upsellProducts.enabled}
                onChange={handleChange}
              />
              <span className="ml-2 text-gray-700">Enable Upsell Products</span>
            </label>

            {settings.upsellProducts.enabled && (
              <div className="pl-6 border-l-2 border-gray-200">
                <div className="mb-4">
                  <label htmlFor="upsellProductReferences" className="block text-sm font-medium text-gray-700">
                    Upsell Product References (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="upsellProductReferences"
                    name="upsellProducts.productReferences"
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={Array.isArray(settings.upsellProducts.productReferences) ? settings.upsellProducts.productReferences.join(', ') : ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        upsellProducts: {
                          ...prev.upsellProducts,
                          productReferences: e.target.value.split(',').map((ref) => ref.trim()),
                        },
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <button
        onClick={handleSave}
        className={classNames(
          'px-6 py-3 rounded-md text-white font-semibold',
          fetcher.state === 'submitting'
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        )}
        disabled={fetcher.state === 'submitting'}
      >
        {fetcher.state === 'submitting' ? 'Saving...' : 'Save Settings'}
      </button>

      {fetcher.data?.success && (
        <p className="mt-4 text-green-600">
          {fetcher.data.message}
        </p>
      )}
      {fetcher.data && !fetcher.data.success && (
        <p className="mt-4 text-red-600">
          Error: {fetcher.data.message || 'Failed to save settings.'}
        </p>
      )}
    </div>
  );
}

// The action is no longer needed here as it's centralized in the API route
// export async function action({ request }) { ... }
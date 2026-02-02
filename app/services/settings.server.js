// app/services/settings.server.js

// This file acts as our single source of truth for the fake backend.
// By centralizing it here, we ensure that both the merchant-facing editor
// and the customer-facing API are reading and writing to the same in-memory store.

let inMemorySettings = {
  cartDrawerEnabled: false,
  progressBar: {
    enabled: false,
    goal: 'price',
    targetValue: 50,
    color: '#4CAF50',
  },
  couponSlider: {
    enabled: false,
    couponCodes: ['SAVE10', 'FREESHIP'],
  },
  upsellProducts: {
    enabled: false,
    productReferences: ['product-1', 'product-2'],
  },
};

export const fakeApi = {
  getSettings: async () => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Return a deep copy to prevent direct modification of the in-memory object
    return JSON.parse(JSON.stringify(inMemorySettings));
  },
  saveSettings: async (settings) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    inMemorySettings = JSON.parse(JSON.stringify(settings)); // Save a deep copy
    return { success: true, message: 'Settings saved successfully' };
  },
};

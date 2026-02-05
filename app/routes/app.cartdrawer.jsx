import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  ButtonGroup,
  ChoiceList,
  Divider,
  Badge,
  Modal,
  Checkbox,
  TextField,
  Select,
  Toast,
  Frame,
  Tabs,
  ProgressBar,
  ResourceList,
  ResourceItem,
  Thumbnail,
} from '@shopify/polaris';
import { sampleCoupons, COUPON_STYLES, COUPON_STYLE_METADATA, globalCouponStyle, saveUpsellConfig, shopifyProducts, mockCollections } from './api.cart-settings';
import { 
  getUpsellConfig, 
  evaluateUpsellRules, 
  SAMPLE_UPSELL_PRODUCTS,
  trackUpsellEvent 
} from './api.cart-settings';

// ==========================================
// MOCK API FUNCTIONS
// ==========================================

// ==========================================
// SHOP ID FROM URL QUERY PARAMETER
// ==========================================
const getShopIdFromUrl = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('shop') || urlParams.get('shopId') || 'demo-shop.myshopify.com';
  }
  return 'demo-shop.myshopify.com';
};

const SHOP_ID = getShopIdFromUrl();
console.log('[Upsell] Using shopId:', SHOP_ID);

// Mock cart data
const mockCartData = {
  cartValue: 100,
  totalQuantity: 3,
  items: [
    { id: 1, title: 'Premium Hoodie', price: 50, qty: 1 },
    { id: 2, title: 'Classic T-Shirt', price: 25, qty: 2 },
  ],
};

// Mock milestones
const mockMilestones = [
  {
    id: 'm1',
    type: 'amount',
    target: 500,
    label: '₹500',
    rewardText: 'Free Shipping',
    associatedProducts: [101],
  },
  {
    id: 'm2',
    type: 'amount',
    target: 1000,
    label: '₹1000',
    rewardText: 'Free Gift',
    associatedProducts: [102],
  },
];

// Mock quantity-based milestones
const mockQuantityMilestones = [
  {
    id: 'qm1',
    type: 'quantity',
    target: 5,
    label: '5 items',
    rewardText: '10% OFF',
    associatedProducts: [103],
  },
  {
    id: 'qm2',
    type: 'quantity',
    target: 10,
    label: '10 items',
    rewardText: 'Free Surprise Gift',
    associatedProducts: [104],
  },
];

// Mock products
const mockProducts = [
  { id: 101, title: 'Gift Box', price: 0, image: '🎁' },
  { id: 102, title: 'Premium Mug', price: 0, image: '☕' },
  { id: 103, title: '10% Discount Code', price: 0, image: '🏷️' },
  { id: 104, title: 'Surprise Mystery Gift', price: 0, image: '🎉' },
];

// Mock API functions - fetches from route endpoints
const mockApi = {
  getCartData: async () => {
    try {
      const response = await fetch('/api/cart-settings/cart-data', {
        headers: {
          'X-Shop-ID': SHOP_ID,
        },
      });
      return response.json();
    } catch {
      return mockCartData;
    }
  },
  getMilestones: async (mode = 'amount') => {
    try {
      const response = await fetch('/api/cart-settings/milestones', {
        headers: {
          'X-Shop-ID': SHOP_ID,
          'X-Mode': mode,
        },
      });
      return response.json();
    } catch {
      return mode === 'amount' ? mockMilestones : mockQuantityMilestones;
    }
  },
  getProducts: async (productIds) => {
    try {
      const response = await fetch('/api/cart-settings/products', {
        method: 'POST',
        headers: {
          'X-Shop-ID': SHOP_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      });
      return response.json();
    } catch {
      return mockProducts.filter(p => productIds.includes(p.id));
    }
  },
  getShopifyProducts: async () => {
    try {
      const response = await fetch('/api/cart-settings/shopify-products', {
        headers: {
          'X-Shop-ID': SHOP_ID,
        },
      });
      return response.json();
    } catch {
      return shopifyProducts;
    }
  },
};

// ==========================================
// UPSELL COMPONENTS - Rule Card, Product Picker, Display
// ==========================================

function RuleCard({ 
  title, 
  description, 
  ruleKey, 
  config, 
  onConfigChange,
  children 
}) {
  const isEnabled = config[ruleKey]?.enabled || false;

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">
              {title}
            </Text>
            <Text as="p" tone="subdued" variant="bodySmall">
              {description}
            </Text>
          </BlockStack>
          <Checkbox
            label="Enable"
            checked={isEnabled}
            onChange={(value) =>
              onConfigChange({
                ...config,
                [ruleKey]: { ...config[ruleKey], enabled: value },
              })
            }
          />
        </InlineStack>

        {isEnabled && (
          <>
            <Divider />
            {children}
          </>
        )}
      </BlockStack>
    </Card>
  );
}

function ProductPicker({
  label,
  selected,
  onChange,
  maxSelect = null,
  showCount = true,
}) {
  const selectedProducts = selected
    .map((id) => SAMPLE_UPSELL_PRODUCTS.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  return (
    <BlockStack gap="200">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="p" fontWeight="semibold">
          {label}
        </Text>
        {showCount && (
          <Badge>
            {selected.length}
            {maxSelect ? ` / ${maxSelect}` : ''}
          </Badge>
        )}
      </InlineStack>

      <BlockStack gap="150">
        {SAMPLE_UPSELL_PRODUCTS.map((product) => (
          <div
            key={product.id}
            style={{
              padding: '12px',
              border: selected.includes(product.id)
                ? '2px solid #0070f3'
                : '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: selected.includes(product.id)
                ? '#f0f7ff'
                : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => {
              if (selected.includes(product.id)) {
                onChange(selected.filter((id) => id !== product.id));
              } else {
                if (maxSelect === null || selected.length < maxSelect) {
                  onChange([...selected, product.id]);
                }
              }
            }}
          >
            <InlineStack gap="200" align="center">
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Text tone="subdued" variant="bodySm">
                    No Image
                  </Text>
                )}
              </div>
              <BlockStack gap="050" style={{ flex: 1 }}>
                <Text fontWeight="semibold" variant="bodySm">
                  {product.title}
                </Text>
                <Text tone="subdued" variant="bodySm">
                  ₹{product.price}
                </Text>
              </BlockStack>
              {selected.includes(product.id) && (
                <Text as="span" tone="success">
                  ✓
                </Text>
              )}
            </InlineStack>
          </div>
        ))}
      </BlockStack>
    </BlockStack>
  );
}

function SelectedProductsDisplay({ productIds, label }) {
  const selectedProducts = productIds
    .map((id) => SAMPLE_UPSELL_PRODUCTS.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  if (selectedProducts.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          textAlign: 'center',
        }}
      >
        <Text tone="subdued">{label}: No products selected</Text>
      </div>
    );
  }

  return (
    <BlockStack gap="200">
      <Text as="p" fontWeight="semibold">
        {label}:
      </Text>
      <BlockStack gap="100">
        {selectedProducts.map((product) => (
          <div
            key={product.id}
            style={{
              padding: '12px',
              backgroundColor: '#f0f7ff',
              border: '1px solid #0070f3',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <InlineStack gap="200" align="center">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#e5eeff',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Text tone="subdued" variant="bodySm">
                    No Image
                  </Text>
                )}
              </div>
              <BlockStack gap="050">
                <Text fontWeight="semibold" variant="bodySm">
                  {product.title}
                </Text>
                <Text tone="subdued" variant="bodySm">
                  ₹{product.price}
                </Text>
              </BlockStack>
            </InlineStack>
            <Badge>{product.sku}</Badge>
          </div>
        ))}
      </BlockStack>
    </BlockStack>
  );
}

// ==========================================
// PROGRESS CALCULATION FUNCTIONS
// ==========================================

const calculateProgress = (currentValue, targetValue) => {
  if (targetValue === 0) return 0;
  return Math.min((currentValue / targetValue) * 100, 100);
};

const getActiveMilestone = (currentValue, milestones, mode = 'amount') => {
  const value = mode === 'amount' ? currentValue : currentValue;
  const completed = milestones.filter(m => m.target <= value);
  const upcoming = milestones.find(m => m.target > value);
  
  return {
    completed,
    upcoming,
    nextAmount: upcoming ? upcoming.target - value : 0,
  };
};


export default function CartDrawerAdmin() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  // Global cart status
  const [cartStatus, setCartStatus] = useState(true); // true = active, false = inactive

  // Deactivate modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Preview state (what the right panel shows)
  const [previewCartState, setPreviewCartState] = useState(['items']); // 'empty' | 'items'

  // Selected feature tab
  const [selectedTab, setSelectedTab] = useState('progress-bar'); // 'progress-bar' | 'coupon' | 'upsell'

  // Feature enable states
  const [featureStates, setFeatureStates] = useState({
    progressBarEnabled: true,
    couponSliderEnabled: false,
    upsellEnabled: false,
  });

  // Progress Bar Editor State
  const [progressBarSettings, setProgressBarSettings] = useState({
    showOnEmpty: true,
    barBackgroundColor: '#E2E2E2',
    barForegroundColor: '#93D3FF',
    completionText: 'Free shipping unlocked!',
    rewardsCalculation: ['cartTotal'], // 'cartTotal' or 'cartQuantity'
    tiers: [
      {
        id: 1,
        rewardType: 'product',
        minValue: 50,
        description: 'Cool Product',
        titleBeforeAchieving: "You're {COUNT} away from product ____",
        products: [],
      },
    ],
  });

  const [activeTierIndex, setActiveTierIndex] = useState(0);

  // Progress Bar Calculation State
  const [cartData, setCartData] = useState(mockCartData);
  const [milestones, setMilestones] = useState([]);
  const [progressMode, setProgressMode] = useState('amount'); // 'amount' or 'quantity'
  const [selectedMilestoneProduct, setSelectedMilestoneProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [currentTierForProducts, setCurrentTierForProducts] = useState(null);
  const [loadedShopifyProducts, setLoadedShopifyProducts] = useState([]);

  // ==========================================
  // COUPON EDITOR STATE
  // ==========================================
  const [selectedCouponStyle, setSelectedCouponStyle] = useState(COUPON_STYLES.STYLE_2);
  const [allCoupons, setAllCoupons] = useState([]);
  const [activeCouponTab, setActiveCouponTab] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [originalCoupon, setOriginalCoupon] = useState(null);
  const [appliedCouponIds, setAppliedCouponIds] = useState([]);
  const [couponSubTab, setCouponSubTab] = useState('global-style'); // 'global-style' or 'manage-coupons'
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [saveToastMessage, setSaveToastMessage] = useState('Saved');
  const [isSaving, setIsSaving] = useState(false);
  const couponSliderRef = React.useRef(null);
  
  // Coupon Display Settings
  const [couponPosition, setCouponPosition] = useState('top'); // 'top' or 'bottom'
  const [couponLayout, setCouponLayout] = useState('grid'); // 'grid' or 'carousel'
  const [couponAlignment, setCouponAlignment] = useState('horizontal'); // 'horizontal' or 'vertical'

  // ==========================================
  // UPSELL EDITOR STATE (RULE 1/2/3 CONFIG)
  // ==========================================
  const [upsellConfig, setUpsellConfig] = useState({
    rule1: {
      enabled: true,
      upsellProducts: ['sp-1', 'sp-2'],
    },
    rule2: {
      enabled: false,
      triggerProducts: [],
      upsellProducts: [],
    },
    rule3: {
      enabled: false,
      cartValueThreshold: 1000,
      upsellProducts: [],
    },
  });
  const [initialUpsellConfig, setInitialUpsellConfig] = useState(null);
  const [upsellSaving, setUpsellSaving] = useState(false);
  const [upsellRulesConfig, setUpsellRulesConfig] = useState({
    rule1: {
      enabled: true,
      upsellProducts: ['sp-1', 'sp-2'],
    },
    rule2: {
      enabled: false,
      triggerProducts: [],
      upsellProducts: [],
    },
    rule3: {
      enabled: false,
      cartValueThreshold: 1000,
      upsellProducts: [],
    },
  });
  const [carouselScrollPosition, setCarouselScrollPosition] = useState(0);
  const carouselRef = React.useRef(null);
  const [showTriggeredProductsModal, setShowTriggeredProductsModal] = useState(false);
  const [showUpsellProductsModal, setShowUpsellProductsModal] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState('products'); // 'products' or 'collections'
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [showOnlySelectedCollections, setShowOnlySelectedCollections] = useState(false);
  const [excludeArchived, setExcludeArchived] = useState(true);
  const [excludeDraft, setExcludeDraft] = useState(true);
  const [excludeOutOfStock, setExcludeOutOfStock] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // ==========================================
  // MANUAL UPSELL STATE
  // ==========================================
  const [useAIUpsells, setUseAIUpsells] = useState(false);
  const [manualUpsellRules, setManualUpsellRules] = useState([]);
  const [initialManualUpsellRules, setInitialManualUpsellRules] = useState([]);
  const [showManualUpsellBuilder, setShowManualUpsellBuilder] = useState(false);
  const [showProductPickerModal, setShowProductPickerModal] = useState(false);
  const [productPickerMode, setProductPickerMode] = useState(null); // 'trigger' | 'upsell'
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [tempSelectedProductIds, setTempSelectedProductIds] = useState([]);
  const [tempSelectedCollectionIds, setTempSelectedCollectionIds] = useState([]);

  // ==========================================
  // LOAD UPSELL DATA FROM API
  // ==========================================
  useEffect(() => {
    async function loadUpsellData() {
      try {
        const response = await getUpsellConfig();
        console.log('✅ Upsell config loaded:', response);

        if (response?.config) {
          setUpsellRulesConfig(response.config);
          setUpsellConfig(response.config);
          setInitialUpsellConfig(response.config);
        }
        
        // Display data in console for verification
        if (response.products && response.products.length > 0) {
          console.log(`✨ Loaded ${response.products.length} upsell products:`, 
            response.products.map(p => `${p.title} (₹${p.price})`).join(', ')
          );
        }
      } catch (error) {
        console.error('❌ Error loading upsell config:', error);
      }
    }
    
    loadUpsellData();
  }, []);

  // Mock cart items for preview
  const mockCartItems = [
    { id: 1, productId: 'sp-6', name: 'Premium Mug Set', price: 15.99, quantity: 1, image: 'https://via.placeholder.com/80' },
    { id: 2, productId: 'sp-2', name: 'The Inventory Not Tracked Snowboard', price: 949.95, quantity: 1, image: 'https://via.placeholder.com/80' },
  ];

  const cartTotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // ==========================================
  // HANDLERS
  // ==========================================

  const toggleFeature = (feature) => {
    setFeatureStates(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const handleDeactivateClick = () => {
    if (cartStatus) {
      // If currently active, show confirmation modal
      setShowDeactivateModal(true);
    } else {
      // If currently inactive, just activate it
      setCartStatus(true);
    }
  };

  const handleConfirmDeactivate = () => {
    setCartStatus(false);
    setShowDeactivateModal(false);
  };

  const handleCancelDeactivate = () => {
    setShowDeactivateModal(false);
  };

  // Progress Bar Editor Handlers
  const updateProgressBarSetting = (key, value) => {
    setProgressBarSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateTierSetting = (tierIndex, key, value) => {
    setProgressBarSettings(prev => ({
      ...prev,
      tiers: prev.tiers.map((tier, idx) =>
        idx === tierIndex ? { ...tier, [key]: value } : tier
      ),
    }));
  };

  const addTier = () => {
    const newTier = {
      id: progressBarSettings.tiers.length + 1,
      rewardType: 'product',
      minValue: progressBarSettings.rewardsCalculation[0] === 'cartTotal' ? 100 : 10,
      description: '',
      titleBeforeAchieving: "You're {COUNT} away from ____",
      products: [],
    };
    setProgressBarSettings(prev => ({
      ...prev,
      tiers: [...prev.tiers, newTier],
    }));
    setActiveTierIndex(progressBarSettings.tiers.length);
  };

  const removeTier = (tierIndex) => {
    if (progressBarSettings.tiers.length === 1) return; // Keep at least one tier
    
    setProgressBarSettings(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, idx) => idx !== tierIndex),
    }));
    
    if (activeTierIndex >= tierIndex && activeTierIndex > 0) {
      setActiveTierIndex(activeTierIndex - 1);
    }
  };

  // Progress Bar Calculation Handlers
  React.useEffect(() => {
    const loadMilestones = async () => {
      const mode = progressMode === 'amount' ? 'amount' : 'quantity';
      const data = await mockApi.getMilestones(mode);
      setMilestones(data);
    };
    loadMilestones();
  }, [progressMode]);

  // Load Shopify Products
  React.useEffect(() => {
    const loadShopifyProducts = async () => {
      const products = await mockApi.getShopifyProducts();
      setLoadedShopifyProducts(products);
    };
    loadShopifyProducts();
  }, []);

  React.useEffect(() => {
    if (!featureStates.couponSliderEnabled && appliedCouponIds.length > 0) {
      setAppliedCouponIds([]);
    }
  }, [featureStates.couponSliderEnabled, appliedCouponIds.length]);

  // Load Sample Coupons
  React.useEffect(() => {
    const coupons = JSON.parse(JSON.stringify(sampleCoupons));
    setAllCoupons(coupons);
    if (coupons.length > 0) {
      setActiveCouponTab(coupons[0].id);
      setEditingCoupon(JSON.parse(JSON.stringify(coupons[0])));
      setOriginalCoupon(JSON.parse(JSON.stringify(coupons[0])));
    }
  }, []);

  const handleAddToCart = async (product) => {
    // Update mock cart data
    setCartData(prev => ({
      ...prev,
      cartValue: prev.cartValue + product.price,
      totalQuantity: prev.totalQuantity + 1,
      items: [...prev.items, { ...product, qty: 1 }],
    }));
    setShowProductModal(false);
  };

  const handleMilestoneProductClick = async (productIds) => {
    const products = await mockApi.getProducts(productIds);
    setSelectedMilestoneProduct(products);
    setShowProductModal(true);
  };

  const handleOpenProductPicker = (tierIndex) => {
    setCurrentTierForProducts(tierIndex);
    setSelectedProductIds(progressBarSettings.tiers[tierIndex].products || []);
    setShowProductPicker(true);
  };

  const handleSaveSelectedProducts = () => {
    if (currentTierForProducts !== null && currentTierForProducts !== 'upsell' && typeof currentTierForProducts === 'number') {
      // Saving for progress bar tier
      updateTierSetting(currentTierForProducts, 'products', selectedProductIds);
    } else if (currentUpsellRule !== null) {
      // Saving for manual upsell rules
      if (upsellPickerMode === 'trigger') {
        handleUpdateUpsellRule(currentUpsellRule, { triggerProductIds: selectedProductIds });
      } else if (upsellPickerMode === 'upsell') {
        handleUpdateUpsellRule(currentUpsellRule, { upsellProductIds: selectedProductIds });
      }
    }
    setShowProductPicker(false);
    setCurrentTierForProducts(null);
    setCurrentUpsellRule(null);
    setUpsellPickerMode(null);
    setSelectedProductIds([]);
    setProductSearchQuery('');
  };

  const handleSaveSelectedCollections = () => {
    if (currentUpsellRule !== null) {
      handleUpdateUpsellRule(currentUpsellRule, { triggerCollectionIds: selectedCollectionIds });
    }
    setShowCollectionPicker(false);
    setCurrentUpsellRule(null);
    setSelectedCollectionIds([]);
    setCollectionSearchQuery('');
    setShowOnlySelectedCollections(false);
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleCollectionSelection = (collectionId) => {
    setSelectedCollectionIds(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const filteredProducts = (loadedShopifyProducts.length > 0 ? loadedShopifyProducts : shopifyProducts).filter(product => {
    const matchesQuery = product.title.toLowerCase().includes(productSearchQuery.toLowerCase());
    const isArchived = product.status === 'archived';
    const isDraft = product.status === 'draft';
    const isOutOfStock = product.status === 'outofstock';

    if (excludeArchived && isArchived) return false;
    if (excludeDraft && isDraft) return false;
    if (excludeOutOfStock && isOutOfStock) return false;
    if (showOnlySelected && !selectedProductIds.includes(product.id)) return false;

    return matchesQuery;
  });

  const filteredCollections = mockCollections.filter(collection => {
    const matchesQuery = collection.title.toLowerCase().includes(collectionSearchQuery.toLowerCase());
    if (showOnlySelectedCollections && !selectedCollectionIds.includes(collection.id)) return false;
    return matchesQuery;
  });

  // ==========================================
  // COUPON EDITOR HANDLERS
  // ==========================================
  const handleStyleSelect = (style) => {
    setSelectedCouponStyle(style);
  };

  const handleCouponTabClick = (couponId) => {
    const coupon = allCoupons.find(c => c.id === couponId);
    if (coupon) {
      setActiveCouponTab(couponId);
      setEditingCoupon(JSON.parse(JSON.stringify(coupon)));
      setOriginalCoupon(JSON.parse(JSON.stringify(coupon)));
    }
  };

  const handleToggleCouponEnabled = (checked) => {
    if (editingCoupon) {
      setEditingCoupon({ ...editingCoupon, enabled: checked });
    }
  };

  const updateCouponField = (path, value) => {
    if (!editingCoupon) return;
    
    const updateNestedField = (obj, keys, val) => {
      const lastKey = keys.pop();
      const target = keys.reduce((o, k) => o[k], obj);
      target[lastKey] = val;
    };

    const keys = path.split('.');
    const updatedCoupon = JSON.parse(JSON.stringify(editingCoupon));
    updateNestedField(updatedCoupon, keys, value);
    setEditingCoupon(updatedCoupon);
    
    // Also update in allCoupons immediately for live preview
    setAllCoupons(prev => prev.map(c => 
      c.id === updatedCoupon.id ? JSON.parse(JSON.stringify(updatedCoupon)) : c
    ));
  };

  const handleSaveCoupon = async () => {
    if (editingCoupon) {
      setIsSaving(true);
      console.log('[Coupon] Save initiated for coupon:', editingCoupon.id);

      // Update in allCoupons state
      const updated = allCoupons.map(c =>
        c.id === editingCoupon.id ? JSON.parse(JSON.stringify(editingCoupon)) : c
      );
      setAllCoupons(updated);
      
      // Save to API route
      try {
        console.log('[Coupon] Sending POST to /api/cart-settings/coupons');
        const response = await fetch('/api/cart-settings/coupons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shop-ID': SHOP_ID,
          },
          body: JSON.stringify({
            coupon: editingCoupon,
            allCoupons: updated,
          }),
        });

        console.log('[Coupon] Response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to save coupon: ${response.status}`);
        }

        const result = await response.json();
        console.log('[Coupon] Saved successfully:', result);
      } catch (error) {
        console.error('[Coupon] Save error:', error);
      }

      setOriginalCoupon(JSON.parse(JSON.stringify(editingCoupon)));

      const messageByTab = {
        'progress-bar': 'Progress bar saved',
        coupon: 'Coupon saved',
        upsell: 'Upsell saved',
      };

      await new Promise(resolve => setTimeout(resolve, 600));
      setSaveToastMessage(messageByTab[selectedTab] || 'Saved');
      setShowSaveToast(true);
      setIsSaving(false);
    }
  };

  const handleCancelCoupon = () => {
    if (originalCoupon) {
      setEditingCoupon(JSON.parse(JSON.stringify(originalCoupon)));
    }
  };

  const handleCopyCouponCode = (code, couponId) => {
    if (!featureStates.couponSliderEnabled) return;
    const coupon = allCoupons.find(c => c.id === couponId);
    if (!coupon || !coupon.enabled) return;
    // Only allow one coupon at a time
    setAppliedCouponIds(prev => 
      prev.includes(couponId) 
        ? [] // Remove if already applied
        : [couponId] // Replace any existing coupon with this one
    );
  };

  // Calculate discount for a specific coupon
  const calculateCouponDiscount = (coupon, subtotal) => {
    if (coupon.discountType === 'percentage') {
      return (subtotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      return Math.min(coupon.discountValue, subtotal);
    }
    return 0;
  };

  // Calculate total discount from all applied coupons
  const calculateTotalDiscount = () => {
    if (!featureStates.couponSliderEnabled) return 0;
    return appliedCouponIds.reduce((total, couponId) => {
      const coupon = allCoupons.find(c => c.id === couponId);
      if (coupon) {
        return total + calculateCouponDiscount(coupon, cartTotal);
      }
      return total;
    }, 0);
  };

  const totalDiscount = calculateTotalDiscount();
  const finalTotal = Math.max(0, cartTotal - totalDiscount);

  const handleScrollCoupons = (direction) => {
    if (couponSliderRef.current) {
      const scrollAmount = 290; // Slightly more than card width (280px + gap)
      couponSliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'outofstock':
        return <Badge tone="warning">Out of Stock</Badge>;
      case 'archived':
        return <Badge tone="subdued">ARCHIVED</Badge>;
      case 'draft':
        return <Badge tone="info">DRAFT</Badge>;
      default:
        return null;
    }
  };

  // ==========================================
  // UPSELL HANDLERS - RULE1/RULE2/RULE3 CONFIG
  // ==========================================

  // ==========================================
  // UPSELL RULES (RULE 1/2/3) HANDLERS
  // ==========================================
  const getUpsellValidationError = () => {
    if (!upsellConfig) return '';

    const enabledRules = [
      upsellConfig.rule1?.enabled,
      upsellConfig.rule2?.enabled,
      upsellConfig.rule3?.enabled,
    ].filter(Boolean).length;

    if (enabledRules === 0) {
      return 'Please enable at least one rule';
    }

    if (upsellConfig.rule1?.enabled && (!upsellConfig.rule1?.upsellProducts || upsellConfig.rule1.upsellProducts.length === 0)) {
      return 'Rule #1: Select at least one upsell product';
    }

    if (upsellConfig.rule2?.enabled) {
      if (!upsellConfig.rule2?.triggerProducts || upsellConfig.rule2.triggerProducts.length === 0) {
        return 'Rule #2: Select at least one trigger product';
      }
      if (!upsellConfig.rule2?.upsellProducts || upsellConfig.rule2.upsellProducts.length === 0) {
        return 'Rule #2: Select at least one upsell product';
      }
    }

    if (upsellConfig.rule3?.enabled) {
      if (!upsellConfig.rule3?.cartValueThreshold || upsellConfig.rule3.cartValueThreshold <= 0) {
        return 'Rule #3: Set a valid cart value threshold';
      }
      if (!upsellConfig.rule3?.upsellProducts || upsellConfig.rule3.upsellProducts.length === 0) {
        return 'Rule #3: Select at least one upsell product';
      }
    }

    return '';
  };

  const isUpsellConfigDirty = JSON.stringify(upsellConfig) !== JSON.stringify(initialUpsellConfig);

  const handleSaveUpsellRules = async () => {
    const error = getUpsellValidationError();
    if (error) {
      setSaveToastMessage(error);
      setShowSaveToast(true);
      return;
    }

    setUpsellSaving(true);
    try {
      // Prepare config with manual upsell rules
      const configToSave = {
        enabled: upsellConfig.enabled,
        upsellTitle: upsellConfig.upsellTitle,
        position: upsellConfig.position,
        layout: upsellConfig.layout,
        alignment: upsellConfig.alignment,
        showOnEmptyCart: upsellConfig.showOnEmptyCart,
        upsellMode: upsellConfig.upsellMode,
        useAI: upsellConfig.upsellMode === 'ai',
        manualRules: manualUpsellRules,
      };
      
      console.log('[Upsell] Saving upsell rules via API');
      
      // Save to API route
      const response = await fetch('/api/cart-settings/upsell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shop-ID': SHOP_ID,
        },
        body: JSON.stringify(configToSave),
      });

      console.log('[Upsell] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to save upsell rules: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Upsell rules saved:', result);
      setInitialUpsellConfig(upsellConfig);
      setSaveToastMessage('✅ Upsell rules saved successfully');
      setShowSaveToast(true);
      
      try {
        trackUpsellEvent('upsell_config_saved', {
          enabled: configToSave.enabled,
          mode: configToSave.upsellMode,
          rulesCount: manualUpsellRules.length,
        });
      } catch (trackingError) {
        console.warn('Analytics tracking failed:', trackingError);
      }
    } catch (error) {
      console.error('❌ Error saving upsell rules:', error);
      setSaveToastMessage(error.message || 'Failed to save upsell rules');
      setShowSaveToast(true);
    } finally {
      setUpsellSaving(false);
    }
  };

  const handleCancelUpsellRules = () => {
    setUpsellConfig(initialUpsellConfig);
    setSaveToastMessage('Changes discarded');
  };

  // ==========================================
  // MANUAL UPSELL HANDLERS
  // ==========================================

  const generateUpsellRuleId = () => `rule-${Date.now()}-${Math.random()}`;

  const addManualUpsellRule = () => {
    const newRule = {
      id: generateUpsellRuleId(),
      triggerType: 'all', // 'all' | 'specific'
      triggerProductIds: [],
      triggerCollectionIds: [],
      upsellProductIds: [],
    };
    setManualUpsellRules([...manualUpsellRules, newRule]);
  };

  const removeManualUpsellRule = (ruleId) => {
    setManualUpsellRules(manualUpsellRules.filter(r => r.id !== ruleId));
  };

  const updateManualUpsellRule = (ruleId, updates) => {
    setManualUpsellRules(
      manualUpsellRules.map(r => r.id === ruleId ? { ...r, ...updates } : r)
    );
  };

  const reorderManualUpsellRules = (fromIdx, toIdx) => {
    const newRules = [...manualUpsellRules];
    const [movedRule] = newRules.splice(fromIdx, 1);
    newRules.splice(toIdx, 0, movedRule);
    setManualUpsellRules(newRules);
  };

  const openProductPicker = (ruleId, mode) => {
    setEditingRuleId(ruleId);
    setProductPickerMode(mode);
    const rule = manualUpsellRules.find(r => r.id === ruleId);
    if (mode === 'trigger') {
      setTempSelectedProductIds(rule?.triggerProductIds || []);
      setTempSelectedCollectionIds(rule?.triggerCollectionIds || []);
    } else {
      setTempSelectedProductIds(rule?.upsellProductIds || []);
    }
    setShowProductPickerModal(true);
  };

  const saveProductPickerSelection = () => {
    const rule = manualUpsellRules.find(r => r.id === editingRuleId);
    if (!rule) return;

    if (productPickerMode === 'trigger') {
      updateManualUpsellRule(editingRuleId, {
        triggerProductIds: tempSelectedProductIds,
        triggerCollectionIds: tempSelectedCollectionIds,
      });
    } else {
      updateManualUpsellRule(editingRuleId, {
        upsellProductIds: tempSelectedProductIds,
      });
    }
    
    setShowProductPickerModal(false);
    setEditingRuleId(null);
    setProductPickerMode(null);
    setTempSelectedProductIds([]);
    setTempSelectedCollectionIds([]);
  };

  const saveManualUpsellRules = async () => {
    // Validate rules
    if (manualUpsellRules.length === 0) {
      setSaveToastMessage('Add at least one upsell rule');
      setShowSaveToast(true);
      return;
    }

    const allValid = manualUpsellRules.every(rule => {
      const hasTrigger = rule.triggerType === 'all' || 
                        rule.triggerProductIds.length > 0 || 
                        rule.triggerCollectionIds.length > 0;
      const hasUpsell = rule.upsellProductIds.length > 0;
      return hasTrigger && hasUpsell;
    });

    if (!allValid) {
      setSaveToastMessage('Each rule must have trigger and upsell products');
      setShowSaveToast(true);
      return;
    }

    setUpsellSaving(true);
    try {
      // saveUpsellConfig is now called via API fetch
      const shopId = SHOP_ID;
      const configData = {
        useAI: useAIUpsells,
        manualRules: manualUpsellRules,
      };
      
      const response = await saveUpsellConfig(shopId, configData);
      console.log('✅ Manual upsell rules saved:', response);
      
      setInitialManualUpsellRules(JSON.parse(JSON.stringify(manualUpsellRules)));
      setSaveToastMessage('✅ Upsell rules saved successfully');
      setShowSaveToast(true);
      setShowManualUpsellBuilder(false);
    } catch (error) {
      console.error('❌ Error saving upsell rules:', error);
      setSaveToastMessage(error.message || 'Failed to save upsell rules');
      setShowSaveToast(true);
    } finally {
      setUpsellSaving(false);
    }
  };

  const cancelManualUpsellRules = () => {
    setManualUpsellRules(JSON.parse(JSON.stringify(initialManualUpsellRules)));
    setSaveToastMessage('Changes discarded');
    setShowSaveToast(true);
    setShowManualUpsellBuilder(false);
  };

  const getTriggerSummary = (rule) => {
    if (rule.triggerType === 'all') {
      return 'Any product';
    }
    const productCount = rule.triggerProductIds.length;
    const collectionCount = rule.triggerCollectionIds.length;
    const parts = [];
    if (productCount > 0) parts.push(`${productCount} product${productCount !== 1 ? 's' : ''}`);
    if (collectionCount > 0) parts.push(`${collectionCount} collection${collectionCount !== 1 ? 's' : ''}`);
    return parts.join(' + ') || 'Select trigger';
  };

  const getUpsellSummary = (rule) => {
    const count = rule.upsellProductIds.length;
    return count > 0 ? `${count} product${count !== 1 ? 's' : ''}` : 'Select products';
  };

  // ==========================================
  // RENDER LEFT SIDEBAR
  // ==========================================

  const renderLeftSidebar = () => {
    return (
      <div style={{ width: '280px', borderRight: '1px solid #e5e7eb', height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '16px' }}>
          <BlockStack gap="400">
            {/* Section 1: Cart Status */}
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">Cart Status</Text>
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="span">Status</Text>
                  <Badge tone={cartStatus ? 'success' : 'critical'}>
                    {cartStatus ? 'Active' : 'Inactive'}
                  </Badge>
                </InlineStack>
                <Button
                  onClick={handleDeactivateClick}
                  variant={cartStatus ? 'primary' : 'secondary'}
                  fullWidth
                >
                  {cartStatus ? 'Deactivate' : 'Activate'}
                </Button>
              </BlockStack>
            </Card>

            <Divider />

            {/* Section 2: Preview State */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Cart Preview</Text>
                <ChoiceList
                  title=""
                  choices={[
                    { label: 'Show items in cart', value: 'items' },
                    { label: 'Show empty cart', value: 'empty' },
                  ]}
                  selected={previewCartState}
                  onChange={setPreviewCartState}
                />
              </BlockStack>
            </Card>

            <Divider />

            {/* Section 3: Feature Tabs */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Features</Text>
                <ButtonGroup variant="segmented" fullWidth>
                  <Button
                    pressed={selectedTab === 'progress-bar'}
                    onClick={() => setSelectedTab('progress-bar')}
                  >
                    Progress Bar
                  </Button>
                </ButtonGroup>
                <ButtonGroup variant="segmented" fullWidth>
                  <Button
                    pressed={selectedTab === 'coupon'}
                    onClick={() => setSelectedTab('coupon')}
                  >
                    Coupon Slider
                  </Button>
                </ButtonGroup>
                <ButtonGroup variant="segmented" fullWidth>
                  <Button
                    pressed={selectedTab === 'upsell'}
                    onClick={() => setSelectedTab('upsell')}
                  >
                    Upsell Products
                  </Button>
                </ButtonGroup>
              </BlockStack>
            </Card>
          </BlockStack>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER MIDDLE PANEL CONTENT
  // ==========================================

  const renderEditorPanel = () => {
    // Progress Bar Editor
    if (selectedTab === 'progress-bar') {
      const activeTier = progressBarSettings.tiers[activeTierIndex];
      const isCartTotal = progressBarSettings.rewardsCalculation[0] === 'cartTotal';

      // Prepare tabs for tiers
      const tierTabs = progressBarSettings.tiers.map((tier, index) => ({
        id: `tier-${index}`,
        content: `Tier ${index + 1}`,
        panelID: `tier-panel-${index}`,
      }));

      // Calculate current progress based on mode
      const currentValue = progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity;
      const highestMilestone = milestones.length > 0 ? milestones[milestones.length - 1].target : 1000;
      const progressPercent = calculateProgress(currentValue, highestMilestone);
      const milestone = getActiveMilestone(currentValue, milestones, progressMode);

      return (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingLg" as="h1">Progress Bar Settings</Text>
              <Button
                variant={featureStates.progressBarEnabled ? 'primary' : 'secondary'}
                onClick={() => toggleFeature('progressBarEnabled')}
              >
                {featureStates.progressBarEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </InlineStack>

            {/* SECTION 1: General Settings */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">General settings</Text>
                
                <Checkbox
                  label="Show reward like the progress bar on empty cart"
                  checked={progressBarSettings.showOnEmpty}
                  onChange={(value) => updateProgressBarSetting('showOnEmpty', value)}
                />

                <BlockStack gap="200">
                  <TextField
                    label="Bar background color"
                    value={progressBarSettings.barBackgroundColor}
                    onChange={(value) => updateProgressBarSetting('barBackgroundColor', value)}
                    type="text"
                    autoComplete="off"
                    connectedRight={
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        backgroundColor: progressBarSettings.barBackgroundColor, 
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                      }} />
                    }
                  />
                </BlockStack>

                <BlockStack gap="200">
                  <TextField
                    label="Bar foreground color"
                    value={progressBarSettings.barForegroundColor}
                    onChange={(value) => updateProgressBarSetting('barForegroundColor', value)}
                    type="text"
                    autoComplete="off"
                    connectedRight={
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        backgroundColor: progressBarSettings.barForegroundColor, 
                        border: '1px solid #c9cccf',
                        borderRadius: '4px',
                      }} />
                    }
                  />
                </BlockStack>

                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Text after completing full rewards bar
                    </Text>
                    <Button
                      plain
                      onClick={() => updateProgressBarSetting('completionText', '')}
                    >
                      Clear
                    </Button>
                  </InlineStack>
                  <TextField
                    value={progressBarSettings.completionText}
                    onChange={(value) => updateProgressBarSetting('completionText', value)}
                    multiline={3}
                    autoComplete="off"
                  />
                </BlockStack>
              </BlockStack>
            </Card>

            {/* SECTION 2: Progress Mode Selection */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Progress calculation mode</Text>
                
                <ChoiceList
                  title=""
                  choices={[
                    {
                      label: 'Cart Value Based',
                      value: 'amount',
                      helpText: 'Progress tracked by cart total (₹)',
                    },
                    {
                      label: 'Cart Quantity Based',
                      value: 'quantity',
                      helpText: 'Progress tracked by item count (#)',
                    },
                  ]}
                  selected={[progressMode]}
                  onChange={(value) => setProgressMode(value[0])}
                />
              </BlockStack>
            </Card>

            {/* SECTION 3: Active Milestones Display */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Active milestones</Text>
                
                {milestones.length > 0 ? (
                  <BlockStack gap="200">
                    {milestones.map((ms, idx) => (
                      <InlineStack gap="200" blockAlign="center" key={ms.id}>
                        <Badge tone={milestone.completed.some(c => c.id === ms.id) ? 'success' : 'info'}>
                          {ms.label}
                        </Badge>
                        <Text as="span" variant="bodyMd">{ms.rewardText}</Text>
                        {ms.associatedProducts.length > 0 && (
                          <Button
                            plain
                            size="slim"
                            onClick={() => handleMilestoneProductClick(ms.associatedProducts)}
                          >
                            View Reward
                          </Button>
                        )}
                      </InlineStack>
                    ))}
                  </BlockStack>
                ) : (
                  <Text as="p" tone="subdued">No milestones configured</Text>
                )}
              </BlockStack>
            </Card>

            {/* SECTION 4: Current Progress */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Current progress</Text>
                
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {progressMode === 'amount' ? `₹${currentValue}` : `${currentValue} items`} / {progressMode === 'amount' ? `₹${highestMilestone}` : `${highestMilestone} items`}
                    </Text>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">{Math.round(progressPercent)}%</Text>
                  </InlineStack>
                  
                  <ProgressBar progress={progressPercent} />

                  {milestone.upcoming && (
                    <Text as="p" tone="subdued">
                      {progressMode === 'amount' 
                        ? `You're ₹${milestone.nextAmount} away from ${milestone.upcoming.rewardText}` 
                        : `You need ${milestone.nextAmount} more item${milestone.nextAmount !== 1 ? 's' : ''} for ${milestone.upcoming.rewardText}`}
                    </Text>
                  )}

                  {milestone.completed.length > 0 && milestone.upcoming === undefined && (
                    <Text as="p" tone="success" fontWeight="semibold">
                      🎉 {progressBarSettings.completionText}
                    </Text>
                  )}
                </BlockStack>
              </BlockStack>
            </Card>

            {/* SECTION 5: Tier Settings */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd" as="h2">Tiers — Add or remove rewards</Text>
                  <Button
                    onClick={addTier}
                    variant="primary"
                    size="slim"
                  >
                    + Add tier
                  </Button>
                </InlineStack>

                {/* Tier Tabs */}
                <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '0' }}>
                  {progressBarSettings.tiers.map((tier, idx) => (
                    <button
                      key={tier.id}
                      onClick={() => setActiveTierIndex(idx)}
                      style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: activeTierIndex === idx ? '600' : '500',
                        color: activeTierIndex === idx ? '#000' : '#6b7280',
                        backgroundColor: activeTierIndex === idx ? '#fff' : 'transparent',
                        border: 'none',
                        borderBottom: activeTierIndex === idx ? '2px solid #000' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Tier {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Active Tier Content */}
                {activeTier && (
                  <BlockStack gap="300">
                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="label" variant="bodyMd" fontWeight="semibold">
                          Minimum spending
                        </Text>
                      </InlineStack>
                      <TextField
                        type="number"
                        value={activeTier.minValue}
                        onChange={(value) => updateTierSetting(activeTierIndex, 'minValue', Number(value))}
                        prefix={progressMode === 'amount' ? '₹' : '#'}
                        autoComplete="off"
                      />
                    </BlockStack>

                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="label" variant="bodyMd" fontWeight="semibold">
                          Reward description
                        </Text>
                        <Button
                          plain
                          size="slim"
                          onClick={() => updateTierSetting(activeTierIndex, 'description', '')}
                        >
                          Clear
                        </Button>
                      </InlineStack>
                      <TextField
                        value={activeTier.description}
                        onChange={(value) => updateTierSetting(activeTierIndex, 'description', value)}
                        placeholder="e.g., Free Shipping"
                        autoComplete="off"
                      />
                    </BlockStack>

                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="label" variant="bodyMd" fontWeight="semibold">
                          Products — {activeTier.products?.length || 0} of {(loadedShopifyProducts.length > 0 ? loadedShopifyProducts : shopifyProducts).length} products added
                        </Text>
                        <Button
                          onClick={() => handleOpenProductPicker(activeTierIndex)}
                          variant="secondary"
                          size="slim"
                        >
                          + Add product
                        </Button>
                      </InlineStack>
                      
                      {activeTier.products && activeTier.products.length > 0 ? (
                        <BlockStack gap="150">
                          {activeTier.products.map(productId => {
                            const product = (loadedShopifyProducts.length > 0 ? loadedShopifyProducts : shopifyProducts).find(p => p.id === productId);
                            return product ? (
                              <div
                                key={productId}
                                style={{
                                  padding: '12px',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '6px',
                                  border: '1px solid #e5e7eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '16px' }}>{product.image}</span>
                                    <Text variant="bodyMd" fontWeight="semibold">{product.title}</Text>
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      ${product.price}
                                    </Text>
                                    <Badge tone="success">
                                      🎁 {activeTier.description} Reward
                                    </Badge>
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      {product.variants} variants
                                    </Text>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    updateTierSetting(
                                      activeTierIndex,
                                      'products',
                                      activeTier.products.filter(id => id !== productId)
                                    );
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    fontSize: '20px',
                                    padding: '4px 8px',
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ) : null;
                          })}
                        </BlockStack>
                      ) : (
                        <Text as="p" tone="subdued" variant="bodySm">
                          No products selected. Click "Add product" to select reward products for this tier.
                        </Text>
                      )}
                    </BlockStack>

                    {progressBarSettings.tiers.length > 1 && (
                      <Button
                        onClick={() => removeTier(activeTierIndex)}
                        variant="tertiary"
                        tone="critical"
                        fullWidth
                      >
                        Delete Tier
                      </Button>
                    )}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </div>
      );
    }

    // Coupon Slider Editor
    if (selectedTab === 'coupon') {
      return (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingLg" as="h1">Coupon Slider Settings</Text>
              <Button
                variant={featureStates.couponSliderEnabled ? 'primary' : 'secondary'}
                onClick={() => toggleFeature('couponSliderEnabled')}
              >
                {featureStates.couponSliderEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </InlineStack>

            {/* Tab Navigation */}
            <div style={{ 
              display: 'flex', 
              gap: '4px',
              borderBottom: '2px solid #e5e7eb',
              marginBottom: '16px',
            }}>
              <button
                onClick={() => setCouponSubTab('global-style')}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: couponSubTab === 'global-style' ? '3px solid #2c6ecb' : '3px solid transparent',
                  color: couponSubTab === 'global-style' ? '#2c6ecb' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-2px',
                }}
              >
                Coupon Styles
              </button>
              <button
                onClick={() => setCouponSubTab('manage-coupons')}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: couponSubTab === 'manage-coupons' ? '3px solid #2c6ecb' : '3px solid transparent',
                  color: couponSubTab === 'manage-coupons' ? '#2c6ecb' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-2px',
                }}
              >
                Manage Coupons
              </button>
            </div>

            {/* TAB 1: Coupon Styles */}
            {couponSubTab === 'global-style' && (
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">Select Coupon Style</Text>
                    <Text tone="subdued" as="p">Choose one style that applies to all coupons</Text>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      {Object.entries(COUPON_STYLE_METADATA).map(([styleKey, metadata]) => (
                        <div
                          key={styleKey}
                          onClick={() => handleStyleSelect(styleKey)}
                          style={{
                            border: `2px solid ${selectedCouponStyle === styleKey ? '#2c6ecb' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: selectedCouponStyle === styleKey ? '#f0f7ff' : '#fff',
                            transition: 'all 0.2s',
                          }}
                        >
                          <BlockStack gap="200">
                            <img 
                              src={metadata.previewImage} 
                            alt={metadata.name}
                            style={{ width: '100%', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                          />
                          <InlineStack align="space-between" blockAlign="center">
                            <BlockStack gap="100">
                              <Text variant="bodyMd" fontWeight="semibold">{metadata.name}</Text>
                              <Text variant="bodySm" tone="subdued">{metadata.description}</Text>
                            </BlockStack>
                            {selectedCouponStyle === styleKey && (
                              <div style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                backgroundColor: '#2c6ecb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 'bold',
                              }}>
                                ✓
                              </div>
                            )}
                          </InlineStack>
                        </BlockStack>
                      </div>
                    ))}
                    </div>
                  </BlockStack>
                </Card>

                {/* Display Settings Card */}
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">Display Settings</Text>
                    <Text tone="subdued" as="p">Configure how coupons appear in your cart</Text>

                    {/* Position in Cart */}
                    <BlockStack gap="200">
                      <Text variant="bodyMd" fontWeight="semibold">Position in Cart</Text>
                      <InlineStack gap="200">
                        <Checkbox
                          label="Top of cart"
                          checked={couponPosition === 'top'}
                          onChange={() => setCouponPosition('top')}
                        />
                        <Checkbox
                          label="Bottom of cart"
                          checked={couponPosition === 'bottom'}
                          onChange={() => setCouponPosition('bottom')}
                        />
                      </InlineStack>
                    </BlockStack>

                    {/* Layout */}
                    <BlockStack gap="200">
                      <Text variant="bodyMd" fontWeight="semibold">Layout</Text>
                      <InlineStack gap="200">
                        <Checkbox
                          label="Grid (2 columns)"
                          checked={couponLayout === 'grid'}
                          onChange={() => setCouponLayout('grid')}
                        />
                        <Checkbox
                          label="Carousel"
                          checked={couponLayout === 'carousel'}
                          onChange={() => setCouponLayout('carousel')}
                        />
                      </InlineStack>
                    </BlockStack>

                    {/* Alignment */}
                    <BlockStack gap="200">
                      <Text variant="bodyMd" fontWeight="semibold">Alignment</Text>
                      <InlineStack gap="200">
                        <Checkbox
                          label="Horizontal"
                          checked={couponAlignment === 'horizontal'}
                          onChange={() => setCouponAlignment('horizontal')}
                        />
                        <Checkbox
                          label="Vertical"
                          checked={couponAlignment === 'vertical'}
                          onChange={() => setCouponAlignment('vertical')}
                        />
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Card>
              </BlockStack>
            )}

            {/* TAB 2: Manage Coupons */}
            {couponSubTab === 'manage-coupons' && (
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text variant="headingMd" as="h2">Enable/Disable Coupons</Text>
                      <Text tone="subdued" as="p">Select which coupons to show in the slider</Text>
                    </BlockStack>

                    {/* Coupon List with Enable/Disable */}
                    <BlockStack gap="200">
                      {allCoupons.map(coupon => (
                        <div 
                          key={coupon.id}
                          onClick={() => handleCouponTabClick(coupon.id)}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: activeCouponTab === coupon.id ? '#f0f7ff' : '#f9fafb',
                            border: `1px solid ${activeCouponTab === coupon.id ? '#2c6ecb' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                          }}
                        >
                          <InlineStack align="space-between" blockAlign="center" gap="200">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '20px' }}>{coupon.iconUrl}</span>
                              <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="semibold" truncate>{coupon.code}</Text>
                                <Text variant="bodySm" tone="subdued" truncate>{coupon.label}</Text>
                              </BlockStack>
                            </div>
                            <Checkbox
                              checked={coupon.enabled}
                              onChange={(checked) => {
                                const updated = allCoupons.map(c =>
                                  c.id === coupon.id ? { ...c, enabled: checked } : c
                                );
                                setAllCoupons(updated);
                                const idx = sampleCoupons.findIndex(c => c.id === coupon.id);
                                if (idx !== -1) sampleCoupons[idx].enabled = checked;
                                if (editingCoupon && editingCoupon.id === coupon.id) {
                                  setEditingCoupon({ ...editingCoupon, enabled: checked });
                                }
                              }}
                            />
                          </InlineStack>
                        </div>
                      ))}
                    </BlockStack>

                    <Divider />

                    {/* Coupon Editor */}
                    {editingCoupon ? (
                      <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <BlockStack gap="400">
                          <InlineStack align="space-between" blockAlign="center">
                            <BlockStack gap="100">
                              <Text variant="headingSm" as="h3">Edit: {editingCoupon.code}</Text>
                              <Text tone="subdued" variant="bodySm">Configure display and discount settings</Text>
                            </BlockStack>
                          </InlineStack>

                          <Divider />
                  
                          {/* Compact Single Column Layout */}
                          <BlockStack gap="300">
                            <InlineStack gap="300" blockAlign="start">
                              <div style={{ flex: 1 }}>
                                <TextField
                                  label="Coupon Code"
                                  value={editingCoupon.code}
                                  disabled
                                  autoComplete="off"
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <TextField
                                  label="Label Text"
                                  value={editingCoupon.label}
                                  onChange={(value) => updateCouponField('label', value)}
                                  autoComplete="off"
                                />
                              </div>
                            </InlineStack>

                            <TextField
                              label="Description"
                              value={editingCoupon.description}
                              onChange={(value) => updateCouponField('description', value)}
                              autoComplete="off"
                            />

                            <InlineStack gap="300">
                              <div style={{ flex: 1 }}>
                                <Select
                                  label="Discount Type"
                                  options={[
                                    { label: 'Percentage Off', value: 'percentage' },
                                    { label: 'Fixed Amount Off', value: 'fixed' },
                                  ]}
                                  value={editingCoupon.discountType || 'percentage'}
                                  onChange={(value) => updateCouponField('discountType', value)}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <TextField
                                  label="Discount Value"
                                  type="number"
                                  value={String(editingCoupon.discountValue || 0)}
                                  onChange={(value) => updateCouponField('discountValue', Number(value))}
                                  autoComplete="off"
                                  suffix={editingCoupon.discountType === 'percentage' ? '%' : '₹'}
                                />
                              </div>
                            </InlineStack>

                            <TextField
                              label="Expiry Date (Optional)"
                              type="date"
                              value={editingCoupon.expiryDate || ''}
                              onChange={(value) => updateCouponField('expiryDate', value)}
                          autoComplete="off"
                          helpText="Leave empty for no expiry"
                        />

                        <Divider />
                        <Text variant="headingSm" as="h4">Appearance</Text>

                        <InlineStack gap="300">
                          <div style={{ flex: 1 }}>
                            <TextField
                              label="Background Color"
                              value={editingCoupon.backgroundColor}
                              onChange={(value) => updateCouponField('backgroundColor', value)}
                              type="text"
                              autoComplete="off"
                              connectedRight={
                                <div style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  backgroundColor: editingCoupon.backgroundColor, 
                                  border: '1px solid #c9cccf',
                                  borderRadius: '4px',
                                }} />
                              }
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <TextField
                              label="Text Color"
                              value={editingCoupon.textColor}
                              onChange={(value) => updateCouponField('textColor', value)}
                              type="text"
                              autoComplete="off"
                              connectedRight={
                                <div style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  backgroundColor: editingCoupon.textColor, 
                                  border: '1px solid #c9cccf',
                                  borderRadius: '4px',
                                }} />
                              }
                            />
                          </div>
                        </InlineStack>

                        <InlineStack gap="300">
                          <div style={{ flex: 1 }}>
                            <TextField
                              label="Icon (emoji)"
                              value={editingCoupon.iconUrl}
                              onChange={(value) => updateCouponField('iconUrl', value)}
                              autoComplete="off"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <TextField
                              label="Border Radius"
                              type="number"
                              value={String(editingCoupon.borderRadius)}
                              onChange={(value) => updateCouponField('borderRadius', Number(value))}
                              autoComplete="off"
                              suffix="px"
                            />
                          </div>
                        </InlineStack>

                        <Divider />
                        <Text variant="headingSm" as="h4">Button Settings</Text>

                        <TextField
                          label="Button Text"
                          value={editingCoupon.button.text}
                          onChange={(value) => updateCouponField('button.text', value)}
                          autoComplete="off"
                        />

                        <InlineStack gap="300">
                          <div style={{ flex: 1 }}>
                            <TextField
                              label="Button Background"
                              value={editingCoupon.button.backgroundColor}
                              onChange={(value) => updateCouponField('button.backgroundColor', value)}
                              type="text"
                              autoComplete="off"
                              connectedRight={
                                <div style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  backgroundColor: editingCoupon.button.backgroundColor, 
                                  border: '1px solid #c9cccf',
                                  borderRadius: '4px',
                                }} />
                              }
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <TextField
                              label="Button Text Color"
                              value={editingCoupon.button.textColor}
                              onChange={(value) => updateCouponField('button.textColor', value)}
                              type="text"
                              autoComplete="off"
                              connectedRight={
                                <div style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  backgroundColor: editingCoupon.button.textColor, 
                                  border: '1px solid #c9cccf',
                                  borderRadius: '4px',
                                }} />
                              }
                            />
                          </div>
                        </InlineStack>

                      {/* Save/Cancel Actions */}
                        <Divider />
                        <InlineStack align="end" gap="200">
                          <Button onClick={handleCancelCoupon} disabled={isSaving}>Cancel</Button>
                          <Button variant="primary" onClick={handleSaveCoupon} loading={isSaving} disabled={isSaving}>Save Changes</Button>
                        </InlineStack>
                      </BlockStack>
                    </BlockStack>
                    </div>
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>👈 Select a coupon to edit</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Click on a coupon above to edit its settings</p>
                  </div>
                )}
              </BlockStack>
            </Card>
            </BlockStack>
            )}
          </BlockStack>
        </div>
      );
    }

    // Upsell Rules Editor - Manual Upsell Builder
    if (selectedTab === 'upsell') {
      const validationError = getUpsellValidationError();
      
      return (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
          <BlockStack gap="400">
            {/* Header */}
            <BlockStack gap="100">
              <Text variant="headingLg" as="h1">Upsell Rules</Text>
              <Text variant="bodySm" tone="subdued">Recommend products to customers based on cart contents</Text>
            </BlockStack>

            {/* Main Enable/Disable Section */}
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="050">
                    <Text variant="headingSm">Enable Upsell</Text>
                    <Text variant="bodySm" tone="subdued">Show product recommendations in cart</Text>
                  </BlockStack>
                  <Checkbox
                    checked={upsellConfig.enabled}
                    onChange={(checked) => setUpsellConfig({ ...upsellConfig, enabled: checked })}
                  />
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Settings (only show if enabled) */}
            {upsellConfig.enabled && (
              <>
                {/* Title & Formatting */}
                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingSm">Upsell Title</Text>
                    <TextField
                      label="Title text"
                      value={upsellConfig.upsellTitle?.text || 'Recommended for you'}
                      onChange={(value) =>
                        setUpsellConfig({
                          ...upsellConfig,
                          upsellTitle: { ...upsellConfig.upsellTitle, text: value },
                        })
                      }
                      placeholder="e.g., Recommended for you"
                    />
                    
                    {/* Text Formatting Buttons */}
                    <BlockStack gap="100">
                      <Text variant="bodySm" fontWeight="semibold">Formatting</Text>
                      <InlineStack gap="100">
                        <Button
                          onClick={() =>
                            setUpsellConfig({
                              ...upsellConfig,
                              upsellTitle: {
                                ...upsellConfig.upsellTitle,
                                formatting: {
                                  ...upsellConfig.upsellTitle?.formatting,
                                  bold: !upsellConfig.upsellTitle?.formatting?.bold,
                                },
                              },
                            })
                          }
                          variant={upsellConfig.upsellTitle?.formatting?.bold ? 'primary' : 'secondary'}
                          size="slim"
                        >
                          <strong>B</strong>
                        </Button>
                        <Button
                          onClick={() =>
                            setUpsellConfig({
                              ...upsellConfig,
                              upsellTitle: {
                                ...upsellConfig.upsellTitle,
                                formatting: {
                                  ...upsellConfig.upsellTitle?.formatting,
                                  italic: !upsellConfig.upsellTitle?.formatting?.italic,
                                },
                              },
                            })
                          }
                          variant={upsellConfig.upsellTitle?.formatting?.italic ? 'primary' : 'secondary'}
                          size="slim"
                        >
                          <em>I</em>
                        </Button>
                        <Button
                          onClick={() =>
                            setUpsellConfig({
                              ...upsellConfig,
                              upsellTitle: {
                                ...upsellConfig.upsellTitle,
                                formatting: {
                                  ...upsellConfig.upsellTitle?.formatting,
                                  underline: !upsellConfig.upsellTitle?.formatting?.underline,
                                },
                              },
                            })
                          }
                          variant={upsellConfig.upsellTitle?.formatting?.underline ? 'primary' : 'secondary'}
                          size="slim"
                        >
                          <u>U</u>
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Card>

                {/* Position & Alignment */}
                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingSm">Display Settings</Text>
                    
                    <BlockStack gap="150">
                      <BlockStack gap="050">
                        <Text variant="bodySm" fontWeight="semibold">Position in Cart</Text>
                        <InlineStack gap="200">
                          <Checkbox
                            label="Top of cart"
                            checked={upsellConfig.position === 'top'}
                            onChange={() => setUpsellConfig({ ...upsellConfig, position: 'top' })}
                          />
                          <Checkbox
                            label="Bottom of cart"
                            checked={upsellConfig.position === 'bottom'}
                            onChange={() => setUpsellConfig({ ...upsellConfig, position: 'bottom' })}
                          />
                        </InlineStack>
                      </BlockStack>

                      <BlockStack gap="050">
                        <Text variant="bodySm" fontWeight="semibold">Layout</Text>
                        <InlineStack gap="200">
                          <Checkbox
                            label="Grid (2 columns)"
                            checked={upsellConfig.layout === 'grid'}
                            onChange={() => setUpsellConfig({ ...upsellConfig, layout: 'grid' })}
                          />
                          <Checkbox
                            label="Carousel"
                            checked={upsellConfig.layout === 'carousel'}
                            onChange={() => setUpsellConfig({ ...upsellConfig, layout: 'carousel' })}
                          />
                        </InlineStack>
                      </BlockStack>

                      <BlockStack gap="050">
                        <Text variant="bodySm" fontWeight="semibold">Alignment</Text>
                        <InlineStack gap="200">
                          <Checkbox
                            label="Horizontal"
                            checked={upsellConfig.alignment === 'horizontal'}
                            onChange={() => setUpsellConfig({ ...upsellConfig, alignment: 'horizontal' })}
                          />
                          <Checkbox
                            label="Vertical"
                            checked={upsellConfig.alignment === 'vertical'}
                            onChange={() => setUpsellConfig({ ...upsellConfig, alignment: 'vertical' })}
                          />
                        </InlineStack>
                      </BlockStack>
                    </BlockStack>
                  </BlockStack>
                </Card>

                {/* Upsell Rules Section */}
                <Card>
                  <BlockStack gap="200">
                    <BlockStack gap="050">
                      <Text variant="headingSm">Upsell Rules</Text>
                      <Text variant="bodySm" tone="subdued">Configure which products to recommend</Text>
                    </BlockStack>

                    {/* Manual Rules */}
                    <BlockStack gap="150">
                      <BlockStack gap="100">
                        <Checkbox
                          label="Use manual rules"
                          checked={upsellConfig.upsellMode === 'manual'}
                          onChange={() =>
                            setUpsellConfig({
                              ...upsellConfig,
                              upsellMode: upsellConfig.upsellMode === 'manual' ? 'ai' : 'manual',
                            })
                          }
                        />
                        {upsellConfig.upsellMode === 'manual' && (
                          <Button
                            onClick={() => {
                              setInitialManualUpsellRules(JSON.parse(JSON.stringify(manualUpsellRules)));
                              setShowManualUpsellBuilder(true);
                            }}
                            variant="secondary"
                            fullWidth
                          >
                            {manualUpsellRules.length === 0
                              ? '+ Add Rule'
                              : `Edit Rules (${manualUpsellRules.length})`}
                          </Button>
                        )}
                      </BlockStack>

                      <BlockStack gap="100">
                        <Checkbox
                          label="Use AI recommendations"
                          checked={upsellConfig.upsellMode === 'ai'}
                          onChange={() =>
                            setUpsellConfig({
                              ...upsellConfig,
                              upsellMode: upsellConfig.upsellMode === 'ai' ? 'manual' : 'ai',
                            })
                          }
                        />
                        {upsellConfig.upsellMode === 'ai' && (
                          <Text variant="bodySm" tone="subdued">AI will analyze cart and suggest relevant products</Text>
                        )}
                      </BlockStack>
                    </BlockStack>
                  </BlockStack>
                </Card>

                {/* Show on Empty Cart */}
                <Card>
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="050">
                        <Text variant="headingSm">Show on Empty Cart</Text>
                        <Text variant="bodySm" tone="subdued">Display recommendations even if cart is empty</Text>
                      </BlockStack>
                      <Checkbox
                        checked={upsellConfig.showOnEmptyCart}
                        onChange={(checked) =>
                          setUpsellConfig({ ...upsellConfig, showOnEmptyCart: checked })
                        }
                      />
                    </InlineStack>
                  </BlockStack>
                </Card>

                {/* Active Rules Summary */}
                {manualUpsellRules.length > 0 && upsellConfig.upsellMode === 'manual' && (
                  <Card tone="info">
                    <BlockStack gap="200">
                      <Text variant="headingSm">Active Rules ({manualUpsellRules.length})</Text>
                      {manualUpsellRules.map((rule, idx) => (
                        <BlockStack key={rule.id} gap="100">
                          <InlineStack align="space-between" blockAlign="center">
                            <BlockStack gap="050">
                              <Text variant="bodySm" fontWeight="semibold">Rule #{idx + 1}</Text>
                              <Text variant="bodySm" tone="subdued">
                                {getTriggerSummary(rule)} → {getUpsellSummary(rule)}
                              </Text>
                            </BlockStack>
                            <Button
                              variant="plain"
                              tone="critical"
                              size="slim"
                              onClick={() => removeManualUpsellRule(rule.id)}
                            >
                              ✕
                            </Button>
                          </InlineStack>
                        </BlockStack>
                      ))}
                    </BlockStack>
                  </Card>
                )}

                {/* Validation Error */}
                {validationError && (
                  <Card tone="critical">
                    <BlockStack gap="100">
                      <Text variant="bodyMd" fontWeight="semibold">⚠️ Configuration Error</Text>
                      <Text variant="bodySm">{validationError}</Text>
                    </BlockStack>
                  </Card>
                )}

                {/* Save Buttons */}
                <Card>
                  <InlineStack gap="200">
                    <Button
                      variant="primary"
                      onClick={handleSaveUpsellRules}
                      loading={upsellSaving}
                      fullWidth
                    >
                      Save Settings
                    </Button>
                    <Button onClick={handleCancelUpsellRules} fullWidth>
                      Cancel
                    </Button>
                  </InlineStack>
                </Card>
              </>
            )}
          </BlockStack>
        </div>
      );
    }

    return null;
  };



  // ==========================================
  // RENDER CART PREVIEW
  // ==========================================

  const renderCartPreview = () => {
    const showEmpty = previewCartState[0] === 'empty';
    const cartProductIds = mockCartItems.map(item => item.productId).filter(Boolean);
    const cartCollectionIds = cartProductIds.flatMap((productId) => {
      const product = (loadedShopifyProducts.length > 0 ? loadedShopifyProducts : shopifyProducts).find(p => p.id === productId);
      return product?.collections || [];
    });


    return (
      <div style={{ position: 'relative', height: '100%', overflow: 'hidden', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        {/* Drawer Background (simulated storefront) */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#fff', opacity: 0.3 }} />

        {/* Cart Drawer */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          height: '90%',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#000' }}>Your Cart</h3>
            <button style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Progress Bar Feature */}
            {featureStates.progressBarEnabled && (progressBarSettings.showOnEmpty || !showEmpty) && selectedTab !== 'coupon' && (
              <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>
                    {progressMode === 'amount' ? '💰 Reward Progress' : '🎯 Item Progress'}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>
                    {progressMode === 'amount' ? `₹${cartData.cartValue}` : `${cartData.totalQuantity}`} / {milestones.length > 0 ? milestones[milestones.length - 1].target : 1000}
                  </p>
                </div>
                
                <div style={{ height: '8px', backgroundColor: progressBarSettings.barBackgroundColor, borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${calculateProgress(progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity, milestones.length > 0 ? milestones[milestones.length - 1].target : 1000)}%`, 
                      backgroundColor: progressBarSettings.barForegroundColor,
                      transition: 'width 0.3s ease',
                    }} 
                  />
                </div>

                {(() => {
                  const milestone = getActiveMilestone(progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity, milestones, progressMode);
                  if (milestone.upcoming) {
                    return (
                      <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                        {progressMode === 'amount' 
                          ? `₹${milestone.nextAmount} away from ${milestone.upcoming.rewardText}` 
                          : `${milestone.nextAmount} item${milestone.nextAmount !== 1 ? 's' : ''} away from ${milestone.upcoming.rewardText}`}
                      </p>
                    );
                  }
                  return (
                    <p style={{ margin: 0, fontSize: '11px', color: '#059669', fontWeight: '600' }}>
                      🎉 {progressBarSettings.completionText}
                    </p>
                  );
                })()}

                {/* Milestone Badges */}
                {milestones.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {milestones.map(ms => {
                      const isCompleted = (progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity) >= ms.target;
                      return (
                        <div 
                          key={ms.id}
                          onClick={() => ms.associatedProducts.length > 0 && handleMilestoneProductClick(ms.associatedProducts)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: isCompleted ? '#dcfce7' : '#e5e7eb',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            color: isCompleted ? '#166534' : '#374151',
                            cursor: ms.associatedProducts.length > 0 ? 'pointer' : 'default',
                            border: `1px solid ${isCompleted ? '#86efac' : '#d1d5db'}`,
                          }}
                        >
                          {isCompleted ? '✓' : ''} {ms.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {showEmpty ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px' }}>
                <div style={{ fontSize: '40px' }}>🛒</div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111' }}>Your cart is empty</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Add items to unlock rewards</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                {mockCartItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: '#d1d5db', borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280' }}>₹{item.price.toFixed(0)}</p>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>−</button>
                        <span style={{ fontSize: '13px', fontWeight: '500', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#111' }}>₹{(item.price * item.quantity).toFixed(0)}</div>
                  </div>
                ))}
              </>
            )}

            {/* Upsell Recommendations */}
            {upsellConfig.enabled && (!showEmpty || upsellConfig.showOnEmptyCart) && (() => {
              // Get upsell products based on mode with priority system
              let productsToShow = [];
              
              if (upsellConfig.upsellMode === 'manual') {
                const rulesForEvaluation = [
                  {
                    id: 'rule2',
                    enabled: upsellRulesConfig.rule2?.enabled,
                    ruleType: 'TRIGGERED',
                    triggerProducts: upsellRulesConfig.rule2?.triggerProducts || [],
                    upsellProducts: upsellRulesConfig.rule2?.upsellProducts || [],
                  },
                  {
                    id: 'rule3',
                    enabled: upsellRulesConfig.rule3?.enabled,
                    ruleType: 'CART_CONDITIONS',
                    cartValueThreshold: upsellRulesConfig.rule3?.cartValueThreshold || 0,
                    upsellProducts: upsellRulesConfig.rule3?.upsellProducts || [],
                  },
                  {
                    id: 'rule1',
                    enabled: upsellRulesConfig.rule1?.enabled,
                    ruleType: 'GLOBAL',
                    upsellProducts: upsellRulesConfig.rule1?.upsellProducts || [],
                  },
                ];

                const matchedRule = evaluateUpsellRules(rulesForEvaluation, cartProductIds, cartTotal);
                productsToShow = matchedRule?.upsellProducts || [];
              } else if (upsellConfig.upsellMode === 'ai') {
                // For AI mode, show some default products
                productsToShow = ['sp-2', 'sp-6', 'sp-8'];
              }
              
              if (productsToShow.length === 0) return null;
              
              return (
                <div style={{
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  order: upsellConfig.position === 'top' ? -1 : 999,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      fontWeight: '700',
                      color: upsellConfig.titleStyle?.color || '#111',
                      textAlign: upsellConfig.titleStyle?.align || 'left',
                      fontSize: (() => {
                        const sizes = { small: '11px', medium: '12px', large: '14px' };
                        return sizes[upsellConfig.titleStyle?.size] || '12px';
                      })(),
                      ...(() => {
                        const styles = {};
                        if (upsellConfig.upsellTitle?.formatting?.bold) styles.fontWeight = '700';
                        if (upsellConfig.upsellTitle?.formatting?.italic) styles.fontStyle = 'italic';
                        if (upsellConfig.upsellTitle?.formatting?.underline) styles.textDecoration = 'underline';
                        return styles;
                      })(),
                    }}>
                      {upsellConfig.upsellTitle?.text || 'Recommended for you'}
                    </p>
                    {upsellConfig.layout === 'carousel' && upsellConfig.alignment === 'horizontal' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => handleCarouselScroll('left')}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}>←</button>
                        <button 
                          onClick={() => handleCarouselScroll('right')}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}>→</button>
                      </div>
                    )}
                  </div>
                  <div 
                    ref={carouselRef}
                    style={{
                      display: upsellConfig.layout === 'grid' ? 'grid' : 'flex',
                      gridTemplateColumns: upsellConfig.layout === 'grid' ? (upsellConfig.alignment === 'horizontal' ? 'repeat(2, 1fr)' : '1fr') : undefined,
                      flexDirection: upsellConfig.layout === 'carousel' ? (upsellConfig.alignment === 'horizontal' ? 'row' : 'column') : undefined,
                      gap: '8px',
                      overflowX: upsellConfig.layout === 'carousel' && upsellConfig.alignment === 'horizontal' ? 'auto' : 'visible',
                      scrollBehavior: 'smooth',
                    }}>
                    {productsToShow.slice(0, 6).map(productId => {
                      const product = (loadedShopifyProducts.length > 0 ? loadedShopifyProducts : shopifyProducts).find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={product.id} style={{
                          display: 'flex',
                          flexDirection: upsellConfig.alignment === 'horizontal' ? 'row' : 'column',
                          alignItems: upsellConfig.alignment === 'horizontal' ? 'center' : 'flex-start',
                          gap: '8px',
                          padding: '10px',
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          minWidth: upsellConfig.layout === 'carousel' && upsellConfig.alignment === 'horizontal' ? '200px' : 'auto',
                        }}>
                          <div style={{ fontSize: '24px', flexShrink: 0 }}>{product.image}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#111' }}>
                              {product.title}
                            </p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>₹{product.price}</p>
                            {upsellConfig.showProductReviews && (
                              <div style={{ display: 'flex', gap: '2px', marginTop: '4px', fontSize: '10px' }}>
                                <span style={{ color: '#fbbf24' }}>★★★★☆</span>
                                <span style={{ color: '#6b7280', fontSize: '10px' }}>(4.0)</span>
                              </div>
                            )}
                          </div>
                          <button style={{
                            padding: upsellConfig.buttonStyle === 'circle' ? '8px' : '6px 10px',
                            fontSize: '11px',
                            borderRadius: upsellConfig.buttonStyle === 'circle' ? '50%' : '6px',
                            border: 'none',
                            backgroundColor: '#111',
                            color: '#fff',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}>
                            {upsellConfig.buttonStyle === 'circle' ? '+' : 'Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Coupon Feature */}
            {featureStates.couponSliderEnabled && allCoupons.length > 0 && (
              <div style={{ 
                padding: '12px',
                order: couponPosition === 'top' ? -1 : 999,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>
                    🎟️ Available Coupons ({allCoupons.filter(c => c.enabled).length})
                  </p>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleScrollCoupons('left')}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#111',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      ←
                    </button>
                    <button
                      onClick={() => handleScrollCoupons('right')}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#111',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
                <div ref={couponSliderRef} style={{ 
                  display: couponLayout === 'grid' ? 'grid' : 'flex',
                  gridTemplateColumns: couponLayout === 'grid' ? (couponAlignment === 'horizontal' ? 'repeat(2, 1fr)' : '1fr') : undefined,
                  flexDirection: couponLayout === 'carousel' ? (couponAlignment === 'horizontal' ? 'row' : 'column') : undefined,
                  gap: '8px', 
                  paddingBottom: '4px', 
                  scrollBehavior: 'smooth', 
                  overflowX: couponLayout === 'carousel' && couponAlignment === 'horizontal' ? 'auto' : 'hidden',
                  overflowY: couponLayout === 'carousel' && couponAlignment === 'vertical' ? 'auto' : 'hidden',
                }}>
                {allCoupons.filter(c => c.enabled).map((coupon, idx) => {
                  // Use editingCoupon if this is the currently editing coupon for live preview
                  const displayCoupon = editingCoupon && editingCoupon.id === coupon.id ? editingCoupon : coupon;
                  
                  // Style 1: Blue Banner (like Sam's CLUB image)
                  if (selectedCouponStyle === COUPON_STYLES.STYLE_1) {
                    const isApplied = appliedCouponIds.includes(coupon.id);
                    return (
                      <div 
                        key={coupon.id}
                        onClick={() => handleCopyCouponCode(coupon.code, coupon.id)}
                        style={{ 
                          minWidth: couponLayout === 'carousel' && couponAlignment === 'horizontal' ? '280px' : undefined,
                          width: couponLayout === 'grid' ? '100%' : undefined,
                          padding: '10px 14px',
                          backgroundColor: displayCoupon.backgroundColor,
                          borderRadius: `${displayCoupon.borderRadius}px`,
                          cursor: 'pointer',
                          transition: 'transform 0.15s',
                          position: 'relative',
                          border: isApplied ? '2px solid #10b981' : '2px solid transparent',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {/* Applied Badge */}
                        {isApplied && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 5,
                          }}>
                            <span>✓</span>
                            <span>Applied</span>
                          </div>
                        )}
                        {/* Top label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px' }}>{displayCoupon.iconUrl}</span>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: displayCoupon.textColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {displayCoupon.label}
                          </p>
                        </div>
                        
                        {/* Main content - layout based on coupon alignment */}
                        <div style={{ display: 'flex', alignItems: couponAlignment === 'horizontal' ? 'center' : 'flex-start', flexDirection: couponAlignment === 'horizontal' ? 'row' : 'column', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', color: displayCoupon.textColor, lineHeight: '1' }}>
                              {displayCoupon.code}
                            </p>
                            <p style={{ margin: 0, fontSize: '10px', color: displayCoupon.textColor, opacity: 0.85 }}>
                              {displayCoupon.discountType === 'percentage' 
                                ? `${displayCoupon.discountValue}% off your order` 
                                : `₹${displayCoupon.discountValue} off your order`}
                            </p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopyCouponCode(coupon.code, coupon.id); }}
                            style={{ 
                              padding: '10px 20px',
                              fontSize: '12px',
                              backgroundColor: isApplied ? '#ef4444' : displayCoupon.button.backgroundColor,
                              color: displayCoupon.button.textColor,
                              border: 'none',
                              borderRadius: `${displayCoupon.button.borderRadius}px`,
                              cursor: 'pointer',
                              fontWeight: '700',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                            }}
                          >
                            {isApplied ? 'Remove Coupon' : displayCoupon.button.text}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  // Style 2: Pink Baby Card (like BAWSE5 image)
                  if (selectedCouponStyle === COUPON_STYLES.STYLE_2) {
                    const isApplied = appliedCouponIds.includes(coupon.id);
                    return (
                      <div 
                        key={coupon.id}
                        onClick={() => handleCopyCouponCode(coupon.code, coupon.id)}
                        style={{ 
                          minWidth: couponLayout === 'carousel' && couponAlignment === 'horizontal' ? '280px' : undefined,
                          width: couponLayout === 'grid' ? '100%' : undefined,
                          padding: '14px 16px',
                          backgroundColor: displayCoupon.backgroundColor,
                          borderRadius: `${displayCoupon.borderRadius}px`,
                          cursor: 'pointer',
                          border: isApplied ? '2px solid #10b981' : `1px solid ${displayCoupon.textColor}15`,
                          transition: 'transform 0.15s, box-shadow 0.15s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Applied Badge */}
                        {isApplied && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 5,
                          }}>
                            <span>✓</span>
                            <span>Applied</span>
                          </div>
                        )}
                        {/* Icon + Code Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '20px', lineHeight: '1' }}>{displayCoupon.iconUrl}</span>
                          <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: displayCoupon.textColor, letterSpacing: '0.5px', lineHeight: '1' }}>
                            {displayCoupon.code}
                          </p>
                        </div>
                        
                        {/* Description */}
                        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: displayCoupon.textColor, lineHeight: '1.4', opacity: 0.9 }}>
                          {displayCoupon.discountType === 'percentage' 
                            ? `${displayCoupon.discountValue}% off your order` 
                            : `₹${displayCoupon.discountValue} off your order`}
                        </p>
                        
                        {/* Rounded button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCopyCouponCode(coupon.code, coupon.id); }}
                          style={{ 
                            padding: '9px 20px',
                            fontSize: '12px',
                            backgroundColor: isApplied ? '#ef4444' : displayCoupon.button.backgroundColor,
                            color: displayCoupon.button.textColor,
                            border: 'none',
                            borderRadius: `${displayCoupon.button.borderRadius}px`,
                            cursor: 'pointer',
                            fontWeight: '600',
                            display: 'inline-block',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          {isApplied ? 'Remove Coupon' : displayCoupon.button.text}
                        </button>
                      </div>
                    );
                  }
                  
                  // Style 3: Ticket Design (like yellow ticket image)
                  if (selectedCouponStyle === COUPON_STYLES.STYLE_3) {
                    const isApplied = appliedCouponIds.includes(coupon.id);
                    return (
                      <div 
                        key={coupon.id}
                        onClick={() => handleCopyCouponCode(coupon.code, coupon.id)}
                        style={{ 
                          minWidth: couponLayout === 'carousel' && couponAlignment === 'horizontal' ? '280px' : undefined,
                          width: couponLayout === 'grid' ? '100%' : undefined,
                          display: 'flex',
                          backgroundColor: displayCoupon.backgroundColor,
                          borderRadius: `${displayCoupon.borderRadius}px`,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          transition: 'transform 0.15s',
                          position: 'relative',
                          border: isApplied ? '2px solid #10b981' : '2px solid transparent',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {/* Applied Badge */}
                        {isApplied && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 5,
                          }}>
                            <span>✓</span>
                            <span>Applied</span>
                          </div>
                        )}
                        {/* Yellow/Gold Side Banner */}
                        <div style={{ 
                          width: '32px',
                          backgroundColor: displayCoupon.button.backgroundColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 6px',
                        }}>
                          <div style={{
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed',
                            transform: 'rotate(180deg)',
                            fontSize: '10px',
                            fontWeight: '700',
                            color: displayCoupon.button.textColor,
                            letterSpacing: '1px',
                          }}>
                            {displayCoupon.label.split(' ')[0]}
                          </div>
                        </div>
                        
                        {/* Main Ticket Content */}
                        <div style={{ flex: 1, padding: '12px 14px' }}>
                          {/* Ticket header */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: '600', color: displayCoupon.textColor }}>
                                {displayCoupon.label}
                              </p>
                              <p style={{ margin: 0, fontSize: '10px', color: displayCoupon.textColor, opacity: 0.7 }}>
                                {displayCoupon.code}
                              </p>
                            </div>
                            <span style={{ fontSize: '20px' }}>{displayCoupon.iconUrl}</span>
                          </div>
                          
                          <p style={{ margin: '0 0 10px 0', fontSize: '10px', color: displayCoupon.textColor, opacity: 0.7 }}>
                            {displayCoupon.discountType === 'percentage' 
                              ? `${displayCoupon.discountValue}% off your order` 
                              : `₹${displayCoupon.discountValue} off your order`}
                          </p>
                          
                          {/* Buy button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopyCouponCode(coupon.code, coupon.id); }}
                            style={{ 
                              padding: '8px 18px',
                              fontSize: '11px',
                              backgroundColor: isApplied ? '#ef4444' : displayCoupon.button.backgroundColor,
                              color: displayCoupon.button.textColor,
                              border: 'none',
                              borderRadius: `${displayCoupon.button.borderRadius}px`,
                              cursor: 'pointer',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {isApplied ? 'Remove Coupon' : displayCoupon.button.text}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })}
                </div>
              </div>
            )}

            {/* Upsell Feature */}
            {featureStates.upsellEnabled && (
              <div style={{ padding: '12px', backgroundColor: '#ede9fe', borderRadius: '8px', border: '1px solid #c4b5fd' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#5b21b6' }}>✨ You might also like</p>
                <div style={{ display: 'flex', gap: '8px', padding: '8px', backgroundColor: '#f5f3ff', borderRadius: '6px', border: '1px solid #ddd6fe' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#c4b5fd', borderRadius: '4px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#111' }}>Premium Bundle</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>$19.99</p>
                  </div>
                  <button style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', alignSelf: 'center' }}>Add</button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!showEmpty && (
            <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Subtotal</span>
                <span style={{ fontWeight: '600', color: '#111' }}>₹{cartTotal.toFixed(0)}</span>
              </div>
              
              {/* Show applied discounts */}
              {appliedCouponIds.length > 0 && appliedCouponIds.map(couponId => {
                const coupon = allCoupons.find(c => c.id === couponId);
                if (!coupon) return null;
                const discount = calculateCouponDiscount(coupon, cartTotal);
                return (
                  <div key={couponId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#10b981', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>✓</span>
                      <span>{coupon.code} ({coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`})</span>
                    </span>
                    <span style={{ fontWeight: '600', color: '#10b981' }}>-₹{discount.toFixed(0)}</span>
                  </div>
                );
              })}
              
              {totalDiscount > 0 && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginBottom: '8px' }} />
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '15px' }}>
                <span style={{ color: '#111', fontWeight: '700' }}>Total</span>
                <span style={{ fontWeight: '700', color: '#111', fontSize: '18px' }}>₹{finalTotal.toFixed(0)}</span>
              </div>
              
              <button style={{ width: '100%', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                Checkout • ₹{finalTotal.toFixed(0)}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================

  const saveToastMarkup = showSaveToast ? (
    <Toast content={saveToastMessage} onDismiss={() => setShowSaveToast(false)} />
  ) : null;

  return (
    <Frame>
      {saveToastMarkup}
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Deactivate Confirmation Modal */}
      <Modal
        open={showDeactivateModal}
        onClose={handleCancelDeactivate}
        title="Deactivate cart"
        primaryAction={{
          content: 'Deactivate',
          onAction: handleConfirmDeactivate,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleCancelDeactivate,
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Changing cart status to "Inactive" will remove this cart from your live store.
          </Text>
        </Modal.Section>
      </Modal>

      {/* Milestone Product Modal */}
      <Modal
        open={showProductModal && selectedMilestoneProduct !== null}
        onClose={() => setShowProductModal(false)}
        title="Milestone Reward"
      >
        <Modal.Section>
          <BlockStack gap="400">
            {selectedMilestoneProduct && selectedMilestoneProduct.map(product => (
              <Card key={product.id}>
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">{product.image} {product.title}</Text>
                    <Text as="p" tone="subdued">₹{product.price}</Text>
                  </BlockStack>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    variant="primary"
                  >
                    Add to Cart
                  </Button>
                </InlineStack>
              </Card>
            ))}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Modal: Manual Upsell Builder */}
      <Modal
        open={showManualUpsellBuilder}
        onClose={() => {
          setShowManualUpsellBuilder(false);
          cancelManualUpsellRules();
        }}
        title="Configure Manual Upsell Rules"
        primaryAction={{
          content: 'Save Rules',
          loading: upsellSaving,
          onAction: saveManualUpsellRules,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => {
              setShowManualUpsellBuilder(false);
              cancelManualUpsellRules();
            },
          },
        ]}
        large
      >
        <Modal.Section>
          <BlockStack gap="400">
            {manualUpsellRules.map((rule, idx) => (
              <Card key={rule.id}>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="headingSm">Rule #{idx + 1}</Text>
                    <Button
                      variant="plain"
                      tone="critical"
                      size="slim"
                      onClick={() => removeManualUpsellRule(rule.id)}
                    >
                      Delete
                    </Button>
                  </InlineStack>

                  <Divider />

                  <BlockStack gap="150">
                    <BlockStack gap="100">
                      <Text variant="bodySm" fontWeight="semibold">Trigger Type</Text>
                      <InlineStack gap="200">
                        <Checkbox
                          label="Any product"
                          checked={rule.triggerType === 'all'}
                          onChange={() =>
                            updateManualUpsellRule(rule.id, { triggerType: 'all' })
                          }
                        />
                        <Checkbox
                          label="Specific products"
                          checked={rule.triggerType === 'specific'}
                          onChange={() =>
                            updateManualUpsellRule(rule.id, { triggerType: 'specific' })
                          }
                        />
                      </InlineStack>
                    </BlockStack>

                    {rule.triggerType === 'specific' && (
                      <Button
                        onClick={() => openProductPicker(rule.id, 'trigger')}
                        variant="secondary"
                      >
                        Choose Trigger Products
                      </Button>
                    )}

                    <BlockStack gap="100">
                      <Text variant="bodySm" fontWeight="semibold">Upsell Products</Text>
                      <Button
                        onClick={() => openProductPicker(rule.id, 'upsell')}
                        variant="secondary"
                      >
                        Choose Upsell Products
                      </Button>
                    </BlockStack>

                    <Card tone="info">
                      <Text variant="bodySm">
                        Trigger: {getTriggerSummary(rule)}
                      </Text>
                      <Text variant="bodySm">
                        Upsell: {getUpsellSummary(rule)}
                      </Text>
                    </Card>
                  </BlockStack>
                </BlockStack>
              </Card>
            ))}

            <Button
              onClick={addManualUpsellRule}
              variant="secondary"
              fullWidth
            >
              + Add Rule
            </Button>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Modal: Product Picker */}
      <Modal
        open={showProductPickerModal}
        onClose={() => setShowProductPickerModal(false)}
        title={productPickerMode === 'trigger' ? 'Select Trigger Products' : 'Select Upsell Products'}
        primaryAction={{
          content: 'Done',
          onAction: saveProductPickerSelection,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowProductPickerModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <TextField
              label="Search"
              placeholder="Search products..."
              value={productSearchQuery}
              onChange={setProductSearchQuery}
            />

            {productPickerMode === 'trigger' && (
              <BlockStack gap="200">
                <Text variant="bodySm" fontWeight="semibold">Collections</Text>
                <BlockStack gap="100">
                  {mockCollections.map(col => (
                    <Checkbox
                      key={col.id}
                      label={`${col.title} (${col.productCount})`}
                      checked={tempSelectedCollectionIds.includes(col.id)}
                      onChange={(checked) => {
                        if (checked) {
                          setTempSelectedCollectionIds([...tempSelectedCollectionIds, col.id]);
                        } else {
                          setTempSelectedCollectionIds(
                            tempSelectedCollectionIds.filter(id => id !== col.id)
                          );
                        }
                      }}
                    />
                  ))}
                </BlockStack>
              </BlockStack>
            )}

            <BlockStack gap="200">
              <Text variant="bodySm" fontWeight="semibold">Products</Text>
              <BlockStack gap="100">
                {SAMPLE_UPSELL_PRODUCTS.map(prod => (
                  <Checkbox
                    key={prod.id}
                    label={`${prod.title} ($${prod.price})`}
                    checked={tempSelectedProductIds.includes(prod.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setTempSelectedProductIds([...tempSelectedProductIds, prod.id]);
                      } else {
                        setTempSelectedProductIds(
                          tempSelectedProductIds.filter(id => id !== prod.id)
                        );
                      }
                    }}
                  />
                ))}
              </BlockStack>
            </BlockStack>

            {(tempSelectedProductIds.length > 0 || tempSelectedCollectionIds.length > 0) && (
              <BlockStack gap="100">
                <Text variant="bodySm" fontWeight="semibold">Selected ({tempSelectedProductIds.length + tempSelectedCollectionIds.length})</Text>
                <InlineStack gap="100" wrap>
                  {tempSelectedCollectionIds.map(id => {
                    const collection = mockCollections.find(c => c.id === id);
                    return (
                      <Badge key={id} onRemove={() =>
                        setTempSelectedCollectionIds(
                          tempSelectedCollectionIds.filter(cid => cid !== id)
                        )
                      }>
                        {collection?.title || id}
                      </Badge>
                    );
                  })}
                  {tempSelectedProductIds.map(id => {
                    const product = SAMPLE_UPSELL_PRODUCTS.find(p => p.id === id);
                    return (
                      <Badge key={id} onRemove={() =>
                        setTempSelectedProductIds(
                          tempSelectedProductIds.filter(pid => pid !== id)
                        )
                      }>
                        {product?.title || id}
                      </Badge>
                    );
                  })}
                </InlineStack>
              </BlockStack>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* LEFT SIDEBAR */}
      {renderLeftSidebar()}

      {/* MIDDLE PANEL - EDITOR */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', borderRight: '1px solid #e5e7eb', backgroundColor: '#f6f6f7' }}>
        {renderEditorPanel()}
      </div>

      {/* RIGHT PANEL - PREVIEW */}
      <div style={{ width: '480px', height: '100vh', overflow: 'hidden', backgroundColor: '#fff' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <Text variant="headingSm" as="h2">Live Preview</Text>
        </div>
        <div style={{ height: 'calc(100vh - 49px)', overflow: 'hidden' }}>
          {renderCartPreview()}
        </div>
      </div>
      </div>
    </Frame>
  );
}

import React, { useState } from 'react';
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
  Tabs,
  ProgressBar,
  ResourceList,
  ResourceItem,
  Thumbnail,
} from '@shopify/polaris';

// ==========================================
// MOCK API FUNCTIONS
// ==========================================

// Mock cart data
const mockCartData = {
  cartValue: 640,
  totalQuantity: 3,
  items: [
    { id: 1, title: 'Premium T-Shirt', price: 320, qty: 2 },
    { id: 2, title: 'Classic Cap', price: 0, qty: 1 },
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

// Mock shopify products for product picker
const mockShopifyProducts = [
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
    title: 'Premium Mug Set', 
    price: '15.99', 
    image: '☕',
    variants: 3,
    status: 'active',
  },
  { 
    id: 'sp-7', 
    title: 'Discount Code Generator', 
    price: '0.00', 
    image: '🏷️',
    variants: 1,
    status: 'active',
  },
  { 
    id: 'sp-8', 
    title: 'Mystery Surprise Gift Box', 
    price: '0.00', 
    image: '🎉',
    variants: 1,
    status: 'active',
  },
];

// Mock API functions
const mockApi = {
  getCartData: async () => {
    return new Promise(resolve => setTimeout(() => resolve(mockCartData), 100));
  },
  getMilestones: async (mode = 'amount') => {
    return new Promise(resolve => 
      setTimeout(() => resolve(mode === 'amount' ? mockMilestones : mockQuantityMilestones), 100)
    );
  },
  getProducts: async (productIds) => {
    return new Promise(resolve => 
      setTimeout(() => resolve(mockProducts.filter(p => productIds.includes(p.id))), 100)
    );
  },
  getShopifyProducts: async () => {
    return new Promise(resolve => 
      setTimeout(() => resolve(mockShopifyProducts), 100)
    );
  },
};

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
  const [shopifyProducts, setShopifyProducts] = useState([]);

  // Mock cart items for preview
  const mockCartItems = [
    { id: 1, name: 'Premium Hoodie', price: 49.99, quantity: 1, image: 'https://via.placeholder.com/80' },
    { id: 2, name: 'Classic T-Shirt', price: 24.99, quantity: 2, image: 'https://via.placeholder.com/80' },
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
      setShopifyProducts(products);
    };
    loadShopifyProducts();
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
    if (currentTierForProducts !== null) {
      updateTierSetting(currentTierForProducts, 'products', selectedProductIds);
    }
    setShowProductPicker(false);
    setCurrentTierForProducts(null);
    setSelectedProductIds([]);
    setProductSearchQuery('');
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = shopifyProducts.filter(product =>
    product.title.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

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
                  label="Show rewards on empty cart"
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
                          Products — {activeTier.products?.length || 0} of {shopifyProducts.length} products added
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
                            const product = shopifyProducts.find(p => p.id === productId);
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

            <Card>
              <BlockStack gap="300">
                <Text variant="headingSm" as="h3">Coupon Field Configuration</Text>
                <Text as="p" tone="subdued">
                  Allow customers to apply discount codes directly in the cart drawer.
                </Text>
                <Divider />
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">Placeholder Text</Text>
                  <Text as="p" tone="subdued">Placeholder for input field settings</Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">Button Text</Text>
                  <Text as="p" tone="subdued">Placeholder for button customization</Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </div>
      );
    }

    // Upsell Products Editor
    if (selectedTab === 'upsell') {
      return (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingLg" as="h1">Upsell Products Settings</Text>
              <Button
                variant={featureStates.upsellEnabled ? 'primary' : 'secondary'}
                onClick={() => toggleFeature('upsellEnabled')}
              >
                {featureStates.upsellEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </InlineStack>

            <Card>
              <BlockStack gap="300">
                <Text variant="headingSm" as="h3">Upsell Configuration</Text>
                <Text as="p" tone="subdued">
                  Display recommended products to increase average order value.
                </Text>
                <Divider />
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">Product Selection</Text>
                  <Text as="p" tone="subdued">Placeholder for product picker</Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">Display Position</Text>
                  <Text as="p" tone="subdued">Placeholder for position settings</Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">Heading Text</Text>
                  <Text as="p" tone="subdued">Placeholder for heading customization</Text>
                </BlockStack>
              </BlockStack>
            </Card>
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
            {featureStates.progressBarEnabled && (progressBarSettings.showOnEmpty || !showEmpty) && (
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
                {cartData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: '#d1d5db', borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280' }}>₹{item.price.toFixed(0)}</p>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>−</button>
                        <span style={{ fontSize: '13px', fontWeight: '500', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                        <button style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#111' }}>₹{(item.price * item.qty).toFixed(0)}</div>
                  </div>
                ))}
              </>
            )}

            {/* Coupon Feature */}
            {featureStates.couponSliderEnabled && (
              <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>🎫 Have a coupon code?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Enter code" style={{ flex: 1, padding: '6px 8px', fontSize: '12px', border: '1px solid #fbbf24', borderRadius: '4px', outline: 'none' }} />
                  <button style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Apply</button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Subtotal</span>
                <span style={{ fontWeight: '700', color: '#111', fontSize: '16px' }}>₹{cartData.cartValue.toFixed(0)}</span>
              </div>
              <button style={{ width: '100%', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                Checkout • ₹{cartData.cartValue.toFixed(0)}
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

  return (
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

      {/* Product Picker Modal */}
      <Modal
        open={showProductPicker}
        onClose={() => {
          setShowProductPicker(false);
          setCurrentTierForProducts(null);
          setSelectedProductIds([]);
          setProductSearchQuery('');
        }}
        title="Select Product"
        primaryAction={{
          content: 'Save',
          onAction: handleSaveSelectedProducts,
        }}
        secondaryActions={[
          {
            content: 'Close',
            onAction: () => {
              setShowProductPicker(false);
              setCurrentTierForProducts(null);
              setSelectedProductIds([]);
              setProductSearchQuery('');
            },
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {/* Search Bar */}
            <TextField
              label=""
              placeholder="Search Products..."
              value={productSearchQuery}
              onChange={setProductSearchQuery}
              autoComplete="off"
            />

            {/* Selection Info */}
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" tone="subdued">{selectedProductIds.length} item selected</Text>
              <Checkbox
                label="Show only selected"
                checked={false}
                onChange={() => {}}
              />
            </InlineStack>

            {/* Product List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: selectedProductIds.includes(product.id) ? '#f0f9ff' : '#fff',
                  }}
                >
                  <Checkbox
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                  />
                  <div style={{ marginLeft: '12px', flex: 1 }}>
                    <InlineStack align="space-between" blockAlign="start">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="semibold">{product.image} {product.title}</Text>
                        <Text as="span" tone="subdued" variant="bodySm">{product.variants} variant{product.variants !== 1 ? 's' : ''}</Text>
                      </BlockStack>
                      <InlineStack gap="200" blockAlign="center">
                        {getStatusBadge(product.status)}
                        <Text variant="bodyMd" fontWeight="semibold">${product.price}</Text>
                      </InlineStack>
                    </InlineStack>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <Text as="p" tone="subdued" alignment="center">No products found</Text>
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
  );
}

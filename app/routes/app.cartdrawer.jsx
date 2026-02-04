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
  Toast,
  Frame,
  Tabs,
  ProgressBar,
  ResourceList,
  ResourceItem,
  Thumbnail,
} from '@shopify/polaris';
import { sampleCoupons, COUPON_STYLES, COUPON_STYLE_METADATA, globalCouponStyle } from '../services/api.cart-settings';

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

// Mock collections
const mockCollections = [
  { id: 'col-1', title: 'Winter Gear' },
  { id: 'col-2', title: 'Gifts & Bundles' },
  { id: 'col-3', title: 'Premium Accessories' },
  { id: 'col-4', title: 'Discountable Items' },
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
    collections: ['col-2', 'col-4'],
  },
  { 
    id: 'sp-2', 
    title: 'The Inventory Not Tracked Snowboard', 
    price: '949.95', 
    image: '🏂',
    variants: 1,
    status: 'active',
    collections: ['col-1'],
  },
  { 
    id: 'sp-3', 
    title: 'The Archived Snowboard', 
    price: '629.95', 
    image: '🏂',
    variants: 1,
    status: 'archived',
    collections: ['col-1'],
  },
  { 
    id: 'sp-4', 
    title: 'The Draft Snowboard', 
    price: '2629.95', 
    image: '🏂',
    variants: 1,
    status: 'draft',
    collections: ['col-1', 'col-3'],
  },
  { 
    id: 'sp-5', 
    title: 'The Out of Stock Snowboard', 
    price: '885.95', 
    image: '🏂',
    variants: 1,
    status: 'outofstock',
    collections: ['col-1'],
  },
  { 
    id: 'sp-6', 
    title: 'Premium Mug Set', 
    price: '15.99', 
    image: '☕',
    variants: 3,
    status: 'active',
    collections: ['col-3'],
  },
  { 
    id: 'sp-7', 
    title: 'Discount Code Generator', 
    price: '0.00', 
    image: '🏷️',
    variants: 1,
    status: 'active',
    collections: ['col-4'],
  },
  { 
    id: 'sp-8', 
    title: 'Mystery Surprise Gift Box', 
    price: '0.00', 
    image: '🎉',
    variants: 1,
    status: 'active',
    collections: ['col-2'],
  },
];

// Mock API functions
const mockApi = {
  getCartData: async () => {
    return fetch('/api/cart-settings/cart-data', {
      headers: {
        'X-Shop-ID': SHOP_ID,
      },
    }).then(() => mockCartData).catch(() => mockCartData);
  },
  getMilestones: async (mode = 'amount') => {
    return fetch('/api/cart-settings/milestones', {
      headers: {
        'X-Shop-ID': SHOP_ID,
        'X-Mode': mode,
      },
    }).then(() => mode === 'amount' ? mockMilestones : mockQuantityMilestones).catch(() => mode === 'amount' ? mockMilestones : mockQuantityMilestones);
  },
  getProducts: async (productIds) => {
    return fetch('/api/cart-settings/products', {
      method: 'POST',
      headers: {
        'X-Shop-ID': SHOP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productIds }),
    }).then(() => mockProducts.filter(p => productIds.includes(p.id))).catch(() => mockProducts.filter(p => productIds.includes(p.id)));
  },
  getShopifyProducts: async () => {
    return fetch('/api/cart-settings/shopify-products', {
      headers: {
        'X-Shop-ID': SHOP_ID,
      },
    }).then(() => mockShopifyProducts).catch(() => mockShopifyProducts);
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

  // ==========================================
  // UPSELL EDITOR STATE
  // ==========================================
  const [upsellConfig, setUpsellConfig] = useState({
    enabled: true,
    showOnEmptyCart: false,
    upsellMode: 'manual', // 'ai' or 'manual' - MUTUALLY EXCLUSIVE
    aiRecommendationType: 'related', // 'related' or 'complementary'
    manualRules: [], // Array of independent rules
    upsellTitle: {
      text: 'Recommended for you',
      formatting: { bold: false, italic: false, underline: false },
    },
    titleStyle: {
      color: '#1A1A1A',
      size: 'medium', // 'small', 'medium', 'large'
      align: 'left', // 'left', 'center', 'right'
    },
    buttonStyle: 'box', // 'box' or 'circle'
    position: 'bottom', // 'top' or 'bottom'
    layout: 'grid', // 'grid' or 'carousel'
    alignment: 'horizontal', // 'horizontal' or 'vertical'
    showProductReviews: false,
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
  const [manualUpsellRules, setManualUpsellRules] = useState([]);
  const [currentUpsellRule, setCurrentUpsellRule] = useState(null);
  const [upsellPickerMode, setUpsellPickerMode] = useState(null);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [showManualUpsellModal, setShowManualUpsellModal] = useState(false);
  const [useAIUpsells, setUseAIUpsells] = useState(false);
  const [upsellSettings, setUpsellSettings] = useState({
    enabled: true,
    ruleType: 'MANUAL',
    trigger: 'ANY_CART',
    products: ['sp-2', 'sp-4', 'sp-6'],
    limit: 3,
    ui: {
      layout: 'slider',
      buttonText: 'Add to Cart',
      buttonColor: '#000000',
      showPrice: true,
      title: 'Recommended for you',
      position: 'bottom',
    },
    analytics: { trackViews: true, trackClicks: true, trackAddToCart: true },
  });

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
      setShopifyProducts(products);
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

  const filteredProducts = shopifyProducts.filter(product => {
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

      // Update in allCoupons state
      const updated = allCoupons.map(c =>
        c.id === editingCoupon.id ? JSON.parse(JSON.stringify(editingCoupon)) : c
      );
      setAllCoupons(updated);
      
      // Update in sample data
      const index = sampleCoupons.findIndex(c => c.id === editingCoupon.id);
      if (index !== -1) {
        sampleCoupons[index] = JSON.parse(JSON.stringify(editingCoupon));
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
  // UPSELL HANDLERS
  // ==========================================
  const updateUpsellConfig = (key, value) => {
    setUpsellConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateUpsellTitleText = (text) => {
    setUpsellConfig(prev => ({
      ...prev,
      upsellTitle: { ...prev.upsellTitle, text },
    }));
  };

  const updateUpsellTitleFormatting = (formatType) => {
    setUpsellConfig(prev => ({
      ...prev,
      upsellTitle: {
        ...prev.upsellTitle,
        formatting: {
          ...prev.upsellTitle.formatting,
          [formatType]: !prev.upsellTitle.formatting[formatType],
        },
      },
    }));
  };

  const updateTitleStyle = (key, value) => {
    setUpsellConfig(prev => ({
      ...prev,
      titleStyle: { ...prev.titleStyle, [key]: value },
    }));
  };

  // Handle mode change - mutually exclusive
  const handleModeChange = (mode) => {
    console.log('[Upsell] Mode changed to:', mode, '| shopId:', SHOP_ID);
    setUpsellConfig(prev => ({ ...prev, upsellMode: mode }));
  };

  // Manual Rules Management
  const addManualRule = () => {
    const newRule = {
      ruleId: `rule-${Date.now()}`,
      triggerType: 'all_products', // 'all_products' or 'triggered_products'
      triggerItems: { products: [], collections: [] },
      upsellItems: { products: [], collections: [] },
    };
    setUpsellConfig(prev => ({
      ...prev,
      manualRules: [...prev.manualRules, newRule],
    }));
  };

  const updateManualRule = (ruleId, updates) => {
    setUpsellConfig(prev => ({
      ...prev,
      manualRules: prev.manualRules.map(rule =>
        rule.ruleId === ruleId ? { ...rule, ...updates } : rule
      ),
    }));
  };

  const deleteManualRule = (ruleId) => {
    setUpsellConfig(prev => ({
      ...prev,
      manualRules: prev.manualRules.filter(rule => rule.ruleId !== ruleId),
    }));
  };

  // Carousel navigation
  const handleCarouselScroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 250;
      const newPosition = direction === 'left' 
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;
      carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  const handleOpenTriggeredProductsModal = (ruleId) => {
    const rule = upsellConfig.manualRules?.find(r => r.ruleId === ruleId);
    if (rule) {
      setCurrentUpsellRule(ruleId);
      setModalActiveTab('products');
      setSelectedProductIds(rule.triggerItems?.products || []);
      setSelectedCollectionIds(rule.triggerItems?.collections || []);
      setShowTriggeredProductsModal(true);
    }
  };

  const handleOpenUpsellProductsModal = (ruleId) => {
    const rule = upsellConfig.manualRules?.find(r => r.ruleId === ruleId);
    if (rule) {
      setCurrentUpsellRule(ruleId);
      setModalActiveTab('products');
      setSelectedProductIds(rule.upsellItems?.products || []);
      setSelectedCollectionIds(rule.upsellItems?.collections || []);
      setShowUpsellProductsModal(true);
    }
  };

  const handleSaveTriggeredProducts = () => {
    if (currentUpsellRule) {
      updateManualRule(currentUpsellRule, {
        triggerItems: {
          products: selectedProductIds,
          collections: selectedCollectionIds,
        },
      });
    }
    setShowTriggeredProductsModal(false);
    setCurrentUpsellRule(null);
    setSelectedProductIds([]);
    setSelectedCollectionIds([]);
    setProductSearchQuery('');
    setCollectionSearchQuery('');
  };

  const handleSaveUpsellProducts = () => {
    if (currentUpsellRule) {
      updateManualRule(currentUpsellRule, {
        upsellItems: {
          products: selectedProductIds,
          collections: selectedCollectionIds,
        },
      });
    }
    setShowUpsellProductsModal(false);
    setCurrentUpsellRule(null);
    setSelectedProductIds([]);
    setSelectedCollectionIds([]);
    setProductSearchQuery('');
    setCollectionSearchQuery('');
  };

  const handleSaveUpsellConfig = async () => {
    setIsSaving(true);
    
    console.log('[Upsell] Saving config for shopId:', SHOP_ID, upsellConfig);
    
    try {
      const response = await fetch(`/api/cart-settings/upsell?shopId=${encodeURIComponent(SHOP_ID)}`, {
        method: 'POST',
        headers: {
          'X-Shop-ID': SHOP_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(upsellConfig),
      });
      
      const result = await response.json();
      console.log('[Upsell] Save response:', result, '| shopId:', result.shopId);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      setSaveToastMessage(`Upsell settings saved for ${SHOP_ID}`);
      setShowSaveToast(true);
    } catch (error) {
      console.error('[Upsell] Save failed:', error);
      setSaveToastMessage('Save failed');
      setShowSaveToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelUpsellConfig = async () => {
    // Fetch last saved config from API
    console.log('[Upsell] Canceling, fetching last saved config for shopId:', SHOP_ID);
    try {
      const response = await fetch(`/api/cart-settings/upsell?shopId=${encodeURIComponent(SHOP_ID)}`, {
        headers: {
          'X-Shop-ID': SHOP_ID,
        },
      });
      const data = await response.json();
      console.log('[Upsell] Restored config:', data, '| shopId:', data.shopId);
      setUpsellConfig(data.config || {
        enabled: true,
        showOnEmptyCart: false,
        upsellMode: 'manual',
        aiRecommendationType: 'related',
        manualRules: [],
        upsellTitle: {
          text: 'Recommended for you',
          formatting: { bold: false, italic: false, underline: false },
        },
        titleStyle: {
          color: '#1A1A1A',
          size: 'medium',
          align: 'left',
        },
        buttonStyle: 'box',
        position: 'bottom',
        layout: 'grid',
        alignment: 'horizontal',
        showProductReviews: false,
      });
    } catch (error) {
      console.error('[Upsell] Cancel/restore failed:', error);
    }
  };

  // ==========================================
  // UPSELL API HANDLER
  // ==========================================
  const handleApiUpdate = async (endpoint, data) => {
    if (endpoint === '/api/upsell') {
      setUpsellSettings(data);
      setShowSaveToast(true);
      setSaveToastMessage('Upsell settings saved');
    }
  };

  // ==========================================
  // MANUAL UPSELL HANDLERS
  // ==========================================
  const handleAddUpsellRule = () => {
    const newRule = {
      id: Date.now(),
      triggerType: 'specific', // 'specific' or 'all'
      triggerSource: 'products', // 'products' or 'collections'
      triggerProductIds: [],
      triggerCollectionIds: [],
      upsellProductIds: [],
      priority: manualUpsellRules.length,
    };
    setManualUpsellRules([...manualUpsellRules, newRule]);
  };

  const handleRemoveUpsellRule = (ruleId) => {
    const remaining = manualUpsellRules.filter(rule => rule.id !== ruleId);
    const reordered = remaining.map((rule, index) => ({ ...rule, priority: index }));
    setManualUpsellRules(reordered);
  };

  const handleUpdateUpsellRule = (ruleId, updates) => {
    setManualUpsellRules(manualUpsellRules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const handleOpenTriggerPicker = (ruleId) => {
    const rule = manualUpsellRules.find(r => r.id === ruleId);
    if (rule) {
      setCurrentUpsellRule(ruleId);
      setUpsellPickerMode('trigger');
      setSelectedProductIds(rule.triggerProductIds || []);
      setShowProductPicker(true);
    }
  };

  const handleOpenUpsellPicker = (ruleId) => {
    const rule = manualUpsellRules.find(r => r.id === ruleId);
    if (rule) {
      setCurrentUpsellRule(ruleId);
      setUpsellPickerMode('upsell');
      setSelectedProductIds(rule.upsellProductIds || []);
      setShowProductPicker(true);
    }
  };

  const handleOpenCollectionPicker = (ruleId) => {
    const rule = manualUpsellRules.find(r => r.id === ruleId);
    if (rule) {
      setCurrentUpsellRule(ruleId);
      setSelectedCollectionIds(rule.triggerCollectionIds || []);
      setShowCollectionPicker(true);
    }
  };

  const handleMoveRule = (ruleId, direction) => {
    const index = manualUpsellRules.findIndex(r => r.id === ruleId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === manualUpsellRules.length - 1)
    ) {
      return;
    }

    const newRules = [...manualUpsellRules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newRules[index], newRules[targetIndex]] = [newRules[targetIndex], newRules[index]];
    
    // Update priorities
    newRules.forEach((rule, idx) => {
      rule.priority = idx;
    });
    
    setManualUpsellRules(newRules);
  };

  const isUpsellConfigValid = () => {
    if (manualUpsellRules.length === 0) return false;
    
    return manualUpsellRules.every(rule => {
      const hasTrigger = rule.triggerType === 'all'
        || (rule.triggerSource === 'products' && rule.triggerProductIds.length > 0)
        || (rule.triggerSource === 'collections' && rule.triggerCollectionIds.length > 0);
      const hasUpsells = rule.upsellProductIds.length > 0;
      return hasTrigger && hasUpsells;
    });
  };

  const getRuleValidation = (rule) => {
    const triggerMissing = rule.triggerType !== 'all'
      && !(
        (rule.triggerSource === 'products' && rule.triggerProductIds.length > 0)
        || (rule.triggerSource === 'collections' && rule.triggerCollectionIds.length > 0)
      );
    const upsellMissing = rule.upsellProductIds.length === 0;
    return { triggerMissing, upsellMissing };
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

            {/* Horizontal Legacy Tabs */}
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
                Global Coupon Style
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

            {/* Tab Content */}
            {couponSubTab === 'global-style' && (
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">Global Coupon Style</Text>
                    <Text tone="subdued" as="p">Select one style that applies to all coupons</Text>
                    
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

                {/* Active Coupons Selector */}
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">Active Coupons</Text>
                    <Text tone="subdued" as="p">Enable or disable coupons for display</Text>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                      {allCoupons.map(coupon => (
                        <div 
                          key={coupon.id}
                          onClick={() => {
                            handleCouponTabClick(coupon.id);
                            setCouponSubTab('manage-coupons');
                          }}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#2c6ecb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                            e.currentTarget.style.borderColor = '#e5e7eb';
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
                    </div>
                  </BlockStack>
                </Card>
              </BlockStack>
            )}

            {couponSubTab === 'manage-coupons' && (
              <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h2">Manage Coupons</Text>
                  <Text tone="subdued" as="p">Select an enabled coupon to edit</Text>
                </BlockStack>

                {/* Compact Coupon Selector - Only Enabled Coupons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {allCoupons.filter(c => c.enabled).map(coupon => (
                    <button
                      key={coupon.id}
                      onClick={() => handleCouponTabClick(coupon.id)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: `2px solid ${activeCouponTab === coupon.id ? '#2c6ecb' : '#d1d5db'}`,
                        borderRadius: '6px',
                        backgroundColor: activeCouponTab === coupon.id ? '#f0f7ff' : '#fff',
                        color: activeCouponTab === coupon.id ? '#2c6ecb' : '#374151',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{coupon.iconUrl}</span>
                      {coupon.code}
                    </button>
                  ))}
                </div>

                <Divider />

                {/* Editor Panel */}
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
                    <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>← Select a coupon to edit</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Click on any coupon from the Active Coupons section in the Global Coupon Style tab</p>
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

    // Upsell Products Editor
    if (selectedTab === 'upsell') {
      // Helper to apply title formatting dynamically
      const getTitleStyle = () => {
        const styles = {};
        if (upsellConfig.upsellTitle?.formatting?.bold) styles.fontWeight = 'bold';
        if (upsellConfig.upsellTitle?.formatting?.italic) styles.fontStyle = 'italic';
        if (upsellConfig.upsellTitle?.formatting?.underline) styles.textDecoration = 'underline';
        return styles;
      };

      // Helper to get font size
      const getFontSize = () => {
        const sizes = { small: '12px', medium: '14px', large: '16px' };
        return sizes[upsellConfig.titleStyle?.size] || '14px';
      };

      return (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
          <BlockStack gap="400">
            {/* Header with shopId indicator */}
            <InlineStack align="space-between" blockAlign="center">
              <div>
                <Text variant="headingLg" as="h1">Upsell Settings</Text>
                <Text variant="bodySm" tone="subdued">Shop: {SHOP_ID}</Text>
              </div>
              <Button
                variant={upsellConfig.enabled ? 'primary' : 'secondary'}
                onClick={() => updateUpsellConfig('enabled', !upsellConfig.enabled)}
              >
                {upsellConfig.enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </InlineStack>

            {/* Top Controls */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Top Controls</Text>
                
                <Checkbox
                  label="Show upsell on empty cart"
                  checked={upsellConfig.showOnEmptyCart}
                  onChange={(value) => updateUpsellConfig('showOnEmptyCart', value)}
                  helpText="Display upsell recommendations even when cart is empty"
                />
              </BlockStack>
            </Card>

            {/* Recommendation Type - MUTUALLY EXCLUSIVE */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Recommendation Type (Choose One)</Text>
                <Text variant="bodySm" tone="subdued">Only one mode can be active at a time</Text>
                
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <ChoiceList
                    title=""
                    choices={[
                      { 
                        label: 'AI Recommendation', 
                        value: 'ai',
                        helpText: 'Automatically recommend related or complementary products',
                      },
                      { 
                        label: 'Manual Upsell', 
                        value: 'manual',
                        helpText: 'Create custom rules to control which products to upsell',
                      },
                    ]}
                    selected={[upsellConfig.upsellMode]}
                    onChange={(value) => handleModeChange(value[0])}
                  />
                </div>
                
                {/* AI Options - Only shown when AI mode is active */}
                {upsellConfig.upsellMode === 'ai' && (
                  <div style={{ padding: '16px', backgroundColor: '#f0f7ff', borderRadius: '8px', border: '1px solid #2c6ecb' }}>
                    <BlockStack gap="300">
                      <Text variant="bodyMd" fontWeight="semibold">AI Recommendation Type</Text>
                      <ChoiceList
                        title=""
                        choices={[
                          { label: 'Related Products', value: 'related', helpText: 'Similar products in same category' },
                          { label: 'Complementary Products', value: 'complementary', helpText: 'Products that go well together' },
                        ]}
                        selected={[upsellConfig.aiRecommendationType]}
                        onChange={(value) => updateUpsellConfig('aiRecommendationType', value[0])}
                      />
                    </BlockStack>
                  </div>
                )}
              </BlockStack>
            </Card>

            {/* Manual Upsell Configuration - Rules Based */}
            {upsellConfig.upsellMode === 'manual' && (
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingMd" as="h2">Manual Upsell Rules</Text>
                    <Button onClick={addManualRule} variant="primary">
                      + Add Rule
                    </Button>
                  </InlineStack>
                  
                  <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', border: '1px solid #f59e0b' }}>
                    <Text variant="bodySm" fontWeight="semibold" as="p" tone="caution">Rule Priority System:</Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      • <strong>Triggered Product</strong> rules are evaluated first (higher priority)<br/>
                      • <strong>All Products</strong> rules act as fallback when no Triggered rules match<br/>
                      • If any Triggered rule matches cart items, only those upsells are shown<br/>
                      • All Products upsells are shown only when no Triggered rules match
                    </Text>
                  </div>

                  {/* Display existing rules */}
                  {upsellConfig.manualRules && upsellConfig.manualRules.length > 0 ? (
                    <BlockStack gap="300">
                      {upsellConfig.manualRules.map((rule, index) => (
                        <div
                          key={rule.ruleId}
                          style={{
                            padding: '16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Text variant="bodyMd" fontWeight="semibold">Rule #{index + 1}</Text>
                                {rule.triggerType === 'all_products' ? (
                                  <Badge tone="attention">All Products</Badge>
                                ) : (
                                  <Badge tone="info">Triggered Products</Badge>
                                )}
                              </div>
                              <Button
                                onClick={() => deleteManualRule(rule.ruleId)}
                                tone="critical"
                                size="slim"
                              >
                                Delete
                              </Button>
                            </InlineStack>

                            {/* Trigger Type Selection */}
                            <div>
                              <Text as="label" variant="bodySm" fontWeight="semibold">Trigger Type</Text>
                              <div style={{ marginTop: '8px' }}>
                                <ChoiceList
                                  title=""
                                  choices={[
                                    { label: 'All Products', value: 'all_products', helpText: 'Fallback rule - Shows upsells only when no Triggered rules match' },
                                    { label: 'Triggered Products', value: 'triggered_products', helpText: 'Higher priority - Shows upsells when specific products are in cart' },
                                  ]}
                                  selected={[rule.triggerType]}
                                  onChange={(value) => updateManualRule(rule.ruleId, { triggerType: value[0] })}
                                />
                              </div>
                            </div>

                            {/* Triggered Products/Collections Section */}
                            {rule.triggerType === 'triggered_products' && (
                              <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                                <BlockStack gap="200">
                                  <InlineStack align="space-between" blockAlign="center">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Badge tone="info">Trigger</Badge>
                                      <Text variant="bodySm" fontWeight="semibold">When these items are in cart</Text>
                                    </div>
                                      <Button onClick={() => handleOpenTriggeredProductsModal(rule.ruleId)} size="slim">
                                      {((rule.triggerItems?.products?.length || 0) + (rule.triggerItems?.collections?.length || 0)) > 0
                                        ? `${(rule.triggerItems?.products?.length || 0) + (rule.triggerItems?.collections?.length || 0)} Selected`
                                        : 'Select Trigger Items'}
                                    </Button>
                                  </InlineStack>

                                  {/* Display selected trigger products */}
                                  {rule.triggerItems?.products && rule.triggerItems.products.length > 0 && (
                                    <div>
                                      <Text variant="bodySm" tone="subdued">Trigger Products:</Text>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                        {rule.triggerItems.products.map(productId => {
                                          const product = shopifyProducts.find(p => p.id === productId);
                                          if (!product) return null;
                                          return (
                                            <div
                                              key={productId}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 8px',
                                                backgroundColor: '#eff6ff',
                                                borderRadius: '4px',
                                                border: '1px solid #3b82f6',
                                                fontSize: '11px',
                                              }}
                                            >
                                              <span>{product.image}</span>
                                              <span>{product.title}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Display selected trigger collections */}
                                  {rule.triggerItems?.collections && rule.triggerItems.collections.length > 0 && (
                                    <div>
                                      <Text variant="bodySm" tone="subdued">Trigger Collections:</Text>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                        {rule.triggerItems.collections.map(collectionId => {
                                          const collection = mockCollections.find(c => c.id === collectionId);
                                          if (!collection) return null;
                                          return (
                                            <div
                                              key={collectionId}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 8px',
                                                backgroundColor: '#eff6ff',
                                                borderRadius: '4px',
                                                border: '1px solid #3b82f6',
                                                fontSize: '11px',
                                              }}
                                            >
                                              <span>🏷️</span>
                                              <span>{collection.title}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </BlockStack>
                              </div>
                            )}

                            {/* Upsell Products Section for this Rule */}
                            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #10b981' }}>
                              <BlockStack gap="200">
                                <InlineStack align="space-between" blockAlign="center">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Badge tone="success">Upsell</Badge>
                                    <Text variant="bodySm" fontWeight="semibold">Show these products</Text>
                                  </div>
                                  <Button onClick={() => handleOpenUpsellProductsModal(rule.ruleId)} variant="primary" size="slim">
                                    {(rule.upsellItems?.products?.length || 0) > 0
                                      ? `${rule.upsellItems.products.length} Selected`
                                      : 'Add Upsell Products'}
                                  </Button>
                                </InlineStack>

                                {rule.upsellItems?.products && rule.upsellItems.products.length > 0 ? (
                                  <div>
                                    <Text variant="bodySm" tone="subdued">Upsell Products:</Text>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                      {rule.upsellItems.products.map(productId => {
                                        const product = shopifyProducts.find(p => p.id === productId);
                                        if (!product) return null;
                                        return (
                                          <div
                                            key={productId}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              padding: '4px 8px',
                                              backgroundColor: '#fff',
                                              borderRadius: '4px',
                                              border: '1px solid #10b981',
                                              fontSize: '11px',
                                            }}
                                          >
                                            <span>{product.image}</span>
                                            <span style={{ fontWeight: '500' }}>{product.title}</span>
                                            <span style={{ color: '#6b7280' }}>₹{product.price}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <Text variant="bodySm" tone="subdued">No upsell products selected yet</Text>
                                )}
                              </BlockStack>
                            </div>
                          </BlockStack>
                        </div>
                      ))}
                    </BlockStack>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                      <Text variant="bodyMd" tone="subdued">
                        No rules created yet. Click "Add Rule" to create your first upsell rule.
                      </Text>
                    </div>
                  )}
                </BlockStack>
              </Card>
            )}

            {/* Upsell Content & Design */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Upsell Content & Design</Text>
                
                {/* Rich Text Title */}
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="label" variant="bodyMd" fontWeight="semibold">Upsell Title</Text>
                    <InlineStack gap="100">
                      <button
                        onClick={() => updateUpsellTitleFormatting('bold')}
                        style={{
                          padding: '6px 10px',
                          border: `2px solid ${upsellConfig.upsellTitle?.formatting?.bold ? '#2c6ecb' : '#d1d5db'}`,
                          borderRadius: '4px',
                          backgroundColor: upsellConfig.upsellTitle?.formatting?.bold ? '#f0f7ff' : '#fff',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '13px',
                        }}
                      >
                        B
                      </button>
                      <button
                        onClick={() => updateUpsellTitleFormatting('italic')}
                        style={{
                          padding: '6px 10px',
                          border: `2px solid ${upsellConfig.upsellTitle?.formatting?.italic ? '#2c6ecb' : '#d1d5db'}`,
                          borderRadius: '4px',
                          backgroundColor: upsellConfig.upsellTitle?.formatting?.italic ? '#f0f7ff' : '#fff',
                          cursor: 'pointer',
                          fontStyle: 'italic',
                          fontSize: '13px',
                        }}
                      >
                        I
                      </button>
                      <button
                        onClick={() => updateUpsellTitleFormatting('underline')}
                        style={{
                          padding: '6px 10px',
                          border: `2px solid ${upsellConfig.upsellTitle?.formatting?.underline ? '#2c6ecb' : '#d1d5db'}`,
                          borderRadius: '4px',
                          backgroundColor: upsellConfig.upsellTitle?.formatting?.underline ? '#f0f7ff' : '#fff',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontSize: '13px',
                        }}
                      >
                        U
                      </button>
                    </InlineStack>
                  </InlineStack>
                  <TextField
                    value={upsellConfig.upsellTitle?.text || ''}
                    onChange={(value) => updateUpsellTitleText(value)}
                    autoComplete="off"
                  />
                  <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <Text as="p" variant="bodySm" style={getTitleStyle()}>
                      Preview: {upsellConfig.upsellTitle?.text || 'Recommended for you'}
                    </Text>
                  </div>
                </BlockStack>

                {/* Button Style */}
                <BlockStack gap="200">
                  <Text as="label" variant="bodyMd" fontWeight="semibold">Add to cart button style</Text>
                  <ChoiceList
                    title=""
                    choices={[
                      { label: 'Box', value: 'box' },
                      { label: 'Circle', value: 'circle' },
                    ]}
                    selected={[upsellConfig.buttonStyle]}
                    onChange={(value) => updateUpsellConfig('buttonStyle', value[0])}
                  />
                </BlockStack>

                {/* Position */}
                <BlockStack gap="200">
                  <Text as="label" variant="bodyMd" fontWeight="semibold">Position</Text>
                  <ChoiceList
                    title=""
                    choices={[
                      { label: 'Top of cart items', value: 'top' },
                      { label: 'Bottom of cart items', value: 'bottom' },
                    ]}
                    selected={[upsellConfig.position]}
                    onChange={(value) => updateUpsellConfig('position', value[0])}
                  />
                </BlockStack>

                {/* Layout */}
                <BlockStack gap="200">
                  <Text as="label" variant="bodyMd" fontWeight="semibold">Layout</Text>
                  <ChoiceList
                    title=""
                    choices={[
                      { label: 'Grid', value: 'grid' },
                      { label: 'Carousel', value: 'carousel' },
                    ]}
                    selected={[upsellConfig.layout]}
                    onChange={(value) => updateUpsellConfig('layout', value[0])}
                  />
                </BlockStack>

                {/* Alignment */}
                <BlockStack gap="200">
                  <Text as="label" variant="bodyMd" fontWeight="semibold">Alignment</Text>
                  <ChoiceList
                    title=""
                    choices={[
                      { label: 'Horizontal', value: 'horizontal' },
                      { label: 'Vertical', value: 'vertical' },
                    ]}
                    selected={[upsellConfig.alignment]}
                    onChange={(value) => {
                      updateUpsellConfig('alignment', value[0]);
                      // Show navigation arrows only for horizontal
                      if (value[0] === 'vertical') {
                        updateUpsellConfig('showNavigationArrows', false);
                      } else {
                        updateUpsellConfig('showNavigationArrows', true);
                      }
                    }}
                  />
                </BlockStack>

                {/* Navigation Arrows (only for horizontal) */}
                {upsellConfig.alignment === 'horizontal' && (
                  <Checkbox
                    label="Show left/right navigation arrows"
                    checked={upsellConfig.showNavigationArrows}
                    onChange={(value) => updateUpsellConfig('showNavigationArrows', value)}
                  />
                )}

                {/* Product Reviews */}
                <Checkbox
                  label="Show product reviews"
                  checked={upsellConfig.showProductReviews}
                  onChange={(value) => updateUpsellConfig('showProductReviews', value)}
                />
              </BlockStack>
            </Card>

            {/* Actions */}
            <Card>
              <InlineStack align="end" gap="200">
                <Button onClick={handleCancelUpsellConfig} disabled={isSaving}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveUpsellConfig} loading={isSaving} disabled={isSaving}>
                  Save Configuration
                </Button>
              </InlineStack>
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
    const cartProductIds = mockCartItems.map(item => item.productId).filter(Boolean);
    const cartCollectionIds = cartProductIds.flatMap((productId) => {
      const product = shopifyProducts.find(p => p.id === productId);
      return product?.collections || [];
    });

    const sortedRules = [...manualUpsellRules].sort((a, b) => a.priority - b.priority);
    const matchedRule = sortedRules.find((rule) => {
      if (rule.triggerType === 'all') return true;
      if (rule.triggerSource === 'products') {
        return rule.triggerProductIds.some(id => cartProductIds.includes(id));
      }
      if (rule.triggerSource === 'collections') {
        return rule.triggerCollectionIds.some(id => cartCollectionIds.includes(id));
      }
      return false;
    });

    const recommendedProductIds = useAIUpsells
      ? (upsellSettings.products || [])
      : (matchedRule?.upsellProductIds || []);
    const recommendedProducts = recommendedProductIds
      .map(id => shopifyProducts.find(p => p.id === id))
      .filter(Boolean);

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
              
              if (upsellConfig.upsellMode === 'manual' && upsellConfig.manualRules && upsellConfig.manualRules.length > 0) {
                const cartProductIds = mockCartItems.map(item => item.productId).filter(Boolean);
                console.log('[Upsell Preview] Cart Product IDs:', cartProductIds);
                
                // PRIORITY 1: Check Triggered Product rules first
                const triggeredUpsells = new Set();
                const allProductsUpsells = new Set();
                
                for (const rule of upsellConfig.manualRules) {
                  if (rule.triggerType === 'triggered_products') {
                    // Check if any cart product matches trigger products
                    const hasMatch = rule.triggerItems?.products?.some(pid => cartProductIds.includes(pid));
                    console.log('[Upsell Preview] Triggered Rule Check:', {
                      ruleId: rule.ruleId,
                      triggerProducts: rule.triggerItems?.products,
                      hasMatch,
                      upsellProducts: rule.upsellItems?.products
                    });
                    if (hasMatch && rule.upsellItems?.products) {
                      rule.upsellItems.products.forEach(pid => triggeredUpsells.add(pid));
                    }
                  } else if (rule.triggerType === 'all_products') {
                    // Collect All Products upsells as fallback
                    console.log('[Upsell Preview] All Products Rule:', {
                      ruleId: rule.ruleId,
                      upsellProducts: rule.upsellItems?.products
                    });
                    if (rule.upsellItems?.products) {
                      rule.upsellItems.products.forEach(pid => allProductsUpsells.add(pid));
                    }
                  }
                }
                
                console.log('[Upsell Preview] Results:', {
                  triggeredUpsellsCount: triggeredUpsells.size,
                  allProductsUpsellsCount: allProductsUpsells.size,
                  triggeredUpsells: Array.from(triggeredUpsells),
                  allProductsUpsells: Array.from(allProductsUpsells)
                });
                
                // PRIORITY 2: Use Triggered upsells if any matched, otherwise use All Products as fallback
                if (triggeredUpsells.size > 0) {
                  productsToShow = Array.from(triggeredUpsells);
                  console.log('[Upsell Preview] Showing TRIGGERED upsells:', productsToShow);
                } else {
                  productsToShow = Array.from(allProductsUpsells);
                  console.log('[Upsell Preview] Showing ALL PRODUCTS upsells (fallback):', productsToShow);
                }
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
                      const product = shopifyProducts.find(p => p.id === productId);
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
              <div style={{ padding: '12px' }}>
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
                <div ref={couponSliderRef} style={{ display: 'flex', gap: '8px', paddingBottom: '4px', scrollBehavior: 'smooth', overflowX: 'hidden' }}>
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
                          minWidth: '280px',
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
                        
                        {/* Main content - horizontal layout */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
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
                          minWidth: '280px',
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
                          minWidth: '280px',
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

      {/* Triggered Products Modal */}
      <Modal
        open={showTriggeredProductsModal}
        onClose={() => {
          setShowTriggeredProductsModal(false);
          setSelectedProductIds([]);
          setSelectedCollectionIds([]);
          setProductSearchQuery('');
          setCollectionSearchQuery('');
          setModalActiveTab('products');
        }}
        title="Select Triggered Products / Collections"
        large
        primaryAction={{
          content: 'Save',
          onAction: handleSaveTriggeredProducts,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => {
              setShowTriggeredProductsModal(false);
              setSelectedProductIds([]);
              setSelectedCollectionIds([]);
              setProductSearchQuery('');
              setCollectionSearchQuery('');
              setModalActiveTab('products');
            },
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e5e7eb' }}>
              <button
                onClick={() => setModalActiveTab('products')}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: modalActiveTab === 'products' ? '3px solid #2c6ecb' : '3px solid transparent',
                  color: modalActiveTab === 'products' ? '#2c6ecb' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  marginBottom: '-2px',
                }}
              >
                Select Product
              </button>
              <button
                onClick={() => setModalActiveTab('collections')}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: modalActiveTab === 'collections' ? '3px solid #2c6ecb' : '3px solid transparent',
                  color: modalActiveTab === 'collections' ? '#2c6ecb' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  marginBottom: '-2px',
                }}
              >
                Select Collection
              </button>
            </div>

            {/* Products Tab */}
            {modalActiveTab === 'products' && (
              <BlockStack gap="300">
                <TextField
                  label=""
                  placeholder="Search Products..."
                  value={productSearchQuery}
                  onChange={setProductSearchQuery}
                  autoComplete="off"
                />

                <InlineStack gap="300" blockAlign="center" wrap={false}>
                  <Checkbox
                    label="Exclude archived"
                    checked={excludeArchived}
                    onChange={setExcludeArchived}
                  />
                  <Checkbox
                    label="Exclude draft"
                    checked={excludeDraft}
                    onChange={setExcludeDraft}
                  />
                  <Checkbox
                    label="Exclude out of stock"
                    checked={excludeOutOfStock}
                    onChange={setExcludeOutOfStock}
                  />
                </InlineStack>

                <InlineStack align="space-between" blockAlign="center">
                  <Text as="span" tone="subdued">{selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected</Text>
                  <Checkbox
                    label="Show only selected"
                    checked={showOnlySelected}
                    onChange={setShowOnlySelected}
                  />
                </InlineStack>

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
            )}

            {/* Collections Tab */}
            {modalActiveTab === 'collections' && (
              <BlockStack gap="300">
                <TextField
                  label=""
                  placeholder="Search Collections..."
                  value={collectionSearchQuery}
                  onChange={setCollectionSearchQuery}
                  autoComplete="off"
                />

                <InlineStack align="space-between" blockAlign="center">
                  <Text as="span" tone="subdued">{selectedCollectionIds.length} collection{selectedCollectionIds.length !== 1 ? 's' : ''} selected</Text>
                  <Checkbox
                    label="Show only selected"
                    checked={showOnlySelectedCollections}
                    onChange={setShowOnlySelectedCollections}
                  />
                </InlineStack>

                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  {filteredCollections.map((collection) => (
                    <div
                      key={collection.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: selectedCollectionIds.includes(collection.id) ? '#f0f9ff' : '#fff',
                      }}
                    >
                      <Checkbox
                        checked={selectedCollectionIds.includes(collection.id)}
                        onChange={() => toggleCollectionSelection(collection.id)}
                        label={`🏷️ ${collection.title}`}
                      />
                    </div>
                  ))}
                </div>
              </BlockStack>
            )}

            {/* Common Selected Items Box */}
            {(selectedProductIds.length > 0 || selectedCollectionIds.length > 0) && (
              <div style={{ padding: '12px', backgroundColor: '#f0f7ff', borderRadius: '6px', border: '1px solid #2c6ecb' }}>
                <Text variant="bodyMd" fontWeight="semibold">Selected Items ({selectedProductIds.length + selectedCollectionIds.length})</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {selectedProductIds.map(productId => {
                    const product = shopifyProducts.find(p => p.id === productId);
                    if (!product) return null;
                    return (
                      <div
                        key={productId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          border: '1px solid #2c6ecb',
                          fontSize: '12px',
                        }}
                      >
                        <span>{product.image}</span>
                        <span>{product.title}</span>
                      </div>
                    );
                  })}
                  {selectedCollectionIds.map(collectionId => {
                    const collection = mockCollections.find(c => c.id === collectionId);
                    if (!collection) return null;
                    return (
                      <div
                        key={collectionId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          border: '1px solid #2c6ecb',
                          fontSize: '12px',
                        }}
                      >
                        <span>🏷️</span>
                        <span>{collection.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Upsell Products Modal */}
      <Modal
        open={showUpsellProductsModal}
        onClose={() => {
          setShowUpsellProductsModal(false);
          setSelectedProductIds([]);
          setProductSearchQuery('');
        }}
        title="Select Upsell Products"
        large
        primaryAction={{
          content: 'Save',
          onAction: handleSaveUpsellProducts,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => {
              setShowUpsellProductsModal(false);
              setSelectedProductIds([]);
              setProductSearchQuery('');
            },
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label=""
              placeholder="Search Products..."
              value={productSearchQuery}
              onChange={setProductSearchQuery}
              autoComplete="off"
            />

            <InlineStack gap="300" blockAlign="center" wrap={false}>
              <Checkbox
                label="Exclude archived"
                checked={excludeArchived}
                onChange={setExcludeArchived}
              />
              <Checkbox
                label="Exclude draft"
                checked={excludeDraft}
                onChange={setExcludeDraft}
              />
              <Checkbox
                label="Exclude out of stock"
                checked={excludeOutOfStock}
                onChange={setExcludeOutOfStock}
              />
            </InlineStack>

            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" tone="subdued">{selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected</Text>
              <Checkbox
                label="Show only selected"
                checked={showOnlySelected}
                onChange={setShowOnlySelected}
              />
            </InlineStack>

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

      {/* Manual Upsell Configuration Modal */}
      <Modal
        open={showManualUpsellModal}
        onClose={() => setShowManualUpsellModal(false)}
        title="Configure Manual Upsells"
        large
        primaryAction={{
          content: 'Update',
          onAction: () => {
            // Save the manual upsell rules
            handleApiUpdate('/api/upsell', {
              ...upsellSettings,
              manualRules: manualUpsellRules,
            });
            setShowManualUpsellModal(false);
          },
          disabled: !isUpsellConfigValid(),
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowManualUpsellModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {/* Two Column Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e5e7eb',
            }}>
              <Text variant="headingMd" as="h3" alignment="center">Trigger Product</Text>
              <Text variant="headingMd" as="h3" alignment="center">Upsell Product</Text>
            </div>

            {/* Add New Upsell Button */}
            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={handleAddUpsellRule}
            >
              Add New Upsell
            </Button>

            {/* Upsell Rules List */}
            {manualUpsellRules.length === 0 && (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center', 
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}>
                <Text tone="subdued" as="p">
                  No upsell rules configured yet. Click "Add New Upsell" to create your first rule.
                </Text>
              </div>
            )}

            {manualUpsellRules.map((rule, index) => (
              <div
                key={rule.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '16px' }}>
                    <span style={{ cursor: 'grab' }}>⋮⋮</span>
                    <Text as="span" variant="bodySm" tone="subdued">Priority #{index + 1}</Text>
                  </div>
                  <button
                    onClick={() => handleRemoveUpsellRule(rule.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      color: '#6b7280',
                    }}
                    aria-label="Remove rule"
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
                  {/* LEFT: Trigger Product Section */}
                  <div>
                    <BlockStack gap="300">
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateUpsellRule(rule.id, { triggerType: 'specific' })}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: `2px solid ${rule.triggerType === 'specific' ? '#2c6ecb' : '#e5e7eb'}`,
                            borderRadius: '6px',
                            backgroundColor: rule.triggerType === 'specific' ? '#f0f7ff' : '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: rule.triggerType === 'specific' ? '600' : '400',
                          }}
                        >
                          Specific Trigger
                        </button>
                        <button
                          onClick={() => handleUpdateUpsellRule(rule.id, { triggerType: 'all' })}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: `2px solid ${rule.triggerType === 'all' ? '#2c6ecb' : '#e5e7eb'}`,
                            borderRadius: '6px',
                            backgroundColor: rule.triggerType === 'all' ? '#f0f7ff' : '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: rule.triggerType === 'all' ? '600' : '400',
                          }}
                        >
                          All Products
                        </button>
                      </div>

                      {rule.triggerType === 'specific' && (
                        <>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleUpdateUpsellRule(rule.id, { triggerSource: 'products', triggerCollectionIds: [] })}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: `2px solid ${rule.triggerSource === 'products' ? '#2c6ecb' : '#e5e7eb'}`,
                                borderRadius: '6px',
                                backgroundColor: rule.triggerSource === 'products' ? '#f0f7ff' : '#fff',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: rule.triggerSource === 'products' ? '600' : '400',
                              }}
                            >
                              Products
                            </button>
                            <button
                              onClick={() => handleUpdateUpsellRule(rule.id, { triggerSource: 'collections', triggerProductIds: [] })}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: `2px solid ${rule.triggerSource === 'collections' ? '#2c6ecb' : '#e5e7eb'}`,
                                borderRadius: '6px',
                                backgroundColor: rule.triggerSource === 'collections' ? '#f0f7ff' : '#fff',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: rule.triggerSource === 'collections' ? '600' : '400',
                              }}
                            >
                              Collections
                            </button>
                          </div>

                          {rule.triggerSource === 'products' && (
                            <>
                              <Button
                                onClick={() => handleOpenTriggerPicker(rule.id)}
                                size="medium"
                              >
                                {rule.triggerProductIds.length > 0
                                  ? `${rule.triggerProductIds.length} Product${rule.triggerProductIds.length !== 1 ? 's' : ''} Selected`
                                  : 'Select Trigger Products'}
                              </Button>

                              {rule.triggerProductIds.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {rule.triggerProductIds.map(productId => {
                                    const product = shopifyProducts.find(p => p.id === productId);
                                    if (!product) return null;
                                    return (
                                      <div
                                        key={productId}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '4px 8px',
                                          backgroundColor: '#f3f4f6',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                        }}
                                      >
                                        <span>{product.image}</span>
                                        <span>{product.title}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}

                          {rule.triggerSource === 'collections' && (
                            <>
                              <Button
                                onClick={() => handleOpenCollectionPicker(rule.id)}
                                size="medium"
                              >
                                {rule.triggerCollectionIds.length > 0
                                  ? `${rule.triggerCollectionIds.length} Collection${rule.triggerCollectionIds.length !== 1 ? 's' : ''} Selected`
                                  : 'Select Trigger Collections'}
                              </Button>

                              {rule.triggerCollectionIds.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {rule.triggerCollectionIds.map(collectionId => {
                                    const collection = mockCollections.find(c => c.id === collectionId);
                                    if (!collection) return null;
                                    return (
                                      <div
                                        key={collectionId}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '4px 8px',
                                          backgroundColor: '#f3f4f6',
                                          borderRadius: '4px',
                                          fontSize: '12px',
                                        }}
                                      >
                                        <span>🏷️</span>
                                        <span>{collection.title}</span>
                                        <button
                                          onClick={() => {
                                            const updated = rule.triggerCollectionIds.filter(id => id !== collectionId);
                                            handleUpdateUpsellRule(rule.id, { triggerCollectionIds: updated });
                                          }}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: '#6b7280',
                                          }}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {rule.triggerType === 'all' && (
                        <div style={{
                          padding: '12px',
                          backgroundColor: '#f0f7ff',
                          borderRadius: '6px',
                          border: '1px solid #2c6ecb',
                        }}>
                          <Text tone="info" as="p" variant="bodySm">
                            This upsell will trigger for any product added to cart
                          </Text>
                        </div>
                      )}
                    </BlockStack>
                  </div>

                  {/* RIGHT: Upsell Product Section */}
                  <div>
                    <BlockStack gap="300">
                      <Button
                        onClick={() => handleOpenUpsellPicker(rule.id)}
                        size="medium"
                      >
                        {rule.upsellProductIds.length > 0
                          ? `${rule.upsellProductIds.length} Product${rule.upsellProductIds.length !== 1 ? 's' : ''} Selected`
                          : 'Add Upsell Product'}
                      </Button>

                      {rule.upsellProductIds.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {rule.upsellProductIds.map(productId => {
                            const product = shopifyProducts.find(p => p.id === productId);
                            if (!product) return null;
                            return (
                              <div
                                key={productId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 8px',
                                  backgroundColor: '#f3f4f6',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                }}
                              >
                                <span>{product.image}</span>
                                <span>{product.title}</span>
                                <button
                                  onClick={() => {
                                    const updated = rule.upsellProductIds.filter(id => id !== productId);
                                    handleUpdateUpsellRule(rule.id, { upsellProductIds: updated });
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#6b7280',
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </BlockStack>
                  </div>
                </div>

                {(() => {
                  const errors = getRuleValidation(rule);
                  if (!errors.triggerMissing && !errors.upsellMissing) return null;
                  return (
                    <div style={{ marginTop: '12px', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                      {errors.triggerMissing && (
                        <Text tone="critical" as="p" variant="bodySm">Select a trigger product or collection.</Text>
                      )}
                      {errors.upsellMissing && (
                        <Text tone="critical" as="p" variant="bodySm">Select at least one upsell product.</Text>
                      )}
                    </div>
                  );
                })()}

                {/* Row Actions */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '16px', 
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      size="slim"
                      onClick={() => handleMoveRule(rule.id, 'up')}
                      disabled={index === 0}
                    >
                      ↑ Move Up
                    </Button>
                    <Button
                      size="slim"
                      onClick={() => handleMoveRule(rule.id, 'down')}
                      disabled={index === manualUpsellRules.length - 1}
                    >
                      ↓ Move Down
                    </Button>
                  </div>
                  <Button
                    size="slim"
                    tone="critical"
                    onClick={() => handleRemoveUpsellRule(rule.id)}
                  >
                    Remove Rule
                  </Button>
                </div>
              </div>
            ))}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Collection Picker Modal */}
      <Modal
        open={showCollectionPicker}
        onClose={() => {
          setShowCollectionPicker(false);
          setCurrentUpsellRule(null);
          setSelectedCollectionIds([]);
          setCollectionSearchQuery('');
          setShowOnlySelectedCollections(false);
        }}
        title="Select Collections"
        primaryAction={{
          content: 'Save',
          onAction: handleSaveSelectedCollections,
        }}
        secondaryActions={[
          {
            content: 'Close',
            onAction: () => {
              setShowCollectionPicker(false);
              setCurrentUpsellRule(null);
              setSelectedCollectionIds([]);
              setCollectionSearchQuery('');
              setShowOnlySelectedCollections(false);
            },
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label=""
              placeholder="Search Collections..."
              value={collectionSearchQuery}
              onChange={setCollectionSearchQuery}
              autoComplete="off"
            />

            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" tone="subdued">{selectedCollectionIds.length} collection selected</Text>
              <Checkbox
                label="Show only selected"
                checked={showOnlySelectedCollections}
                onChange={setShowOnlySelectedCollections}
              />
            </InlineStack>

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
              {filteredCollections.map((collection) => (
                <div
                  key={collection.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: selectedCollectionIds.includes(collection.id) ? '#f0f9ff' : '#fff',
                  }}
                >
                  <Checkbox
                    checked={selectedCollectionIds.includes(collection.id)}
                    onChange={() => toggleCollectionSelection(collection.id)}
                    label={collection.title}
                  />
                </div>
              ))}
            </div>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Product Picker Modal */}
      <Modal
        open={showProductPicker}
        onClose={() => {
          setShowProductPicker(false);
          setCurrentTierForProducts(null);
          setCurrentUpsellRule(null);
          setUpsellPickerMode(null);
          setSelectedProductIds([]);
          setProductSearchQuery('');
          setShowOnlySelected(false);
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
              setCurrentUpsellRule(null);
              setUpsellPickerMode(null);
              setSelectedProductIds([]);
              setProductSearchQuery('');
              setShowOnlySelected(false);
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

            <InlineStack gap="300" blockAlign="center" wrap={false}>
              <Checkbox
                label="Exclude archived"
                checked={excludeArchived}
                onChange={setExcludeArchived}
              />
              <Checkbox
                label="Exclude draft"
                checked={excludeDraft}
                onChange={setExcludeDraft}
              />
              <Checkbox
                label="Exclude out of stock"
                checked={excludeOutOfStock}
                onChange={setExcludeOutOfStock}
              />
            </InlineStack>

            {/* Selection Info */}
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" tone="subdued">{selectedProductIds.length} item selected</Text>
              <Checkbox
                label="Show only selected"
                checked={showOnlySelected}
                onChange={setShowOnlySelected}
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
    </Frame>
  );
}

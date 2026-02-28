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
  Tag,
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
  ColorPicker,
  Popover,
  hsbToRgb,
  rgbToHsb,
  rgbToHex,
  Banner,
  Spinner,
  RadioButton,
  ContextualSaveBar,
} from '@shopify/polaris';
import {
  sampleCoupons,
  COUPON_STYLES,
  COUPON_STYLE_METADATA,
  globalCouponStyle,
  saveUpsellConfig,
  UPSELL_STYLES,
  UPSELL_STYLE_METADATA,
  DEFAULT_UPSELL_CONFIG,
  getUpsellConfig,
  evaluateUpsellRules,
  trackUpsellEvent
} from '../services/api.cart-settings.shared';

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
    { id: 'sp-6', title: 'Premium Hoodie', price: 50, quantity: 1, productId: 'sp-6' },
    { id: 'sp-2', title: 'Classic T-Shirt', price: 25, quantity: 2, productId: 'sp-2' },
  ],
};

// ==========================================
// COLOR UTILITIES
// ==========================================
// ==========================================
// COLOR UTILITIES
// ==========================================
// Robust hex to HSB conversion
const hexToHsb = (hex) => {
  if (!hex || typeof hex !== 'string') return { hue: 0, saturation: 0, brightness: 0 };

  let fullHex = hex.replace('#', '');
  if (fullHex.length === 3) {
    fullHex = fullHex.split('').map(char => char + char).join('');
  }

  if (fullHex.length !== 6) return { hue: 0, saturation: 0, brightness: 0 };

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  return rgbToHsb({ red: r, green: g, blue: b });
};

const ColorPickerField = ({ label, value, onChange }) => {
  const [popoverActive, setPopoverActive] = useState(false);
  const [color, setColor] = useState(hexToHsb(value || '#000000'));

  // Sync internal state when external value changes (and we are not dragging ideally, but tricky)
  useEffect(() => {
    setColor(hexToHsb(value || '#000000'));
  }, [value]);
  const handleColorChange = (newColor) => {
    setColor(newColor);
    const rgb = hsbToRgb(newColor);
    const hex = rgbToHex(rgb);
    onChange(hex);
  };

  const activator = (
    <Button onClick={() => setPopoverActive((active) => !active)}>
      <InlineStack gap="200" blockAlign="center">
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: value || '#000000',
          border: '1px solid #e1e3e5',
          borderRadius: '6px',
          flexShrink: 0
        }} />
        <Text variant="bodyMd">{value || '#000000'}</Text>
      </InlineStack>
    </Button>
  );

  return (
    <BlockStack gap="100">
      <Text variant="bodyMd" fontWeight="semibold">{label}</Text>
      <Popover
        active={popoverActive}
        activator={activator}
        onClose={() => setPopoverActive(false)}
        preferredAlignment="left"
        fluidContent
        sectioned
      >
        <ColorPicker onChange={handleColorChange} color={color} />
      </Popover>
    </BlockStack>
  );
};

// Initial empty states for hydration from API
const initialCartData = { cartValue: 0, totalQuantity: 0, items: [] };
const initialProducts = [];
const initialMilestones = [];

// Mock API functions - fetches from route endpoints
const mockApi = {
  getCartData: async () => {
    try {
      const response = await fetch(`/api/sample?shop=${SHOP_ID}`);
      const data = await response.json();
      return data.cartData || initialCartData;
    } catch {
      return initialCartData;
    }
  },
  getMilestones: async (mode = 'amount') => {
    try {
      const response = await fetch(`/api/sample?shop=${SHOP_ID}`);
      const data = await response.json();
      return data.settings?.progressBar?.tiers || initialMilestones;
    } catch {
      return initialMilestones;
    }
  },
  getProducts: async (productIds) => {
    try {
      const response = await fetch(`/api/sample?shop=${SHOP_ID}`);
      const data = await response.json();
      const allProducts = [...(data.shopifyProducts || []), ...(data.cartData?.items || [])];
      return allProducts.filter(p => productIds.includes(p.id));
    } catch {
      return [];
    }
  },
  getShopifyProducts: async () => {
    try {
      const response = await fetch(`/api/sample?shop=${SHOP_ID}`);
      const data = await response.json();
      return data.shopifyProducts || [];
    } catch {
      return [];
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
  products,
  maxSelect = null,
  showCount = true,
}) {
  const selectedProducts = selected
    .map((id) => products.find((p) => p.id === id))
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
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              padding: '12px',
              border: selected.includes(product.id)
                ? '2px solid #2c6ecb'
                : '1px solid #f1f5f9',
              borderRadius: '12px',
              backgroundColor: selected.includes(product.id)
                ? '#f0f7ff'
                : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selected.includes(product.id)
                ? '0 4px 12px rgba(44, 110, 203, 0.1)'
                : '0 2px 4px rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
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
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid #f1f5f9',
              flexShrink: 0
            }}>
              {product.image && (product.image.startsWith('http') || product.image.startsWith('//')) ? (
                <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '24px' }}>{product.image || '📦'}</span>
              )}
            </div>

            <BlockStack gap="050" style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word'
              }}>
                <Text fontWeight="bold" variant="bodyMd">
                  {product.title}
                </Text>
              </div>
              <Text tone="subdued" variant="bodySm">
                ₹{product.price}
              </Text>
            </BlockStack>

            {selected.includes(product.id) && (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#2c6ecb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '14px'
              }}>
                ✓
              </div>
            )}
          </div>
        ))}
      </BlockStack>
    </BlockStack>
  );
}

// --- HELPER COMPONENT FOR VISUAL PREVIEW ---

const CouponPreview = ({ styleKey }) => {
  const dummyCoupon = {
    id: 'preview',
    code: 'SAVE20',
    label: styleKey === COUPON_STYLES.STYLE_3 ? 'Special Offer' : 'Summer Sale',
    description: 'Get 20% off your entire order',
    discountValue: 20,
    backgroundColor: styleKey === COUPON_STYLES.STYLE_1 ? '#1a1a2e' :
      styleKey === COUPON_STYLES.STYLE_2 ? '#ffffff' : '#6366f1',
    textColor: styleKey === COUPON_STYLES.STYLE_1 ? '#ffffff' :
      styleKey === COUPON_STYLES.STYLE_2 ? '#333333' : '#ffffff',
    iconUrl: styleKey === COUPON_STYLES.STYLE_1 ? '☀️' :
      styleKey === COUPON_STYLES.STYLE_2 ? '🎁' : '⚡',
  };

  // STYLE 1: Classic Banner
  if (styleKey === COUPON_STYLES.STYLE_1) {
    return (
      <div
        style={{
          minWidth: '220px',
          width: '100%',
          padding: '10px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: dummyCoupon.backgroundColor }}></div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: dummyCoupon.backgroundColor + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: dummyCoupon.backgroundColor,
          flexShrink: 0
        }}>
          {dummyCoupon.iconUrl}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{dummyCoupon.code}</p>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{dummyCoupon.label}</p>
        </div>
        <div
          style={{
            padding: '4px 8px',
            backgroundColor: '#f8fafc',
            color: '#475569',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '600',
            border: '1px solid #e2e8f0',
            whiteSpace: 'nowrap'
          }}
        >
          Apply
        </div>
      </div>
    );
  }

  // STYLE 2: Minimal Card
  if (styleKey === COUPON_STYLES.STYLE_2) {
    return (
      <div
        style={{
          minWidth: '160px',
          width: '100%',
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '8px',
          position: 'relative'
        }}
      >
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          backgroundColor: dummyCoupon.backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#333',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
          {dummyCoupon.iconUrl}
        </div>
        <div>
          <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{dummyCoupon.code}</p>
          <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>{dummyCoupon.description}</p>
        </div>
        <div
          style={{
            width: '100%',
            padding: '6px',
            marginTop: '4px',
            backgroundColor: '#1e293b',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '600',
            textAlign: 'center'
          }}
        >
          Apply Coupon
        </div>
      </div>
    );
  }

  // STYLE 3: Bold & Vibrant
  return (
    <div
      style={{
        minWidth: '220px',
        width: '100%',
        padding: '0',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div style={{
        backgroundColor: dummyCoupon.backgroundColor,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: dummyCoupon.textColor
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>{dummyCoupon.iconUrl}</span>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>{dummyCoupon.label}</span>
        </div>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '600'
        }}>
          {dummyCoupon.discountValue}% OFF
        </div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '4px 8px', backgroundColor: '#f8fafc' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#334155', fontFamily: 'monospace' }}>{dummyCoupon.code}</p>
        </div>
        <div
          style={{
            color: '#2563eb',
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px'
          }}
        >
          APPLY
        </div>
      </div>
    </div>
  );
};

function SelectedProductsDisplay({ productIds, label, products }) {
  const selectedProducts = productIds
    .map((id) => products.find((p) => p.id === id))
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
      <BlockStack gap="150">
        {selectedProducts.map((product) => (
          <div
            key={product.id}
            style={{
              padding: '12px',
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid #f1f5f9',
              flexShrink: 0
            }}>
              {product.image && (product.image.startsWith('http') || product.image.startsWith('//')) ? (
                <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '20px' }}>{product.image || '📦'}</span>
              )}
            </div>

            <BlockStack gap="050" style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word'
              }}>
                <Text fontWeight="bold" variant="bodySm">
                  {product.title}
                </Text>
              </div>
              <InlineStack gap="200" align="center">
                <Text tone="subdued" variant="bodySm">₹{product.price}</Text>
                <Badge tone="success">Selected</Badge>
              </InlineStack>
            </BlockStack>
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

const isEnabled = (val) => {
  return val == 1 || val == "1" || val === true || val === 'true' || val === 'active' || val === 'enabled';
};


export default function CartDrawerAdmin() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  // Global cart status
  const [cartStatus, setCartStatus] = useState(false); // false = inactive (per request)

  // Deactivate modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Preview state (what the right panel shows)
  const [previewCartState, setPreviewCartState] = useState(['items']); // 'empty' | 'items'

  // Selected feature tab
  const [selectedTab, setSelectedTab] = useState('progress-bar'); // 'progress-bar' | 'coupon' | 'upsell'

  // Feature enable states
  const [featureStates, setFeatureStates] = useState({
    progressBarEnabled: false,
    couponSliderEnabled: false,
    upsellEnabled: false,
  });

  // Progress Bar Editor State
  const [progressBarSettings, setProgressBarSettings] = useState({
    showOnEmpty: true,
    barBackgroundColor: '#E2E2E2',
    barForegroundColor: '#2563eb',
    fill_gradient: '',
    borderRadius: 8,
    completionText: 'Free shipping unlocked!',
    rewardsCalculation: ['cartTotal'], // 'cartTotal' or 'cartQuantity'
    maxTarget: 1000,
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
  const [cartData, setCartData] = useState(initialCartData);
  const [milestones, setMilestones] = useState([]);
  const [progressMode, setProgressMode] = useState('amount'); // 'amount' or 'quantity'
  const [selectedMilestoneProduct, setSelectedMilestoneProduct] = useState(null);
  const [selectedMilestoneText, setSelectedMilestoneText] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [currentTierForProducts, setCurrentTierForProducts] = useState(null);
  const [loadedShopifyProducts, setLoadedShopifyProducts] = useState([]);
  const [loadedShopifyCollections, setLoadedShopifyCollections] = useState([]);

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
  const [initialCouponSettings, setInitialCouponSettings] = useState({
    style: COUPON_STYLES.STYLE_2,
    position: 'top',
    layout: 'grid',
    alignment: 'horizontal'
  });

  // ==========================================
  // ACTIVE COUPONS STATE (from Dashboard API)
  // ==========================================
  const [activeCouponsFromAPI, setActiveCouponsFromAPI] = useState([]);
  const [selectedActiveCoupons, setSelectedActiveCoupons] = useState([]);
  const [couponOverrides, setCouponOverrides] = useState({});
  const [isLoadingActiveCoupons, setIsLoadingActiveCoupons] = useState(false);
  const [activeCouponWarning, setActiveCouponWarning] = useState(null);
  const [editingCouponSource, setEditingCouponSource] = useState(null); // 'sample' or 'active'
  const [isCouponSelectionModalOpen, setIsCouponSelectionModalOpen] = useState(false);
  const [tempSelectedCouponIds, setTempSelectedCouponIds] = useState([]);

  // ==========================================
  // UPSELL EDITOR STATE (RULE 1/2/3 CONFIG)
  // ==========================================
  const [upsellConfig, setUpsellConfig] = useState({
    enabled: false,
    useAI: true,
    showIfInCart: false,
    limit: 3,
    showReviews: false,
    activeTemplate: UPSELL_STYLES?.GRID || 'grid',
    upsellTitle: {
      text: 'Recommended for you',
      color: '#111827',
      formatting: { bold: false, italic: false, underline: false },
    },
    buttonText: 'Add to cart',
    position: 'bottom',
    direction: 'block',
    showOnEmptyCart: true,
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
  // LOAD APP CONFIGURATION FROM DB
  // ==========================================
  useEffect(() => {
    async function loadAppConfig() {
      try {
        console.log('[App] Loading initial configuration from /api/sample');
        const response = await fetch(`/api/sample?shop=${SHOP_ID}`, {
          headers: { 'X-Shop-ID': SHOP_ID }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log('✅ App configuration loaded:', data);

        if (data.success && data.settings) {
          const { settings, coupons } = data;

          // 1. Update Coupons (Normalize data from backend)
          if (coupons && coupons.length > 0) {
            const normalizedCoupons = coupons.map(c => ({
              ...c,
              enabled: c.enabled !== undefined ? c.enabled : (c.is_enabled !== undefined ? c.is_enabled : true),
              code: c.code || c.coupon_code_text || 'CODE',
              label: c.label || 'Coupon',
              description: c.description || c.description_text || '',
            }));

            setAllCoupons(normalizedCoupons);
            if (normalizedCoupons.length > 0) {
              setActiveCouponTab(normalizedCoupons[0].id);
              setEditingCoupon(JSON.parse(JSON.stringify(normalizedCoupons[0])));
              setOriginalCoupon(JSON.parse(JSON.stringify(normalizedCoupons[0])));
            }
          }

          // 2. Update Feature States
          setFeatureStates({
            progressBarEnabled: isEnabled(settings.progressBar?.enabled),
            couponSliderEnabled: isEnabled(settings.coupons?.enabled),
            upsellEnabled: isEnabled(settings.upsell?.enabled),
          });

          // 3. Update Progress Bar - Ensure defaults exist
          if (settings.progressBar) {
            const pbData = settings.progressBar;
            const normalizedPB = {
              enabled: isEnabled(pbData.enabled),
              mode: pbData.mode || 'amount',
              showOnEmpty: pbData.showOnEmpty !== false,
              barBackgroundColor: pbData.barBackgroundColor || pbData.track_color || '#e2e8f0',
              barForegroundColor: pbData.barForegroundColor || pbData.fill_color || '#2563eb',
              fill_gradient: pbData.fill_gradient || '',
              borderRadius: pbData.borderRadius || 8,
              completionText: pbData.completionText || '🎉 All Rewards Unlocked!',
              maxTarget: pbData.maxTarget || 1000,
              placement: pbData.placement || 'top',
              tiers: (pbData.tiers || []).map(t => ({
                id: t.id,
                minValue: t.minValue || 0,
                description: t.description || 'Reward',
                products: t.products || [],
                rewardType: t.rewardType || 'product'
              })).sort((a, b) => a.minValue - b.minValue)
            };
            setProgressBarSettings(normalizedPB);
            setProgressMode(normalizedPB.mode);
          }

          // 4. Update Upsell - Merge with defaults
          if (settings.upsell) {
            const mergedUpsell = {
              enabled: false,
              useAI: true,
              showOnEmptyCart: true,
              limit: 3,
              position: 'bottom',
              ...settings.upsell
            };
            setUpsellConfig(mergedUpsell);
            setUpsellRulesConfig(mergedUpsell);
            setInitialUpsellConfig(mergedUpsell);
            setManualUpsellRules(mergedUpsell.manualRules || []);
            setInitialManualUpsellRules(JSON.parse(JSON.stringify(mergedUpsell.manualRules || [])));
          }

          // 5. Update Style Settings
          if (settings.coupons) {
            setInitialCouponSettings({
              style: settings.coupons.selectedStyle || COUPON_STYLES.STYLE_2,
              position: settings.coupons.position || 'top',
              layout: settings.coupons.layout || 'grid',
              alignment: settings.coupons.alignment || 'horizontal'
            });
            setSelectedCouponStyle(settings.coupons.selectedStyle || COUPON_STYLES.STYLE_2);
            setCouponPosition(settings.coupons.position || 'top');
            setCouponLayout(settings.coupons.layout || 'grid');
            setCouponAlignment(settings.coupons.alignment || 'horizontal');
          }

          // 6. Load Coupon Selections (IDs + Overrides)
          if (data.couponSelections) {
            setSelectedActiveCoupons(data.couponSelections.selectedCouponIds || []);
            setCouponOverrides(data.couponSelections.couponOverrides || {});
            // Restore full coupon visual details from DB
            if (data.couponSelections.allCouponDetails && data.couponSelections.allCouponDetails.length > 0) {
              setAllCoupons(prev => {
                const merged = [...prev];
                data.couponSelections.allCouponDetails.forEach(saved => {
                  const existingIdx = merged.findIndex(c => c.id === saved.id);
                  if (existingIdx >= 0) {
                    merged[existingIdx] = { ...merged[existingIdx], ...saved };
                  } else {
                    merged.push(saved);
                  }
                });
                return merged;
              });
            }
          }

          if (data.cartStatus !== undefined) {
            setCartStatus(data.cartStatus);
          }

          // 7. Update Product & Cart Data
          if (data.shopifyProducts) {
            setLoadedShopifyProducts(data.shopifyProducts);
          }
          if (data.shopifyCollections) {
            setLoadedShopifyCollections(data.shopifyCollections);
          }
          if (data.cartData) {
            setCartData(data.cartData);
          }
        }
      } catch (error) {
        console.error('❌ Error loading app config:', error);
      }
    }
    loadAppConfig();
  }, []);

  // Mock items are now part of cartData loaded from API
  const mockCartItems = cartData.items || [];

  const cartTotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // ==========================================
  // HANDLERS
  // ==========================================

  const toggleFeature = (feature) => {
    const newValue = !featureStates[feature];
    setFeatureStates(prev => ({ ...prev, [feature]: newValue }));

    // Unify state for specific features
    if (feature === 'progressBarEnabled') {
      setProgressBarSettings(prev => ({ ...prev, enabled: newValue }));
    } else if (feature === 'couponSliderEnabled') {
      // Sync with any coupon-specific settings if they exist
    } else if (feature === 'upsellEnabled') {
      setUpsellConfig(prev => ({ ...prev, enabled: newValue }));
    }

    // Trigger immediate sync to sample API
    handleSaveAll(null, { [feature]: newValue });
  };

  const handleDeactivateClick = () => {
    if (cartStatus) {
      // If currently active, show confirmation modal
      setShowDeactivateModal(true);
    } else {
      // If currently inactive, just activate it
      setCartStatus(true);
      // Trigger sync to sample API when activating
      handleSaveAll(true);
    }
  };

  const handleConfirmDeactivate = () => {
    setCartStatus(false);
    setShowDeactivateModal(false);
    // Explicitly sync 'inactive' status if needed, though user only asked for activate
    handleSaveAll(false);
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
      id: Date.now(), // Use timestamp for unique ID instead of index
      rewardType: 'product',
      minValue: (progressBarSettings.rewardsCalculation && progressBarSettings.rewardsCalculation[0]) === 'cartTotal' ? 100 : 10,
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

  // Fetch active coupons from Shopify Admin API when Manage Coupons tab is opened
  React.useEffect(() => {
    if (couponSubTab === 'manage-coupons' && activeCouponsFromAPI.length === 0 && !isLoadingActiveCoupons) {
      const fetchActiveCoupons = async () => {
        setIsLoadingActiveCoupons(true);
        setActiveCouponWarning(null);
        try {
          console.log('[Coupon] Fetching coupons from /api/coupons-active');
          const response = await fetch(`/api/coupons-active?shop=${SHOP_ID}`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          console.log('[Coupon] Shopify coupons response:', data);
          if (data.coupons && data.coupons.length > 0) {
            // Filter only ACTIVE coupons and normalize the format
            const activeCoupons = data.coupons
              .filter(c => (c.status === 'active' || c.status === 'ACTIVE'))
              .map(c => ({
                id: c.id,
                code: c.code || c.heading,
                label: c.heading || c.code,
                description: c.description || c.subtext || '',
                discountType: c.discountType || 'percentage',
                discountValue: c.discountValue || 0,
                expiryDate: c.expiryDate || c.ends_at ? (c.ends_at || '').split('T')[0] : '',
                status: 'active',
              }));
            console.log('[Coupon] Filtered active coupons:', activeCoupons.length);
            setActiveCouponsFromAPI(activeCoupons);
          } else {
            setActiveCouponsFromAPI([]);
          }
        } catch (error) {
          console.error('[Coupon] Error fetching active coupons:', error);
          setActiveCouponsFromAPI([]);
        } finally {
          setIsLoadingActiveCoupons(false);
        }
      };
      fetchActiveCoupons();
    }
  }, [couponSubTab]);


  const handleAddToCart = async (product) => {
    setCartData(prev => {
      const productId = product.id || product.productId;
      const existingItem = prev.items.find(item => (item.id === productId || item.productId === productId));

      let newItems;
      if (existingItem) {
        newItems = prev.items.map(item =>
          (item.id === productId || item.productId === productId)
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        newItems = [...prev.items, {
          ...product,
          id: productId,
          productId: productId,
          quantity: 1,
          image: product.image,
          price: product.price,
          title: product.title || product.name
        }];
      }

      return {
        ...prev,
        items: newItems,
        cartValue: newItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0),
        totalQuantity: newItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
      };
    });
    setShowProductModal(false);
  };

  const handleUpdateQuantity = (idx, delta) => {
    setCartData(prev => {
      const updatedItems = [...prev.items];
      if (updatedItems[idx]) {
        const newQty = Math.max(1, (updatedItems[idx].quantity || 1) + delta);
        updatedItems[idx] = { ...updatedItems[idx], quantity: newQty };
      }
      return {
        ...prev,
        items: updatedItems,
        cartValue: updatedItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0),
        totalQuantity: updatedItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
      };
    });
  };

  const handleRemoveProduct = (idx) => {
    setCartData(prev => {
      const newItems = prev.items.filter((_, i) => i !== idx);
      return {
        ...prev,
        items: newItems,
        cartValue: newItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0),
        totalQuantity: newItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
      };
    });
  };

  const handleMilestoneProductClick = (productIds, rewardText) => {
    // Collect all products from currently loaded states
    const products = loadedShopifyProducts.filter(p => productIds.includes(p.id));
    setSelectedMilestoneProduct(products);
    setSelectedMilestoneText(rewardText || "");
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
        updateManualUpsellRule(currentUpsellRule, { triggerProductIds: selectedProductIds });
      } else if (upsellPickerMode === 'upsell') {
        updateManualUpsellRule(currentUpsellRule, { upsellProductIds: selectedProductIds });
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
      updateManualUpsellRule(currentUpsellRule, { triggerCollectionIds: selectedCollectionIds });
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

  const filteredProducts = loadedShopifyProducts.filter(product => {
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

  const filteredCollections = loadedShopifyCollections.filter(collection => {
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

  const handleCouponTabClick = (couponId, source = 'sample') => {
    let coupon;
    if (source === 'active') {
      coupon = activeCouponsFromAPI.find(c => c.id === couponId);
      if (coupon) {
        // Merge with any existing overrides
        const overrides = couponOverrides[couponId] || {};
        coupon = { ...coupon, ...overrides };
      }
    } else {
      coupon = allCoupons.find(c => c.id === couponId);
    }
    if (coupon) {
      setActiveCouponTab(couponId);
      setEditingCouponSource(source);
      setEditingCoupon(JSON.parse(JSON.stringify(coupon)));
      setOriginalCoupon(JSON.parse(JSON.stringify(coupon)));
    }
  };

  const toggleActiveCouponSelection = (couponId) => {
    setSelectedActiveCoupons(prev =>
      prev.includes(couponId)
        ? prev.filter(id => id !== couponId)
        : [...prev, couponId]
    );
    setActiveCouponWarning(null);
  };

  const handleOpenCouponModal = () => {
    setTempSelectedCouponIds([...selectedActiveCoupons]);
    setIsCouponSelectionModalOpen(true);
  };

  const handleCloseCouponModal = () => {
    setIsCouponSelectionModalOpen(false);
    setTempSelectedCouponIds([]);
  };

  const handleToggleTempCoupon = (couponId) => {
    setTempSelectedCouponIds(prev =>
      prev.includes(couponId)
        ? prev.filter(id => id !== couponId)
        : [...prev, couponId]
    );
  };

  const handleConfirmCouponSelection = () => {
    setSelectedActiveCoupons(tempSelectedCouponIds);
    setIsCouponSelectionModalOpen(false);
    setActiveCouponWarning(null); // Clear any previous warnings
  };

  const updateCouponOverride = (couponId, field, value) => {
    setCouponOverrides(prev => {
      const existing = { ...(prev[couponId] || {}) };
      const keys = field.split('.');
      if (keys.length === 1) {
        // Simple field like 'label', 'backgroundColor', etc.
        existing[field] = value;
      } else {
        // Nested field like 'button.backgroundColor' → { button: { backgroundColor: value } }
        let target = existing;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
            target[keys[i]] = {};
          } else {
            target[keys[i]] = { ...target[keys[i]] };
          }
          target = target[keys[i]];
        }
        target[keys[keys.length - 1]] = value;
      }
      return { ...prev, [couponId]: existing };
    });
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
      const target = keys.reduce((o, k) => {
        if (o[k] === undefined || o[k] === null) o[k] = {};
        return o[k];
      }, obj);
      target[lastKey] = val;
    };

    const keys = path.split('.');
    const updatedCoupon = JSON.parse(JSON.stringify(editingCoupon));
    updateNestedField(updatedCoupon, keys, value);
    setEditingCoupon(updatedCoupon);

    if (editingCouponSource === 'active') {
      // Store as override — don't modify source data
      updateCouponOverride(editingCoupon.id, path, value);
    } else {
      // Sample coupons: update in allCoupons for live preview only
      setAllCoupons(prev => prev.map(c =>
        c.id === updatedCoupon.id ? JSON.parse(JSON.stringify(updatedCoupon)) : c
      ));
    }
  };

  // canSave logic: only allow saving if at least one active coupon is selected
  const canSaveCoupons = selectedActiveCoupons.length > 0;

  const handleSaveCoupon = async () => {
    // Strict save validation
    if (!canSaveCoupons) {
      setActiveCouponWarning('Select at least one active coupon from the Dashboard to save.');
      setSaveToastMessage('Cannot save — no active coupons selected');
      setShowSaveToast(true);
      return;
    }

    // Save all selected coupons and their styling, ensuring all fields are present
    const STYLE_KEYS = [
      'bgColor', 'textColor', 'accentColor', 'buttonColor', 'buttonTextColor', 'borderRadius', 'fontSize', 'padding'
    ];
    const COUPON_KEYS = [
      'code', 'label', 'description', 'discountType', 'discountValue', 'iconUrl', 'enabled',
      'style', 'position', 'layout', 'alignment', 'backgroundColor', 'textColor'
    ];
    const couponsToSave = selectedActiveCoupons.map(id => {
      const apiCoupon = activeCouponsFromAPI.find(c => c.id === id) || {};
      const override = couponOverrides[id] || {};
      const styleObj = { ...selectedCouponStyle };
      for (const key of STYLE_KEYS) {
        if (styleObj[key] === undefined) styleObj[key] = null;
      }
      const couponObj = {
        ...apiCoupon,
        ...override,
        style: styleObj,
        position: couponPosition,
        layout: couponLayout,
        alignment: couponAlignment,
        backgroundColor: override.backgroundColor || apiCoupon.backgroundColor || '#000',
        textColor: override.textColor || apiCoupon.textColor || '#fff',
        iconUrl: override.iconUrl || apiCoupon.iconUrl || '🎟️',
      };
      // Ensure all coupon fields are present
      for (const key of COUPON_KEYS) {
        if (couponObj[key] === undefined) couponObj[key] = null;
      }
      return couponObj;
    });

    // Save to DB via handleSaveAll
    setAllCoupons(JSON.parse(JSON.stringify(couponsToSave)));
    await handleSaveAll();
    setSaveToastMessage('Coupon saved');
    setShowSaveToast(true);
  };

  const handleCancelCoupon = () => {
    if (originalCoupon) {
      setEditingCoupon(JSON.parse(JSON.stringify(originalCoupon)));
    }
  };

  const handleSaveStyle = async () => {
    // Now only using sample API as requested
    console.log('[Style] Saving style exclusively to sample API');

    setInitialCouponSettings({
      style: selectedCouponStyle,
      position: couponPosition,
      layout: couponLayout,
      alignment: couponAlignment
    });

    await handleSaveAll();
  };

  const handleCancelStyle = () => {
    setSelectedCouponStyle(initialCouponSettings.style);
    setCouponPosition(initialCouponSettings.position);
    setCouponLayout(initialCouponSettings.layout);
    setCouponAlignment(initialCouponSettings.alignment);
    setSaveToastMessage('Changes discarded');
    setShowSaveToast(true);
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
    const val = Number(coupon.discountValue) || 0;
    if (coupon.discountType === 'percentage') {
      return (subtotal * val) / 100;
    } else if (coupon.discountType === 'fixed') {
      return Math.min(val, subtotal);
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

    if (upsellConfig.enabled && !upsellConfig.useAI) {
      if (!manualUpsellRules || manualUpsellRules.length === 0) {
        return 'Please add at least one manual upsell rule or enable AI.';
      }

      for (let i = 0; i < manualUpsellRules.length; i++) {
        const rule = manualUpsellRules[i];
        if (!rule.triggerProductIds || rule.triggerProductIds.length === 0) {
          return `Rule #${i + 1}: Select at least one trigger product.`;
        }
        if (!rule.upsellProductIds || rule.upsellProductIds.length === 0) {
          return `Rule #${i + 1}: Select at least one upsell product.`;
        }
      }
    }

    return '';
  };

  const handleSaveProgressBarSettings = async () => {
    // Now only using sample API as requested
    console.log('[Progress] Saving exclusively to sample API');
    await handleSaveAll();
  };

  const handleSaveAll = async (forcedStatus = null, featureOverrides = {}) => {
    // Determine status: use forcedStatus if provided, else use current state
    const targetStatus = forcedStatus !== null
      ? (forcedStatus ? 'active' : 'inactive')
      : (cartStatus ? 'active' : 'inactive');

    // Merge state with overrides
    const isProgressOn = featureOverrides.progressBarEnabled !== undefined ? featureOverrides.progressBarEnabled : featureStates.progressBarEnabled;
    const isCouponOn = featureOverrides.couponSliderEnabled !== undefined ? featureOverrides.couponSliderEnabled : featureStates.couponSliderEnabled;
    const isUpsellOn = featureOverrides.upsellEnabled !== undefined ? featureOverrides.upsellEnabled : featureStates.upsellEnabled;

    // Augment manual rules with product metadata for storefront convenience
    const savableManualRules = manualUpsellRules.map(rule => {
      const getDetails = (ids) => (ids || []).map(id => {
        const p = loadedShopifyProducts.find(lp => lp.id === id);
        return p ? { id: p.id, title: p.title, price: p.price, image: p.image } : { id };
      });

      return {
        ...rule,
        triggerProductDetails: getDetails(rule.triggerProductIds),
        upsellProductDetails: getDetails(rule.upsellProductIds)
      };
    });

    const sampleData = {
      Id: SHOP_ID,
      shop: SHOP_ID,
      cartstatus: targetStatus === 'active' ? 'active' : 'inactive',
      progress_data: JSON.stringify({
        ...progressBarSettings,
        // Send both to ensure persistence regardless of DB schema expectations
        track_color: progressBarSettings.barBackgroundColor,
        fill_color: progressBarSettings.barForegroundColor,
        mode: progressMode,
        enabled: isProgressOn, // Critical sync
      }),
      coupon_data: JSON.stringify({
        style: selectedCouponStyle,
        position: couponPosition,
        layout: couponLayout,
        alignment: couponAlignment,
        selectedActiveCoupons,
        couponOverrides,
        allCouponDetails: selectedActiveCoupons.map(id => {
          const apiCoupon = activeCouponsFromAPI.find(c => c.id === id) || {};
          const override = couponOverrides[id] || {};
          return {
            id,
            code: override.code || apiCoupon.code || '',
            label: override.label || apiCoupon.label || apiCoupon.title || '',
            description: override.description || apiCoupon.description || '',
            discountType: override.discountType || apiCoupon.discountType || 'percentage',
            discountValue: override.discountValue ?? apiCoupon.discountValue ?? 0,
            iconUrl: override.iconUrl || apiCoupon.iconUrl || '🎟️',
            backgroundColor: override.backgroundColor || apiCoupon.backgroundColor || '#000',
            textColor: override.textColor || apiCoupon.textColor || '#fff',
            borderRadius: override.borderRadius ?? apiCoupon.borderRadius ?? 8,
            button: {
              text: override['button.text'] ?? override.button?.text ?? apiCoupon.button?.text ?? 'Apply',
              textColor: override['button.textColor'] ?? override.button?.textColor ?? apiCoupon.button?.textColor ?? '#ffffff',
              backgroundColor: override['button.backgroundColor'] ?? override.button?.backgroundColor ?? apiCoupon.button?.backgroundColor ?? '#000000',
              borderRadius: override['button.borderRadius'] ?? override.button?.borderRadius ?? apiCoupon.button?.borderRadius ?? 4,
            },
            enabled: override.enabled ?? apiCoupon.enabled ?? true,
          };
        }),
      }),
      upsell_data: JSON.stringify({
        ...upsellConfig,
        manualRules: savableManualRules
      }),
      progress_status: isProgressOn ? 1 : 0,
      coupon_status: isCouponOn ? 1 : 0,
      upsell_status: isUpsellOn ? 1 : 0
    };

    console.log('[Sample API] Sending payload:', sampleData);
    setIsSaving(true);

    try {
      const response = await fetch('/api/sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shop-ID': SHOP_ID
        },
        body: JSON.stringify(sampleData)
      });

      if (response.ok) {
        setSaveToastMessage(`✅ Configuration synced (${targetStatus})`);
        setShowSaveToast(true);
      } else {
        setSaveToastMessage(`❌ Sample API returned ${response.status}`);
        setShowSaveToast(true);
      }
    } catch (error) {
      console.error('[Sample API] Fetch error:', error);
      setSaveToastMessage('❌ Failed to connect to sample API');
      setShowSaveToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const isUpsellConfigDirty = initialUpsellConfig && JSON.stringify(upsellConfig) !== JSON.stringify(initialUpsellConfig);

  const handleSaveUpsellRules = async () => {
    const error = getUpsellValidationError();
    if (error) {
      setSaveToastMessage(error);
      setShowSaveToast(true);
      return;
    }

    // Now only using sample API as requested
    console.log('[Upsell] Saving exclusively to sample API');
    setInitialUpsellConfig(upsellConfig);
    await handleSaveAll();
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

    if (editingRuleId === 'rule2-trigger') {
      setUpsellConfig({
        ...upsellConfig,
        rule2: {
          ...upsellConfig.rule2,
          triggerProducts: tempSelectedProductIds
        }
      });
      setShowProductPickerModal(false);
      setEditingRuleId(null);
      setProductPickerMode(null);
      setTempSelectedProductIds([]);
      return;
    }

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
      console.log('[Upsell Builder] Saving exclusively to sample API');
      setInitialManualUpsellRules(JSON.parse(JSON.stringify(manualUpsellRules)));

      // Also sync to sample API for the overall payload
      await handleSaveAll();

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
                  variant={cartStatus ? 'secondary' : 'primary'}
                  loading={isSaving}
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
                  selected={previewCartState.length > 0 ? previewCartState : ['items']}
                  onChange={setPreviewCartState}
                />
              </BlockStack>
            </Card>

            <Divider />

            {/* Section 3: Feature Tabs */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Features</Text>

                <BlockStack gap="200">
                  <div style={{ position: 'relative' }}>
                    <Button
                      pressed={selectedTab === 'progress-bar'}
                      onClick={() => setSelectedTab('progress-bar')}
                      fullWidth
                    >
                      <InlineStack align="space-between" blockAlign="center" style={{ width: '100%' }}>
                        <Text as="span">Progress Bar</Text>
                        <Badge tone={featureStates.progressBarEnabled ? 'success' : 'subdued'}>
                          {featureStates.progressBarEnabled ? 'On' : 'Off'}
                        </Badge>
                      </InlineStack>
                    </Button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Button
                      pressed={selectedTab === 'coupon'}
                      onClick={() => setSelectedTab('coupon')}
                      fullWidth
                    >
                      <InlineStack align="space-between" blockAlign="center" style={{ width: '100%' }}>
                        <Text as="span">Coupon Slider</Text>
                        <Badge tone={featureStates.couponSliderEnabled ? 'success' : 'subdued'}>
                          {featureStates.couponSliderEnabled ? 'On' : 'Off'}
                        </Badge>
                      </InlineStack>
                    </Button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Button
                      pressed={selectedTab === 'upsell'}
                      onClick={() => setSelectedTab('upsell')}
                      fullWidth
                    >
                      <InlineStack align="space-between" blockAlign="center" style={{ width: '100%' }}>
                        <Text as="span">Upsell Products</Text>
                        <Badge tone={featureStates.upsellEnabled ? 'success' : 'subdued'}>
                          {featureStates.upsellEnabled ? 'On' : 'Off'}
                        </Badge>
                      </InlineStack>
                    </Button>
                  </div>
                </BlockStack>
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
      const activeTier = progressBarSettings?.tiers?.[activeTierIndex];
      const isCartTotal = (progressBarSettings?.rewardsCalculation?.[0] || 'cartTotal') === 'cartTotal';

      // Prepare tabs for tiers
      const tierTabs = (progressBarSettings?.tiers || []).map((tier, index) => ({
        id: `tier-${index}`,
        content: `Tier ${index + 1}`,
        panelID: `tier-panel-${index}`,
      }));

      // Calculate current progress based on mode
      const currentValue = progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity;

      // Derive milestones for LIVE editor updates
      const liveMilestones = (progressBarSettings?.tiers || []).map(tier => ({
        id: tier.id,
        target: tier.minValue,
        label: progressMode === 'amount' ? `₹${tier.minValue}` : `${tier.minValue} items`,
        rewardText: tier.description,
        associatedProducts: tier.products || []
      })).sort((a, b) => a.target - b.target);

      const maxTargetSetting = progressBarSettings?.maxTarget || 1000;
      const progressPercent = calculateProgress(currentValue, maxTargetSetting);
      const milestone = getActiveMilestone(currentValue, liveMilestones, progressMode);

      return (
        <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingLg" as="h1">Progress Bar Settings</Text>
              <Button
                variant={featureStates.progressBarEnabled ? 'secondary' : 'primary'}
                onClick={() => toggleFeature('progressBarEnabled')}
              >
                {featureStates.progressBarEnabled ? 'Disable' : 'Enable'}
              </Button>
            </InlineStack>

            {/* SECTION 1: General Settings */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">General Settings</Text>

                <BlockStack gap="400">
                  <Text variant="headingSm" as="h3">Behavior & Layout</Text>
                  <Checkbox
                    label="Show progress bar when cart is empty"
                    checked={progressBarSettings.showOnEmpty}
                    onChange={(value) => updateProgressBarSetting('showOnEmpty', value)}
                  />

                  <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="semibold">Placement</Text>
                    <InlineStack gap="300">
                      <RadioButton
                        label="Top of Cart"
                        checked={progressBarSettings.placement !== 'bottom'}
                        id="placement-top"
                        name="progressBarPlacement"
                        onChange={() => updateProgressBarSetting('placement', 'top')}
                      />
                      <RadioButton
                        label="Bottom of Cart"
                        checked={progressBarSettings.placement === 'bottom'}
                        id="placement-bottom"
                        name="progressBarPlacement"
                        onChange={() => updateProgressBarSetting('placement', 'bottom')}
                      />
                    </InlineStack>
                  </BlockStack>
                  <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="semibold">Max Scale (100% Goal)</Text>
                    <TextField
                      type="number"
                      value={progressBarSettings.maxTarget || 1000}
                      onChange={(value) => updateProgressBarSetting('maxTarget', Number(value))}
                      suffix={progressMode === 'amount' ? '₹' : 'items'}
                      autoComplete="off"
                      helpText="The value at which the bar reaches 100% fullness."
                    />
                  </BlockStack>
                </BlockStack>

                <Divider />

                <BlockStack gap="400">
                  <Text variant="headingSm" as="h3">Appearance</Text>
                  <BlockStack gap="200">
                    <ColorPickerField
                      label="Bar Background"
                      value={progressBarSettings.barBackgroundColor}
                      onChange={(value) => updateProgressBarSetting('barBackgroundColor', value)}
                    />
                  </BlockStack>

                  <BlockStack gap="200">
                    <ColorPickerField
                      label="Bar Foreground (Fill)"
                      value={progressBarSettings.barForegroundColor}
                      onChange={(value) => updateProgressBarSetting('barForegroundColor', value)}
                    />
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="semibold">Corner Radius</Text>
                    <TextField
                      type="number"
                      value={progressBarSettings.borderRadius}
                      onChange={(value) => updateProgressBarSetting('borderRadius', Number(value))}
                      suffix="px"
                      autoComplete="off"
                    />
                  </BlockStack>
                </BlockStack>

                <Divider />

                <BlockStack gap="200">
                  <Text variant="headingSm" as="h3">Messages</Text>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Completion Message
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
                    placeholder="e.g. All Rewards Unlocked!"
                  />
                </BlockStack>
              </BlockStack>
            </Card>

            {/* SECTION 2: Progress Mode Selection */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Progress Calculation</Text>

                <ChoiceList
                  title=""
                  choices={[
                    {
                      label: 'Cart Value Based (Spend)',
                      value: 'amount',
                      helpText: 'Progress tracked by total cart value (₹)',
                    },
                    {
                      label: 'Item Quantity Based (Count)',
                      value: 'quantity',
                      helpText: 'Progress tracked by total number of items',
                    },
                  ]}
                  selected={[progressMode || 'amount']}
                  onChange={(value) => setProgressMode(value[0])}
                />
              </BlockStack>
            </Card>

            {/* SECTION 3: Active Milestones Display */}
            {/* <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Active milestones</Text>

                {liveMilestones.length > 0 ? (
                  <BlockStack gap="200">
                    {liveMilestones.map((ms, idx) => (
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
 */}


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
                  {(progressBarSettings?.tiers || []).map((tier, idx) => (
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
                          {progressMode === 'amount' ? 'Minimum spending' : 'Minimum item count'}
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
                          {progressMode === 'amount' ? 'Reward products' : 'Items included'} — {activeTier.products?.length || 0} of {loadedShopifyProducts.length} products added
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
                            const product = loadedShopifyProducts.find(p => p.id === productId);
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

            <div style={{ marginTop: '20px', paddingBottom: '40px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                size="slim"
                onClick={handleSaveProgressBarSettings}
              >
                Save
              </Button>
            </div>
          </BlockStack >
        </div >
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
                variant={featureStates.couponSliderEnabled ? 'secondary' : 'primary'}
                onClick={() => toggleFeature('couponSliderEnabled')}
              >
                {featureStates.couponSliderEnabled ? 'Disable' : 'Enable'}
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

                    {/* Selection Buttons */}
                    <InlineStack gap="300">
                      {Object.entries(COUPON_STYLE_METADATA).map(([styleKey, metadata]) => (
                        <Button
                          key={styleKey}
                          pressed={selectedCouponStyle === styleKey}
                          onClick={() => handleStyleSelect(styleKey)}
                          size="large"
                        >
                          {metadata.name}
                        </Button>
                      ))}
                    </InlineStack>

                    {/* Active Style Preview */}
                    <div style={{ marginTop: '16px', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', display: 'flex', justifyContent: 'center', border: '1px dashed #e5e7eb' }}>
                      <div style={{ maxWidth: '400px', width: '100%' }}>
                        <CouponPreview styleKey={selectedCouponStyle} />
                      </div>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <Text tone="subdued">{COUPON_STYLE_METADATA[selectedCouponStyle].description}dfkwuhew0</Text>
                    </div>
                    {/* Save Button for Style */}
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <Button onClick={handleSaveStyle} variant="primary" loading={isSaving}>Save Style</Button>
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


                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', marginBottom: '12px' }}>
                      <Button onClick={() => setCouponSubTab('manage-coupons')}>Next</Button>
                      <Button onClick={handleCancelStyle}>Cancel</Button>
                    </div>
                  </BlockStack>
                </Card>
              </BlockStack>
            )}

            {/* TAB 2: Manage Coupons */}
            {
              couponSubTab === 'manage-coupons' && (
                <BlockStack gap="400">
                  {/* Warning Banner */}
                  {activeCouponWarning && (
                    <Banner tone="warning" onDismiss={() => setActiveCouponWarning(null)}>
                      <p>{activeCouponWarning}</p>
                    </Banner>
                  )}

                  {/* Sample Coupons — Auto-shown for Style Preview
                  <Card>
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h2">Coupon Preview</Text>
                      <Text tone="subdued" as="p">These sample coupons show how your selected style looks. Active coupons from your Shopify dashboard appear below.</Text>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: couponLayout === 'grid' ? 'repeat(2, 1fr)' : '1fr',
                        gap: '12px',
                        padding: '8px 0',
                      }}>
                        {allCoupons.filter(c => c.enabled).map(coupon => (
                          <div
                            key={coupon.id}
                            style={{
                              padding: '14px',
                              backgroundColor: coupon.backgroundColor || '#0070f3',
                              color: coupon.textColor || '#ffffff',
                              borderRadius: `${coupon.borderRadius || 8}px`,
                              border: '1px solid rgba(0,0,0,0.05)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ fontSize: '18px' }}>{coupon.iconUrl}</span>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '13px' }}>{coupon.code}</div>
                                <div style={{ fontSize: '11px', opacity: 0.85 }}>{coupon.label}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px' }}>{coupon.description}</div>
                            <button style={{
                              padding: '4px 12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              backgroundColor: coupon.button?.backgroundColor || '#000',
                              color: coupon.button?.textColor || '#fff',
                            }}>
                              {coupon.button?.text || 'Apply'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </BlockStack>
                  </Card> */}

                  {/* Active Coupons (From Shopify Admin API) */}
                  <Card>
                    <BlockStack gap="400">
                      <BlockStack gap="200">
                        <Text variant="headingMd" as="h2">Active Coupons</Text>
                        <Text tone="subdued" as="p">Select which active coupons to display in the cart slider.</Text>
                      </BlockStack>

                      {/* Loading State */}
                      {isLoadingActiveCoupons && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                          <BlockStack gap="200" inlineAlign="center">
                            <Spinner size="small" />
                            <Text tone="subdued" variant="bodySm">Fetching active coupons...</Text>
                          </BlockStack>
                        </div>
                      )}

                      {!isLoadingActiveCoupons && (
                        <BlockStack gap="400">
                          {/* Selection Summary */}
                          <div style={{
                            padding: '16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                          }}>
                            <InlineStack align="space-between" blockAlign="center">
                              <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="semibold">
                                  {selectedActiveCoupons.length} coupon{selectedActiveCoupons.length !== 1 ? 's' : ''} selected
                                </Text>
                                <Text variant="bodySm" tone="subdued">
                                  Coupons selected here will appear in the cart slider.
                                </Text>
                              </BlockStack>
                              <Button onClick={handleOpenCouponModal}>Select Coupons</Button>
                            </InlineStack>
                          </div>

                          {/* Selected Coupons List (Preview) */}
                          {selectedActiveCoupons.length > 0 && (
                            <BlockStack gap="200">
                              <Text variant="bodySm" fontWeight="semibold" tone="subdued">SELECTED COUPONS:</Text>
                              {selectedActiveCoupons.map(couponId => {
                                const coupon = activeCouponsFromAPI.find(c => c.id === couponId);
                                if (!coupon) return null;
                                const isEditing = activeCouponTab === coupon.id && editingCouponSource === 'active';
                                return (
                                  <div
                                    key={coupon.id}
                                    style={{
                                      padding: '12px 16px',
                                      backgroundColor: '#fff',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                    }}
                                  >
                                    <InlineStack align="space-between" blockAlign="center">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                          width: '32px', height: '32px', borderRadius: '6px',
                                          backgroundColor: '#f1f5f9', display: 'flex',
                                          alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                                        }}>
                                          🏷️
                                        </div>
                                        <Text variant="bodyMd" fontWeight="semibold">{coupon.code}</Text>
                                        <Badge tone="success" size="small">Active</Badge>
                                      </div>
                                      <Button size="slim" onClick={() => handleCouponTabClick(coupon.id, 'active')}>Edit Appearance</Button>
                                    </InlineStack>
                                  </div>
                                );
                              })}
                            </BlockStack>
                          )}
                        </BlockStack>
                      )}
                    </BlockStack>
                  </Card>

                  {/* Coupon Selection Modal */}
                  <Modal
                    open={isCouponSelectionModalOpen}
                    onClose={handleCloseCouponModal}
                    title="Select Active Coupons"
                    primaryAction={{
                      content: 'Add',
                      onAction: handleConfirmCouponSelection,
                    }}
                    secondaryActions={[
                      {
                        content: 'Cancel',
                        onAction: handleCloseCouponModal,
                      },
                    ]}
                  >
                    <Modal.Section>
                      <BlockStack gap="400">
                        {activeCouponsFromAPI.length === 0 ? (
                          <Banner tone="info">
                            <p>No active coupons found. Create coupons in your <strong>Coupon Dashboard</strong> and make sure they have an <strong>Active</strong> status.</p>
                          </Banner>
                        ) : (
                          <BlockStack gap="200">
                            {activeCouponsFromAPI.map(coupon => {
                              const isSelected = tempSelectedCouponIds.includes(coupon.id);
                              return (
                                <div
                                  key={coupon.id}
                                  onClick={() => handleToggleTempCoupon(coupon.id)}
                                  style={{
                                    padding: '12px',
                                    backgroundColor: isSelected ? '#f0f7ff' : '#fff',
                                    border: `1px solid ${isSelected ? '#2c6ecb' : '#e5e7eb'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <InlineStack align="space-between" blockAlign="center">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <Checkbox
                                        checked={isSelected}
                                        onChange={() => handleToggleTempCoupon(coupon.id)}
                                      />
                                      <BlockStack gap="050">
                                        <Text variant="bodyMd" fontWeight="semibold">{coupon.code}</Text>
                                        <Text variant="bodySm" tone="subdued">
                                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                                        </Text>
                                      </BlockStack>
                                    </div>
                                    <Badge tone="success">Active</Badge>
                                  </InlineStack>
                                </div>
                              );
                            })}
                          </BlockStack>
                        )}
                      </BlockStack>
                    </Modal.Section>
                  </Modal>

                  <Divider />

                  {/* Coupon Editor */}
                  {editingCoupon ? (
                    <Card>
                      <div style={{ padding: '4px' }}>
                        <BlockStack gap="400">
                          {/* Source Banner */}
                          <Banner tone="success">
                            <p>Editing an <strong>active coupon</strong>. Appearance changes will be saved as style overrides.</p>
                          </Banner>

                          <InlineStack align="space-between" blockAlign="center">
                            <BlockStack gap="100">
                              <Text variant="headingSm" as="h3">Edit: {editingCoupon.code}</Text>
                              <Text tone="subdued" variant="bodySm">Configure display and discount settings</Text>
                            </BlockStack>
                          </InlineStack>

                          <Divider />

                          {/* Editor Fields */}
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


                            <Divider />
                            <Text variant="headingSm" as="h4">Appearance</Text>

                            <InlineStack gap="300">
                              <div style={{ flex: 1 }}>
                                <ColorPickerField
                                  label="Background Color"
                                  value={editingCoupon.backgroundColor || '#0070f3'}
                                  onChange={(value) => updateCouponField('backgroundColor', value)}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <ColorPickerField
                                  label="Text Color"
                                  value={editingCoupon.textColor || '#ffffff'}
                                  onChange={(value) => updateCouponField('textColor', value)}
                                />
                              </div>
                            </InlineStack>

                            <InlineStack gap="300">
                              <div style={{ flex: 1 }}>
                                <TextField
                                  label="Icon (emoji)"
                                  value={editingCoupon.iconUrl || '🏷️'}
                                  onChange={(value) => updateCouponField('iconUrl', value)}
                                  autoComplete="off"
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <TextField
                                  label="Border Radius"
                                  type="number"
                                  value={String(editingCoupon.borderRadius || 8)}
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
                              value={editingCoupon.button?.text ?? 'Apply'}
                              onChange={(value) => updateCouponField('button.text', value)}
                              autoComplete="off"
                            />

                            <InlineStack gap="300">
                              <div style={{ flex: 1 }}>
                                <ColorPickerField
                                  label="Button Background"
                                  value={editingCoupon.button?.backgroundColor || '#000000'}
                                  onChange={(value) => updateCouponField('button.backgroundColor', value)}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <ColorPickerField
                                  label="Button Text Color"
                                  value={editingCoupon.button?.textColor || '#ffffff'}
                                  onChange={(value) => updateCouponField('button.textColor', value)}
                                />
                              </div>
                            </InlineStack>
                          </BlockStack>
                        </BlockStack>
                      </div>
                    </Card>
                  ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>👆 Select a coupon to edit</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Click on a sample or active coupon above to edit its appearance</p>
                    </div>
                  )}

                  {/* Save Button — disabled unless active coupons selected */}
                  <Card>
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text variant="headingSm">Save Coupon Selections</Text>
                          <Text variant="bodySm" tone="subdued">
                            {canSaveCoupons
                              ? `${selectedActiveCoupons.length} active coupon${selectedActiveCoupons.length > 1 ? 's' : ''} selected`
                              : 'No active coupons selected — select at least one to save'
                            }
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      <InlineStack align="end" gap="200">
                        <Button onClick={handleCancelCoupon} disabled={isSaving}>Cancel</Button>
                        <Button
                          variant="primary"
                          onClick={handleSaveCoupon}
                          loading={isSaving}
                          disabled={!canSaveCoupons || isSaving}
                        >
                          Save Coupon Selections
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </BlockStack>
              )
            }
          </BlockStack >
        </div >
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
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text variant="headingLg" as="h1">Upsell Rules</Text>
                  <Text variant="bodySm" tone="subdued">Recommend products to customers based on cart contents</Text>
                </BlockStack>
                <Button
                  variant={featureStates.upsellEnabled ? 'secondary' : 'primary'}
                  onClick={() => toggleFeature('upsellEnabled')}
                >
                  {featureStates.upsellEnabled ? 'Disable' : 'Enable'}
                </Button>
              </InlineStack>
            </BlockStack>

            {/* Header with Status */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text variant="headingLg" as="h1">Upsells</Text>
                  </BlockStack>
                  {isUpsellConfigDirty ? (
                    <Badge tone="attention">Unsaved Changes</Badge>
                  ) : (
                    <Badge tone={upsellConfig.enabled ? 'success' : 'subdued'}>
                      {upsellConfig.enabled ? 'Active' : 'Draft'}
                    </Badge>
                  )}
                </InlineStack>
                <Divider />
                <Checkbox
                  label="Use AI recommended upsells"
                  checked={upsellConfig.useAI}
                  onChange={(checked) => setUpsellConfig({ ...upsellConfig, useAI: checked })}
                />
              </BlockStack>
            </Card>

            {/* Manual Product Selection (only if AI is off) */}
            {!upsellConfig.useAI && (
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2">Manual Upsell Rules</Text>
                    <Text variant="bodySm" tone="subdued">Configure product-specific recommendation rules</Text>
                  </BlockStack>
                  <Divider />

                  <BlockStack gap="300">
                    {manualUpsellRules?.length > 0 ? (
                      manualUpsellRules.map((rule, idx) => (
                        <div key={rule.id} style={{ padding: '12px', border: '1px solid #e1e3e5', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                          <BlockStack gap="200">
                            <InlineStack align="space-between">
                              <Text variant="bodyMd" fontWeight="bold">Rule #{idx + 1}</Text>
                              <Button variant="plain" tone="critical" onClick={() => removeManualUpsellRule(rule.id)}>Remove</Button>
                            </InlineStack>
                            <Divider />
                            <BlockStack gap="100">
                              <Text variant="bodySm" fontWeight="bold">If this product is in cart:</Text>
                              <Button onClick={() => openProductPicker(rule.id, 'trigger')}>
                                {rule.triggerProductIds?.length ? `${rule.triggerProductIds.length} Trigger Products` : 'Select trigger product'}
                              </Button>
                            </BlockStack>
                            <BlockStack gap="100">
                              <Text variant="bodySm" fontWeight="bold">Then recommend these products:</Text>
                              <Button onClick={() => openProductPicker(rule.id, 'upsell')}>
                                {rule.upsellProductIds?.length ? `${rule.upsellProductIds.length} Upsell Products` : 'Select upsell products'}
                              </Button>
                            </BlockStack>
                          </BlockStack>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed #c9cccf', borderRadius: '8px' }}>
                        <Text tone="subdued">No manual rules yet. Add your first rule below.</Text>
                      </div>
                    )}
                    <Button variant="primary" onClick={addManualUpsellRule}>Add new rule</Button>
                  </BlockStack>
                </BlockStack>
              </Card>
            )}

            {/* Upsell Settings Card */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Upsell settings</Text>
                <Divider />

                <BlockStack gap="300">
                  <Checkbox
                    label="Show upsell offer if item already in cart"
                    checked={upsellConfig.showIfInCart}
                    onChange={(val) => setUpsellConfig({ ...upsellConfig, showIfInCart: val })}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <Text variant="bodyMd">Limit the number of upsells in the cart</Text>
                    </div>
                    <div style={{ width: '80px' }}>
                      <TextField
                        type="number"
                        value={String(upsellConfig.limit)}
                        onChange={(val) => setUpsellConfig({ ...upsellConfig, limit: Number(val) })}
                        autoComplete="off"
                        labelHidden
                        label="Limit"
                      />
                    </div>
                  </div>

                  <BlockStack gap="100">
                    <Checkbox
                      label="Show product reviews on upsells"
                      checked={upsellConfig.showReviews}
                      onChange={(val) => setUpsellConfig({ ...upsellConfig, showReviews: val })}
                    />
                    <Text variant="bodySm" tone="subdued">
                      Product reviews will also be shown on recommendations. This integration will only work with product review apps that allow the Shopify Storefront API to read product review data stored in metafields.
                    </Text>
                  </BlockStack>

                  <Divider />

                  <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="bold">Upsell title</Text>
                    <InlineStack gap="300" blockAlign="end">
                      <div style={{ flex: 1 }}>
                        <TextField
                          label="Title text"
                          labelHidden
                          value={upsellConfig.upsellTitle?.text}
                          onChange={(val) => setUpsellConfig({ ...upsellConfig, upsellTitle: { ...upsellConfig.upsellTitle, text: val } })}
                          autoComplete="off"
                        />
                      </div>
                      <ColorPickerField
                        label="Title color"
                        labelHidden
                        value={upsellConfig.upsellTitle?.color}
                        onChange={(val) => setUpsellConfig({ ...upsellConfig, upsellTitle: { ...upsellConfig.upsellTitle, color: val } })}
                      />
                    </InlineStack>
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="bold">Button text</Text>
                    <TextField
                      label="Button text"
                      labelHidden
                      value={upsellConfig.buttonText}
                      onChange={(val) => setUpsellConfig({ ...upsellConfig, buttonText: val })}
                      autoComplete="off"
                    />
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="bold">Upsell position</Text>
                    <div style={{ padding: '4px' }}>
                      <ChoiceList
                        title=""
                        choices={[
                          { label: 'Top of cart items', value: 'top' },
                          { label: 'Bottom of cart items', value: 'bottom' },
                        ]}
                        selected={[upsellConfig.position || 'bottom']}
                        onChange={(val) => setUpsellConfig({ ...upsellConfig, position: val[0] })}
                      />
                    </div>
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="bold">Upsell direction</Text>
                    <div style={{ padding: '4px' }}>
                      <ChoiceList
                        title=""
                        choices={[
                          { label: 'Block', value: 'block' },
                          { label: 'Row', value: 'row' },
                        ]}
                        selected={[upsellConfig.direction || 'block']}
                        onChange={(val) => setUpsellConfig({ ...upsellConfig, direction: val[0] })}
                      />
                    </div>
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </Card>

            {validationError && (
              <Banner tone="critical">
                <p>{validationError}</p>
              </Banner>
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
    const currentItems = cartData.items || [];
    const cartProductIds = currentItems.map(item => item.productId || item.id || item.variantId).filter(Boolean);
    const cartCollectionIds = cartProductIds.flatMap((productId) => {
      const product = loadedShopifyProducts.find(p => p.id === productId);
      return product?.collections || [];
    });

    const currentProgressMode = progressMode || 'amount';

    // Derive milestones from current settings for LIVE preview
    const previewMilestones = (progressBarSettings?.tiers || []).map(tier => ({
      id: tier.id,
      target: tier.minValue,
      label: currentProgressMode === 'amount' ? `₹${tier.minValue}` : `${tier.minValue} items`,
      rewardText: tier.description,
      associatedProducts: tier.products || []
    })).sort((a, b) => a.target - b.target);

    const maxTargetSetting = progressBarSettings.maxTarget || 1000;

    // Derive unlocked rewards for the items list
    const currentProgressVal = currentProgressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity;
    const reachedWithProducts = previewMilestones.filter(ms => currentProgressVal >= ms.target && ms.associatedProducts.length > 0);
    const allReachedProductIds = [...new Set(reachedWithProducts.flatMap(ms => ms.associatedProducts))];

    const unlockedRewards = allReachedProductIds.map((productId, idx) => {
      const product = loadedShopifyProducts.find(p => p.id === productId);
      if (!product) return null;
      const isUrl = product.image && (product.image.startsWith('http') || product.image.startsWith('//'));
      const priceVal = product.price ? Number(product.price) : 0;
      return {
        id: `reward-${idx}`,
        name: product.title,
        price: isNaN(priceVal) ? 0 : priceVal,
        quantity: 1,
        displayImage: isUrl ? product.image : null,
        placeholderImage: !isUrl ? (product.image || '🎁') : '🎁',
        isAddedByCondition: true
      };
    }).filter(Boolean);

    const normalizedMockItems = currentItems.map(item => {
      const isUrl = item.image && (item.image.startsWith('http') || item.image.startsWith('//'));
      const priceVal = item.price ? Number(item.price) : 0;
      const qty = Number(item.quantity || item.qty || 1);
      return {
        ...item,
        name: item.name || item.title || 'Product',
        price: isNaN(priceVal) ? 0 : priceVal,
        quantity: qty,
        displayImage: isUrl ? item.image : null,
        placeholderImage: !isUrl ? (item.image || '📦') : '📦'
      };
    });

    let itemsToRender = [...normalizedMockItems, ...unlockedRewards];

    // LIVE PREVIEW ENHANCEMENT: If cart is empty, show one real product to demonstrate upsells
    if (itemsToRender.length === 0 && loadedShopifyProducts.length > 0) {
      const p = loadedShopifyProducts[0];
      const isUrl = p.image && (p.image.startsWith('http') || p.image.startsWith('//'));
      itemsToRender = [{
        id: p.id,
        productId: p.id,
        name: p.title,
        price: Number(p.price || 0),
        quantity: 1,
        displayImage: isUrl ? p.image : null,
        placeholderImage: !isUrl ? (p.image || '📦') : '📦',
        isPreviewPlaceholder: true
      }];
    }

    // Recalculate totals including automatic additions
    const totalWithRewards = itemsToRender.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate total discount for preview based on new subtotal
    const previewTotalDiscount = appliedCouponIds.reduce((sum, couponId) => {
      const coupon = allCoupons.find(c => c.id === couponId);
      return sum + (coupon ? calculateCouponDiscount(coupon, totalWithRewards) : 0);
    }, 0);

    const previewFinalTotal = Math.max(0, totalWithRewards - previewTotalDiscount);

    // Calculate Upsell Recommendations Once for use in Footer or Body
    let upsellProductsToShow = [];
    const internalEnabled = isEnabled(featureStates.upsellEnabled);
    const internalUseAI = upsellConfig.useAI !== undefined ? upsellConfig.useAI : true;

    if (internalEnabled) {
      if (internalUseAI) {
        // AI recommendations - use actual products for realism
        upsellProductsToShow = loadedShopifyProducts.slice(1, 4).map(p => p.id);
        if (upsellProductsToShow.length === 0) upsellProductsToShow = ['sp-2', 'sp-6', 'sp-8'];
      } else if (manualUpsellRules?.length > 0) {
        // Manual Rules Evaluation (aligned with storefront)
        const cartProductIds = itemsToRender.map(item => String(item.productId || item.id).replace('gid://shopify/Product/', ''));

        for (const rule of manualUpsellRules) {
          if (!rule.enabled && rule.enabled !== undefined) continue;

          const triggerIds = (rule.triggerProductIds || []).map(id => String(id).replace('gid://shopify/Product/', ''));
          const triggerType = rule.triggerType || 'products';

          const hasMatch = triggerType === 'all' || triggerIds.length === 0 || triggerIds.some(id => cartProductIds.includes(id));

          if (hasMatch) {
            upsellProductsToShow = rule.upsellProductIds || [];
            break;
          }
        }
      }

      // Filter out products already in cart if setting is enabled
      if (!upsellConfig.showIfInCart) {
        const currentInCartIds = itemsToRender.map(item => item.productId || item.id);
        upsellProductsToShow = upsellProductsToShow.filter(id => !currentInCartIds.includes(id));
      }

      // Apply limit
      if (upsellConfig.limit) {
        upsellProductsToShow = upsellProductsToShow.slice(0, upsellConfig.limit);
      }
    }

    const currentEnabled = isEnabled(featureStates.upsellEnabled);
    const currentUseAI = upsellConfig.useAI !== undefined ? upsellConfig.useAI : true;
    const currentPos = upsellConfig.position || 'bottom';
    const currentDir = upsellConfig.direction || 'block';

    const upsellSectionJSX = currentEnabled && (upsellConfig.showOnEmptyCart || !showEmpty) && (
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e5e7eb',
        borderTop: currentPos === 'top' ? '1px solid #e5e7eb' : 'none',
        marginTop: currentPos === 'top' ? '12px' : '0',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p style={{
            margin: 0,
            fontSize: '12px',
            fontWeight: upsellConfig.upsellTitle?.formatting?.bold ? '900' : '800',
            fontStyle: upsellConfig.upsellTitle?.formatting?.italic ? 'italic' : 'normal',
            textDecoration: upsellConfig.upsellTitle?.formatting?.underline ? 'underline' : 'none',
            color: upsellConfig.upsellTitle?.color || '#1e293b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {upsellConfig.upsellTitle?.text || 'Recommended for you'}
          </p>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: currentDir === 'row' ? 'row' : 'column',
          gap: '12px',
          overflowX: currentDir === 'row' ? 'auto' : 'hidden',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {upsellProductsToShow.length > 0 ? upsellProductsToShow.map(productId => {
            const product = loadedShopifyProducts.find(p => p.id === productId);
            if (!product) return null;
            const hasImage = product.image && (typeof product.image === 'string') && (product.image.startsWith('http') || product.image.startsWith('//'));

            return (
              <div key={product.id} style={{
                minWidth: currentDir === 'row' ? '140px' : '100%',
                width: currentDir === 'row' ? '140px' : '100%',
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
                padding: '8px',
                display: 'flex',
                flexDirection: currentDir === 'row' ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s ease',
                flexShrink: 0
              }}>
                <div style={{
                  width: currentDir === 'row' ? '100%' : '60px',
                  height: currentDir === 'row' ? '80px' : '60px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {hasImage ? (
                    <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '24px' }}>{product.image || '📦'}</span>
                  )}
                </div>

                <div style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: currentDir === 'row' ? 'center' : 'left',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <p style={{
                    margin: '0 0 4px 0',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#0f172a',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.2',
                    height: '2.4em'
                  }}>
                    {product.title}
                  </p>

                  {upsellConfig.showReviews && (
                    <div style={{ display: 'flex', justifyContent: currentDir === 'row' ? 'center' : 'flex-start', gap: '2px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#f59e0b' }}>★★★★★</span>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>(12)</span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    flexDirection: currentDir === 'row' ? 'column' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    width: '100%'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981' }}>₹{product.price}</span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      style={{
                        width: currentDir === 'row' ? '100%' : 'auto',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '800',
                        backgroundColor: '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        marginTop: currentDir === 'row' ? '4px' : '0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {upsellConfig.buttonText || 'Add to cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div style={{
              width: '100%',
              padding: '24px 16px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '8px'
            }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#334155' }}>
                UPSell Preview
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', maxWidth: '80%' }}>
                {currentUseAI
                  ? "AI will automatically show recommendations here based on cart contents."
                  : upsellConfig.manualRules?.length > 0
                    ? "Add a trigger product to your cart to see its specific upsell recommendation."
                    : "Create a manual rule in the editor to see previews here."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div style={{ position: 'relative', height: '100%', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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

        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#000' }}>Your Cart</h3>
            <button style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Progress Bar Feature - Integrated Milestones */}
            {isEnabled(featureStates.progressBarEnabled) && (isEnabled(progressBarSettings.showOnEmpty) || !showEmpty) && (
              <div style={{
                padding: '24px 16px',
                order: progressBarSettings.placement === 'bottom' ? 10 : -2,
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.05)',
                marginBottom: '20px',
                position: 'relative',
                border: '1px solid #f1f5f9'
              }}>
                {/* CSS for Animations */}
                <style>{`
                  @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                  }
                  @keyframes pulse-ring {
                    0% { box-shadow: 0 0 0 0 ${progressBarSettings.barForegroundColor || '#2563eb'}66; }
                    70% { box-shadow: 0 0 0 6px ${progressBarSettings.barForegroundColor || '#2563eb'}00; }
                    100% { box-shadow: 0 0 0 0 ${progressBarSettings.barForegroundColor || '#2563eb'}00; }
                  }
                  .milestone-hover-scale:hover {
                     transform: translate(-50%, -50%) scale(1.15) !important;
                     z-index: 20 !important;
                  }
                `}</style>

                {/* Header Info */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  {(() => {
                    const activeMilestone = getActiveMilestone(progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity, previewMilestones, progressMode);
                    if (activeMilestone.upcoming) {
                      const amountLeft = activeMilestone.nextAmount;
                      const rewardText = activeMilestone.upcoming.rewardText;
                      return (
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '500', color: '#64748b' }}>
                            You're <span style={{ color: '#0f172a', fontWeight: '700' }}>{progressMode === 'amount' ? `₹${amountLeft}` : `${amountLeft} items`}</span> away
                          </p>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: progressBarSettings.barForegroundColor || '#2563eb' }}>
                            Unlock: {rewardText}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🎉</span>
                        <span style={{ fontSize: '15px', fontWeight: '700' }}>{progressBarSettings.completionText || 'All Rewards Unlocked!'}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Progress Track */}
                <div style={{ position: 'relative', height: '40px', marginBottom: '8px', padding: '0 10px' }}>
                  {/* Background Line */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '12px',
                    right: '12px',
                    height: '8px',
                    marginTop: '-4px',
                    backgroundColor: progressBarSettings.barBackgroundColor || '#f1f5f9',
                    borderRadius: '99px',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
                  }} />

                  {/* Foreground Fill */}
                  {(() => {
                    const currentVal = progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity;
                    const percentage = Math.min(100, (currentVal / maxTargetSetting) * 100);

                    return (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '12px',
                        height: '8px',
                        marginTop: '-4px',
                        width: `calc(${percentage}% - 24px)`,
                        maxWidth: 'calc(100% - 24px)',
                        background: progressBarSettings.fill_gradient || `linear-gradient(90deg, ${progressBarSettings.barForegroundColor || '#2563eb'}, #60a5fa, ${progressBarSettings.barForegroundColor || '#2563eb'})`,
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 3s infinite linear',
                        borderRadius: '99px',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `0 0 15px ${progressBarSettings.barForegroundColor || '#2563eb'}66`,
                        zIndex: 1
                      }} />
                    );
                  })()}

                  {/* Milestone Nodes */}
                  {previewMilestones.map((ms, idx) => {
                    const currentVal = progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity;
                    const isCompleted = currentVal >= ms.target;
                    const percent = Math.min(100, Math.max(0, (ms.target / maxTargetSetting) * 100));

                    // Icon logic based on text or generic
                    let icon = '🔒';
                    if (isCompleted) icon = '🎁';
                    if (ms.rewardText.toLowerCase().includes('ship')) icon = isCompleted ? '🚚' : '🚛';
                    if (ms.rewardText.toLowerCase().includes('discount') || ms.rewardText.includes('%')) icon = isCompleted ? '🏷️' : '🎫';

                    return (
                      <div
                        key={ms.id}
                        style={{
                          position: 'absolute',
                          left: `${percent}%`,
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: ms.associatedProducts.length > 0 ? 'pointer' : 'default',
                        }}
                        onClick={() => handleMilestoneProductClick(ms.associatedProducts, ms.rewardText)}
                      >
                        {/* Node Circle */}
                        {/* Node Circle */}
                        {(() => {
                          const isNext = !isCompleted && (idx === 0 || ((progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity) >= previewMilestones[idx - 1].target));
                          return (
                            <div style={{
                              width: isCompleted || isNext ? '40px' : '32px',
                              height: isCompleted || isNext ? '40px' : '32px',
                              borderRadius: '12px',
                              backgroundColor: isCompleted ? (progressBarSettings.barForegroundColor || '#2563eb') : '#ffffff',
                              border: `2px solid ${isCompleted ? (progressBarSettings.barForegroundColor || '#2563eb') : (isNext ? (progressBarSettings.barForegroundColor || '#2563eb') : '#cbd5e1')}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isCompleted || isNext ? '18px' : '14px',
                              boxShadow: isCompleted ? `0 4px 12px ${progressBarSettings.barForegroundColor || '#2563eb'}66` : '0 2px 5px rgba(0,0,0,0.05)',
                              color: isCompleted ? '#fff' : '#94a3b8',
                              animation: isNext ? 'pulse-ring 2s infinite' : 'none',
                              position: 'relative',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease'
                            }}>
                              {(() => {
                                if (ms.associatedProducts.length > 0) {
                                  const firstProd = loadedShopifyProducts.find(p => p.id === ms.associatedProducts[0]);
                                  if (firstProd && firstProd.image && (firstProd.image.startsWith('http') || firstProd.image.startsWith('//'))) {
                                    return <img src={firstProd.image} alt="Reward" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isCompleted ? 1 : 0.5 }} />;
                                  }
                                  return firstProd?.image || icon;
                                }
                                return icon;
                              })()}

                              {isCompleted && (
                                <div style={{
                                  position: 'absolute',
                                  inset: 0,
                                  backgroundColor: (progressBarSettings.barForegroundColor || '#2563eb') + '40',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 1
                                }}>
                                  <div style={{
                                    width: '18px',
                                    height: '18px',
                                    backgroundColor: '#10b981',
                                    borderRadius: '50%',
                                    border: '2px solid #fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', color: '#fff'
                                  }}>✓</div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Floating Tooltip Label */}
                        {(() => {
                          const isNext = !isCompleted && (idx === 0 || ((progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity) >= previewMilestones[idx - 1].target));
                          return (
                            <div style={{
                              position: 'absolute',
                              bottom: isCompleted ? '-48px' : '-32px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              whiteSpace: 'nowrap',
                              fontSize: isCompleted ? '10px' : '11px',
                              fontWeight: '700',
                              color: isCompleted ? '#10b981' : '#64748b',
                              backgroundColor: '#fff',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                              border: `1px solid ${isCompleted ? '#d1fae5' : '#f1f5f9'}`,
                              opacity: isCompleted || isNext ? 1 : 0.7,
                              pointerEvents: 'none',
                              zIndex: 10,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              transition: 'all 0.3s ease'
                            }}>
                              {isCompleted ? (
                                <>
                                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Reached</span>
                                  <span style={{ color: '#0f172a' }}>{ms.rewardText}</span>
                                </>
                              ) : (
                                <span>{progressMode === 'amount' ? `₹${ms.target}` : `${ms.target}`}</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>

                {/* Unlocked Products Preview (Integrated) */}
                {(() => {
                  const currentVal = progressMode === 'amount' ? cartData.cartValue : cartData.totalQuantity;
                  const reachedWithProducts = previewMilestones.filter(ms => currentVal >= ms.target && ms.associatedProducts.length > 0);

                  if (reachedWithProducts.length === 0) return null;

                  const allReachedProductIds = [...new Set(reachedWithProducts.flatMap(ms => ms.associatedProducts))];

                  return (
                    <div style={{
                      marginTop: '55px',
                      paddingTop: '12px',
                      borderTop: '1px dashed #e2e8f0',
                      animation: 'fadeIn 0.5s ease'
                    }}>
                      <style>{`
                        @keyframes fadeIn {
                          from { opacity: 0; transform: translateY(5px); }
                          to { opacity: 1; transform: translateY(0); }
                        }
                      `}</style>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px' }}>🎁</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>Rewards Unlocked!</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        paddingBottom: '4px',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}>
                        {allReachedProductIds.map(productId => {
                          const product = loadedShopifyProducts.find(p => p.id === productId);
                          if (!product) return null;
                          return (
                            <div key={product.id} style={{
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: '#f8fafc',
                              padding: '4px 8px 4px 4px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0'
                            }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#fff',
                                borderRadius: '6px',
                                border: '1px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                              }}>
                                {product.image && (product.image.startsWith('http') || product.image.startsWith('//')) ? (
                                  <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize: '16px' }}>{product.image || '📦'}</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#1e293b', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {product.title}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '8px', fontWeight: '800', backgroundColor: '#e2e8f0', color: '#64748b', padding: '1px 3px', borderRadius: '2px' }}>ADDED</span>
                                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#10b981' }}>₹{Number(product.price || 0).toFixed(0)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Empty State Message */}
            {showEmpty && (
              <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px' }}>
                <div style={{ fontSize: '40px' }}>🛒</div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111' }}>Your cart is empty</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Add items to unlock rewards</p>
              </div>
            )}

            {/* Upsell Position: TOP */}
            {currentPos === 'top' && upsellSectionJSX}

            {!showEmpty && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.01em' }}>Items included</p>
                  <div style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>{itemsToRender.length} ITEMS</span>
                  </div>
                </div>

                {itemsToRender.map((item, idx) => {
                  const isReward = item.isAddedByCondition;
                  return (
                    <div key={idx} style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: isReward ? '#f0fdf4' : '#ffffff',
                      borderRadius: '16px',
                      border: isReward ? '1px solid #dcfce7' : '1px solid #f1f5f9',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      position: 'relative'
                    }}>
                      {/* Item Image */}
                      <div style={{
                        width: '70px',
                        height: '70px',
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        flexShrink: 0,
                        border: '1px solid #f1f5f9',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {item.displayImage ? (
                          <img src={item.displayImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '32px' }}>{item.placeholderImage}</span>
                        )}
                      </div>

                      {/* Item Info */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {item.name}
                          </p>
                          {!isReward && (
                            <button
                              onClick={() => handleRemoveProduct(idx)}
                              style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', transition: 'color 0.2s' }}
                              title="Remove item"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>₹{(Number(item.price) || 0).toFixed(0)}</span>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>({item.quantity} × ₹{(Number(item.price) || 0).toFixed(0)})</span>
                            </div>
                            {isReward && <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981' }}>FREE REWARD</span>}
                          </div>

                          {!isReward ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                padding: '2px'
                              }}>
                                <button
                                  onClick={() => handleUpdateQuantity(idx, -1)}
                                  style={{ width: '28px', height: '28px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#64748b' }}
                                >−</button>
                                <span style={{ width: '24px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(idx, 1)}
                                  style={{ width: '28px', height: '28px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#64748b' }}
                                >+</button>
                              </div>
                              <div style={{ textAlign: 'right', minWidth: '60px' }}>
                                <span style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>
                                  ₹{((Number(item.price) || 0) * item.quantity).toFixed(0)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Qty: {item.quantity}</span>
                              <div style={{ textAlign: 'right', minWidth: '60px' }}>
                                <span style={{ fontWeight: '800', fontSize: '15px', color: '#10b981' }}>FREE</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Coupon Feature - Product Widget Style */}
                {isEnabled(featureStates.couponSliderEnabled) && (
                  (() => {
                    // Determine which coupons to show - ONLY show if explicitly selected
                    if (selectedActiveCoupons.length === 0) return null;

                    const couponsToShow = selectedActiveCoupons
                      .map(id => {
                        const apiCoupon = activeCouponsFromAPI.find(c => c.id === id) || allCoupons.find(c => (c.internal_id || c.id) === id) || { id };
                        const override = couponOverrides[id] || {};
                        return {
                          ...apiCoupon,
                          ...override,
                          code: override.code || apiCoupon.code || 'CODE',
                          label: override.label || apiCoupon.title || apiCoupon.label || 'Coupon',
                          enabled: true
                        };
                      });

                    return (
                      <div style={{
                        padding: '16px',
                        order: couponPosition === 'top' ? -1 : 999,
                        backgroundColor: '#fff',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <Text as="h3" variant="headingSm" fontWeight="bold">
                            Available Offers
                          </Text>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleScrollCoupons('left')}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                            >
                              ←
                            </button>
                            <button
                              onClick={() => handleScrollCoupons('right')}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                            >
                              →
                            </button>
                          </div>
                        </div>

                        <div ref={couponSliderRef} style={{
                          display: couponLayout === 'grid' ? 'grid' : 'flex',
                          gridTemplateColumns: couponLayout === 'grid' ? (couponAlignment === 'horizontal' ? 'repeat(2, 1fr)' : '1fr') : undefined,
                          flexDirection: couponLayout === 'carousel' ? (couponAlignment === 'horizontal' ? 'row' : 'column') : undefined,
                          gap: '12px',
                          paddingBottom: '4px',
                          scrollBehavior: 'smooth',
                          overflowX: couponLayout === 'carousel' && couponAlignment === 'horizontal' ? 'auto' : 'hidden',
                          overflowY: couponLayout === 'carousel' && couponAlignment === 'vertical' ? 'auto' : 'hidden',
                        }}>
                          {couponsToShow.map((coupon, idx) => {
                            const displayCoupon = editingCoupon && editingCoupon.id === coupon.id ? editingCoupon : coupon;
                            const isApplied = appliedCouponIds.includes(coupon.id);

                            if (selectedCouponStyle === COUPON_STYLES.STYLE_1) {
                              return (
                                <div key={coupon.id} style={{
                                  minWidth: '240px',
                                  padding: '12px 16px',
                                  backgroundColor: '#fff',
                                  borderRadius: '8px',
                                  border: `1px solid ${isApplied ? displayCoupon.backgroundColor : '#e2e8f0'}`,
                                  boxShadow: isApplied ? `0 2px 8px ${displayCoupon.backgroundColor}30` : '0 2px 4px rgba(0,0,0,0.02)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  transition: 'all 0.2s ease'
                                }}>
                                  <div style={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                                    backgroundColor: displayCoupon.backgroundColor || '#1e293b'
                                  }}></div>
                                  <div style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '8px',
                                    backgroundColor: '#e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '22px',
                                    flexShrink: 0
                                  }}>
                                    {displayCoupon.iconUrl || '🎟️'}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{displayCoupon.code}</p>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{displayCoupon.label}</p>
                                  </div>
                                  <button
                                    onClick={() => handleCopyCouponCode(coupon.code, coupon.id)}
                                    style={{
                                      padding: '6px 14px',
                                      backgroundColor: isApplied ? displayCoupon.backgroundColor : 'transparent',
                                      color: isApplied ? '#fff' : '#475569',
                                      border: isApplied ? `1px solid ${displayCoupon.backgroundColor}` : '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    {isApplied ? 'Applied' : 'Apply'}
                                  </button>
                                </div>
                              );
                            }

                            if (selectedCouponStyle === COUPON_STYLES.STYLE_2) {
                              return (
                                <div key={coupon.id} style={{ minWidth: '180px', padding: '16px', backgroundColor: '#fff', borderRadius: '16px', border: isApplied ? `2px solid ${displayCoupon.backgroundColor}` : '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px', position: 'relative' }}>
                                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: displayCoupon.backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff', boxShadow: `0 4px 10px ${displayCoupon.backgroundColor}60` }}>{displayCoupon.iconUrl || '🎁'}</div>
                                  <div>
                                    <p style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{displayCoupon.code}</p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{displayCoupon.description}</p>
                                  </div>
                                  <button onClick={() => handleCopyCouponCode(coupon.code, coupon.id)} style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: isApplied ? '#10b981' : '#1e293b', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>{isApplied ? '✓ Applied' : 'Apply Coupon'}</button>
                                </div>
                              );
                            }

                            return (
                              <div key={coupon.id} style={{ minWidth: '280px', padding: '0', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ backgroundColor: displayCoupon.backgroundColor, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: displayCoupon.textColor }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>{displayCoupon.iconUrl || '⚡'}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '700' }}>{displayCoupon.label}</span>
                                  </div>
                                  <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{displayCoupon.discountValue}% OFF</div>
                                </div>
                                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                  <div style={{ flex: 1, border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '6px 10px', backgroundColor: '#f8fafc' }}>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#334155', fontFamily: 'monospace' }}>{displayCoupon.code}</p>
                                  </div>
                                  <button onClick={() => handleCopyCouponCode(coupon.code, coupon.id)} style={{ border: 'none', background: 'none', color: isApplied ? '#10b981' : '#2563eb', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: '4px' }}>{isApplied ? 'REMOVE' : 'APPLY'}</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                )}
              </>
            )}

            {/* Upsell Position: BOTTOM */}
            {currentPos === 'bottom' && upsellSectionJSX}
          </div>

          {/* Sticky Footer */}
          <div style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)',
            flexShrink: 0,
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Subtotal</span>
                <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>₹{totalWithRewards.toFixed(0)}</span>
              </div>

              {appliedCouponIds.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#10b981' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Discounts</span>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>-₹{previewTotalDiscount.toFixed(0)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>Total</span>
                <span style={{ fontSize: '18px', color: '#0f172a', fontWeight: '900' }}>₹{previewFinalTotal.toFixed(0)}</span>
              </div>
            </div>

            <button style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease'
            }}>
              Checkout Now
              <span style={{ fontSize: '18px' }}>→</span>
            </button>
            <p style={{ margin: '12px 0 0 0', textAlign: 'center', fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
              Shipping and taxes calculated at checkout
            </p>
          </div>
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

  const contextualSaveBarMarkup = isUpsellConfigDirty ? (
    <ContextualSaveBar
      message="Unsaved changes in Upsell flow"
      saveAction={{
        label: 'Save',
        onAction: handleSaveUpsellRules,
        loading: upsellSaving,
      }}
      discardAction={{
        label: 'Discard',
        onAction: handleCancelUpsellRules,
      }}
    />
  ) : null;

  return (
    <Frame>
      {contextualSaveBarMarkup}
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
              {selectedMilestoneText && (
                <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                  <Text variant="headingMd" tone="success">✨ {selectedMilestoneText}</Text>
                </div>
              )}

              {selectedMilestoneProduct && selectedMilestoneProduct.length > 0 ? (
                <BlockStack gap="300">
                  <Text variant="bodySm" tone="subdued">The following products will be automatically added to your cart when this milestone is reached:</Text>
                  {selectedMilestoneProduct.map(product => {
                    const isUrl = product.image && (product.image.startsWith('http') || product.image.startsWith('//'));
                    return (
                      <Card key={product.id}>
                        <InlineStack align="space-between" blockAlign="center">
                          <InlineStack gap="300" blockAlign="center">
                            <div style={{
                              width: '48px',
                              height: '48px',
                              backgroundColor: '#f6f6f7',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #e1e3e5'
                            }}>
                              {isUrl ? (
                                <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: '24px' }}>{product.image || '🎁'}</span>
                              )}
                            </div>
                            <BlockStack gap="050">
                              <Text variant="headingSm" as="h3">{product.title}</Text>
                              <Text as="p" tone="subdued" variant="bodySm">₹{Number(product.price || 0).toFixed(0)}</Text>
                            </BlockStack>
                          </InlineStack>
                          <Badge tone="info">Automatic</Badge>
                        </InlineStack>
                      </Card>
                    );
                  })}
                </BlockStack>
              ) : (
                !selectedMilestoneText && <Text variant="bodyMd" tone="subdued" textAlign="center">No specific rewards associated with this milestone.</Text>
              )}
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

        {/* Modal: Progress Bar Product Picker */}
        <Modal
          open={showProductPicker}
          onClose={() => setShowProductPicker(false)}
          title="Select Reward Products"
          primaryAction={{
            content: 'Save Selection',
            onAction: handleSaveSelectedProducts,
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setShowProductPicker(false),
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text variant="bodyMd" tone="subdued">
                Select products that will be shown as rewards for this milestone.
              </Text>
              <ProductPicker
                label="Reward Products"
                selected={selectedProductIds}
                onChange={setSelectedProductIds}
                products={loadedShopifyProducts}
              />
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

              <BlockStack gap="200">
                <Text variant="bodySm" fontWeight="semibold">Collections</Text>
                <BlockStack gap="100">
                  {loadedShopifyCollections
                    .filter(col => col.title.toLowerCase().includes((productSearchQuery || '').toLowerCase()))
                    .map(col => (
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
                  {loadedShopifyCollections.filter(col => col.title.toLowerCase().includes((productSearchQuery || '').toLowerCase())).length === 0 && (
                    <Text variant="bodySm" tone="subdued">No collections found</Text>
                  )}
                </BlockStack>
              </BlockStack>

              <BlockStack gap="200">
                <Text variant="bodySm" fontWeight="semibold">Products</Text>
                <BlockStack gap="100">
                  {loadedShopifyProducts
                    .filter(p => p.title.toLowerCase().includes((productSearchQuery || '').toLowerCase()))
                    .map(prod => (
                      <Checkbox
                        key={prod.id}
                        label={`${prod.title} (₹${prod.price})`}
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
                  {loadedShopifyProducts
                    .filter(p => p.title.toLowerCase().includes((productSearchQuery || '').toLowerCase())).length === 0 && (
                      <Text variant="bodySm" tone="subdued">No products found</Text>
                    )}
                </BlockStack>
              </BlockStack>

              {(tempSelectedProductIds.length > 0 || tempSelectedCollectionIds.length > 0) && (
                <BlockStack gap="100">
                  <Text variant="bodySm" fontWeight="semibold">Selected ({tempSelectedProductIds.length + tempSelectedCollectionIds.length})</Text>
                  <InlineStack gap="100" wrap>
                    {tempSelectedCollectionIds.map(id => {
                      const collection = loadedShopifyCollections.find(c => c.id === id);
                      return (
                        <Tag key={id} onRemove={() =>
                          setTempSelectedCollectionIds(
                            tempSelectedCollectionIds.filter(cid => cid !== id)
                          )
                        }>
                          {collection?.title || id}
                        </Tag>
                      );
                    })}
                    {tempSelectedProductIds.map(id => {
                      const product = loadedShopifyProducts.find(p => p.id === id);
                      return (
                        <Tag key={id} onRemove={() =>
                          setTempSelectedProductIds(
                            tempSelectedProductIds.filter(pid => pid !== id)
                          )
                        }>
                          {product?.title || id}
                        </Tag>
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
          <div style={{ height: 'calc(100vh - 49px)', overflowY: 'auto', overflowX: 'hidden' }}>
            {renderCartPreview()}
          </div>
        </div>
      </div>
    </Frame>
  );
}

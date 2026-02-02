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
} from '@shopify/polaris';

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

            <Card>
              <BlockStack gap="300">
                <Text variant="headingSm" as="h3">Progress Bar Configuration</Text>
                <Text as="p" tone="subdued">
                  Configure your progress bar settings here. This feature shows customers how close they are to free shipping.
                </Text>
                <Divider />
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">Threshold Amount</Text>
                  <Text as="p" tone="subdued">Placeholder for threshold input</Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">Message Template</Text>
                  <Text as="p" tone="subdued">Placeholder for message template</Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">Progress Bar Color</Text>
                  <Text as="p" tone="subdued">Placeholder for color picker</Text>
                </BlockStack>
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
            {featureStates.progressBarEnabled && (
              <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #86efac' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#16a34a' }}>🎯 Free shipping at $100!</p>
                <div style={{ height: '6px', backgroundColor: '#bbf7d0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '65%', backgroundColor: '#16a34a' }} />
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#15803d' }}>Add $35 more to unlock free shipping</p>
              </div>
            )}

            {showEmpty ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px' }}>
                <div style={{ fontSize: '40px' }}>🛒</div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111' }}>Your cart is empty</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Add items to get started</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                {mockCartItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: '#d1d5db', borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280' }}>${item.price.toFixed(2)}</p>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>−</button>
                        <span style={{ fontSize: '13px', fontWeight: '500', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#111' }}>${(item.price * item.quantity).toFixed(2)}</div>
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
                <span style={{ fontWeight: '700', color: '#111', fontSize: '16px' }}>${cartTotal.toFixed(2)}</span>
              </div>
              <button style={{ width: '100%', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                Checkout • ${cartTotal.toFixed(2)}
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

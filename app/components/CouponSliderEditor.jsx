import React from 'react';
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Checkbox,
  TextField,
  Select,
  Divider,
  Badge,
  Box,
  Icon,
  Tabs,
  Layout,
  ChoiceList,
} from '@shopify/polaris';
import {
  SettingsIcon,
  DiscountIcon,
  LayoutIcon,
} from '@shopify/polaris-icons';
import { COUPON_STYLES } from '../services/api.cart-settings.shared';

export default function CouponSliderEditor({
  featureStates,
  toggleFeature,
  couponSubTab,
  setCouponSubTab,
  selectedCouponStyle,
  handleStyleSelect,
  handleSaveStyle,
  isSaving,
  couponPosition,
  setCouponPosition,
  couponLayout,
  setCouponLayout,
  couponAlignment,
  setCouponAlignment,
  handleCancelStyle,
  allCoupons,
  activeCouponTab,
  handleCouponTabClick,
  editingCoupon,
  updateCouponField,
  handleSaveCoupon,
  handleCancelCoupon,
}) {
  const tabs = [
    {
      id: 'global-style',
      content: 'Global Style',
      accessibilityLabel: 'Global Style',
      panelID: 'global-style-panel',
    },
    {
      id: 'manage-coupons',
      content: 'Manage Coupons',
      accessibilityLabel: 'Manage Coupons',
      panelID: 'manage-coupons-panel',
    },
  ];

  const selectedTabIdx = tabs.findIndex((tab) => tab.id === couponSubTab);

  const handleTabChange = (selectedTabIndex) => {
    setCouponSubTab(tabs[selectedTabIndex].id);
  };

  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      <BlockStack gap="400">
        {/* Header */}
        <Box paddingBlockStart="400" paddingBlockEnd="400">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text variant="headingLg" as="h1">Coupon Slider</Text>
              <Text variant="bodySm" tone="subdued">Customizable coupon display and management.</Text>
            </BlockStack>
          </InlineStack>
        </Box>

        {/* Feature Enable Card */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text variant="headingMd" as="h2">Enable Feature</Text>
                <Text variant="bodySm" tone="subdued">Show the coupon slider in your cart.</Text>
              </BlockStack>
              <Checkbox
                label="Enabled"
                labelHidden
                checked={featureStates.couponSliderEnabled}
                onChange={() => toggleFeature('couponSliderEnabled')}
              />
            </InlineStack>
          </BlockStack>
        </Card>

        {featureStates.couponSliderEnabled && (
          <>
            <Tabs tabs={tabs} selected={selectedTabIdx} onSelect={handleTabChange}>
              <Box paddingBlockStart="400">
                {couponSubTab === 'global-style' && (
                  <BlockStack gap="400">
                    <Card>
                      <BlockStack gap="400">
                        <InlineStack gap="200" blockAlign="center">
                          <Icon source={LayoutIcon} tone="base" />
                          <Text variant="headingMd" as="h2">Style & Layout</Text>
                        </InlineStack>

                        <Text variant="headingSm" as="h3">Select Template</Text>
                        <InlineStack gap="300">
                          {Object.entries(COUPON_STYLES).map(([key, value]) => (
                            <div
                              key={value}
                              onClick={() => handleStyleSelect(value)}
                              style={{
                                flex: 1,
                                padding: '16px',
                                border: selectedCouponStyle === value ? '2px solid #008060' : '1px solid #e1e3e5',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                backgroundColor: selectedCouponStyle === value ? '#f0fdf4' : '#fff',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Text fontWeight={selectedCouponStyle === value ? 'bold' : 'regular'}>
                                {value.replace('style-', 'Style ')}
                              </Text>
                            </div>
                          ))}
                        </InlineStack>

                        <Divider />

                        <Layout>
                          <Layout.Section variant="oneHalf">
                            <ChoiceList
                              title="Widget Position"
                              choices={[
                                { label: 'Top of Cart', value: 'top' },
                                { label: 'Bottom of Cart', value: 'bottom' },
                              ]}
                              selected={[couponPosition]}
                              onChange={(val) => setCouponPosition(val[0])}
                            />
                          </Layout.Section>
                          <Layout.Section variant="oneHalf">
                            <ChoiceList
                              title="Layout Type"
                              choices={[
                                { label: 'Grid', value: 'grid' },
                                { label: 'Carousel (Slider)', value: 'carousel' },
                              ]}
                              selected={[couponLayout]}
                              onChange={(val) => setCouponLayout(val[0])}
                            />
                          </Layout.Section>
                        </Layout>

                        <ChoiceList
                          title="Card Alignment"
                          choices={[
                            { label: 'Horizontal (Rectangular)', value: 'horizontal' },
                            { label: 'Vertical (Square)', value: 'vertical' },
                          ]}
                          selected={[couponAlignment]}
                          onChange={(val) => setCouponAlignment(val[0])}
                        />

                        <InlineStack align="end" gap="200">
                          <Button onClick={handleCancelStyle}>Discard</Button>
                          <Button variant="primary" onClick={handleSaveStyle} loading={isSaving}>Save Global Style</Button>
                        </InlineStack>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}

                {couponSubTab === 'manage-coupons' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' }}>
                    {/* Coupon List Sidebar */}
                    <Card padding="0">
                      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <Box padding="400">
                          <Text variant="headingMd" as="h2">Coupons</Text>
                        </Box>
                        {allCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            onClick={() => handleCouponTabClick(coupon.id)}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              backgroundColor: activeCouponTab === coupon.id ? '#f3f4f6' : 'transparent',
                              borderLeft: activeCouponTab === coupon.id ? '4px solid #008060' : '4px solid transparent',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              borderBottom: '1px solid #f1f1f1'
                            }}
                          >
                            <span style={{ fontSize: '20px' }}>{coupon.iconUrl || '🎟️'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text variant="bodySm" fontWeight="bold" truncate>{coupon.code}</Text>
                              <Text variant="bodyXs" tone="subdued" truncate>{coupon.label}</Text>
                            </div>
                            {!coupon.enabled && <Badge tone="subdued" size="small">Off</Badge>}
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Edit Coupon Form */}
                    {editingCoupon ? (
                      <Card>
                        <BlockStack gap="400">
                          <InlineStack align="space-between" blockAlign="center">
                            <Text variant="headingMd" as="h3">Edit: {editingCoupon.code}</Text>
                            <Checkbox
                              label="Enabled"
                              checked={editingCoupon.enabled}
                              onChange={(val) => updateCouponField('enabled', val)}
                            />
                          </InlineStack>

                          <Divider />

                          <InlineStack gap="400">
                            <div style={{ flex: 1 }}>
                              <TextField
                                label="Coupon Code"
                                value={editingCoupon.code}
                                onChange={(val) => updateCouponField('code', val)}
                                autoComplete="off"
                              />
                            </div>
                            <div style={{ width: '100px' }}>
                              <TextField
                                label="Icon"
                                value={editingCoupon.iconUrl}
                                onChange={(val) => updateCouponField('iconUrl', val)}
                                placeholder="e.g., 🎟️"
                                autoComplete="off"
                              />
                            </div>
                          </InlineStack>

                          <TextField
                            label="Title/Label"
                            value={editingCoupon.label}
                            onChange={(val) => updateCouponField('label', val)}
                            placeholder="e.g., Summer Sale"
                            autoComplete="off"
                          />

                          <TextField
                            label="Description"
                            value={editingCoupon.description}
                            onChange={(val) => updateCouponField('description', val)}
                            placeholder="e.g., Get 10% off on all items"
                            multiline={2}
                            autoComplete="off"
                          />

                          <InlineStack gap="400">
                            <div style={{ flex: 1 }}>
                              <Select
                                label="Discount Type"
                                options={[
                                  { label: 'Percentage (%)', value: 'percentage' },
                                  { label: 'Fixed Amount (₹)', value: 'fixed' },
                                ]}
                                value={editingCoupon.discountType}
                                onChange={(val) => updateCouponField('discountType', val)}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <TextField
                                label="Discount Value"
                                type="number"
                                value={String(editingCoupon.discountValue)}
                                onChange={(val) => updateCouponField('discountValue', parseFloat(val) || 0)}
                                autoComplete="off"
                              />
                            </div>
                          </InlineStack>

                          <InlineStack gap="400">
                            <div style={{ flex: 1 }}>
                              <ColorPickerField
                                label="Background Color"
                                value={editingCoupon.backgroundColor}
                                onChange={(val) => updateCouponField('backgroundColor', val)}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <ColorPickerField
                                label="Text Color"
                                value={editingCoupon.textColor}
                                onChange={(val) => updateCouponField('textColor', val)}
                              />
                            </div>
                          </InlineStack>

                          <Divider />

                          <InlineStack align="end" gap="200">
                            <Button onClick={handleCancelCoupon}>Cancel</Button>
                            <Button variant="primary" onClick={handleSaveCoupon} loading={isSaving}>Save Coupon Changes</Button>
                          </InlineStack>
                        </BlockStack>
                      </Card>
                    ) : (
                      <Card>
                        <Box padding="1000">
                          <BlockStack gap="400" align="center">
                            <Icon source={DiscountIcon} tone="subdued" />
                            <Text tone="subdued" alignment="center">Select a coupon from the sidebar to start editing.</Text>
                          </BlockStack>
                        </Box>
                      </Card>
                    )}
                  </div>
                )}
              </Box>
            </Tabs>
          </>
        )}
      </BlockStack>
    </div>
  );
}

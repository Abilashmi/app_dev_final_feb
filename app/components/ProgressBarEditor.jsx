import React, { useState } from 'react';
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
  Popover,
  ColorPicker,
  hsbToRgb,
  rgbToHsb,
  rgbToHex,
} from '@shopify/polaris';
import {
  DeleteIcon,
  PlusIcon,
  ProductIcon,
  SettingsIcon,
  ColorIcon,
} from '@shopify/polaris-icons';

// --- UTILITY FUNCTIONS (Local copies for simplicity or import if available) ---
function hsbToHex(hsb) {
  const { hue, saturation, brightness } = hsb;
  const h = hue / 360;
  const s = saturation;
  const v = brightness;

  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = 0; g = 0; b = 0;
  }

  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsb(hex) {
  if (!hex) return { hue: 0, saturation: 0, brightness: 0 };
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h /= 6;
  }

  return { hue: h * 360, saturation: s, brightness: v };
}

function ColorPickerField({ label, value, onChange }) {
  const [popoverActive, setPopoverActive] = useState(false);
  const [color, setColor] = useState(hexToHsb(value || '#000000'));

  const handleColorChange = (newColor) => {
    setColor(newColor);
    onChange(hsbToHex(newColor));
  };

  const activator = (
    <Button onClick={() => setPopoverActive(!popoverActive)} disclosure>
      <InlineStack gap="200" blockAlign="center">
        <div
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: value,
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
        <Text variant="bodySm">{value}</Text>
      </InlineStack>
    </Button>
  );

  return (
    <BlockStack gap="100">
      <Text as="label" variant="bodySm" fontWeight="semibold">
        {label}
      </Text>
      <Popover
        active={popoverActive}
        activator={activator}
        onClose={() => setPopoverActive(false)}
        preferredAlignment="left"
      >
        <Box padding="300">
          <ColorPicker onChange={handleColorChange} color={color} />
          <Box paddingBlockStart="200">
            <TextField
              label="Hex"
              labelHidden
              value={value}
              onChange={(v) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
                  setColor(hexToHsb(v));
                }
                onChange(v);
              }}
              prefix="#"
              maxLength={7}
              autoComplete="off"
            />
          </Box>
        </Box>
      </Popover>
    </BlockStack>
  );
}

export default function ProgressBarEditor({
  progressBarSettings,
  updateProgressBarSetting,
  featureStates,
  toggleFeature,
  progressMode,
  setProgressMode,
  activeTierIndex,
  setActiveTierIndex,
  addTier,
  removeTier,
  updateTierSetting,
  handleSaveProgressBarSettings,
  handleOpenProductPicker,
  loadedShopifyProducts,
}) {
  const productsList = loadedShopifyProducts;

  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      <BlockStack gap="400">
        {/* Header with Save Button */}
        <Box paddingBlockStart="400" paddingBlockEnd="400">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text variant="headingLg" as="h1">Progress Bar</Text>
              <Text variant="bodySm" tone="subdued">Configure rewards and targets for your customers.</Text>
            </BlockStack>
            <Button variant="primary" onClick={handleSaveProgressBarSettings}>Save Changes</Button>
          </InlineStack>
        </Box>

        {/* Feature Enable Card */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text variant="headingMd" as="h2">Enable Feature</Text>
                <Text variant="bodySm" tone="subdued">Activate or deactivate the progress bar in the cart.</Text>
              </BlockStack>
              <Checkbox
                label="Enabled"
                labelHidden
                checked={featureStates.progressBarEnabled}
                onChange={() => toggleFeature('progressBarEnabled')}
              />
            </InlineStack>
          </BlockStack>
        </Card>

        {featureStates.progressBarEnabled && (
          <>
            {/* General Settings Card */}
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={SettingsIcon} tone="base" />
                  <Text variant="headingMd" as="h2">General Settings</Text>
                </InlineStack>

                <InlineStack gap="600" align="start">
                  <div style={{ flex: 1 }}>
                    <Select
                      label="Progress Calculation Mode"
                      options={[
                        { label: 'Cart Total Amount', value: 'amount' },
                        { label: 'Total Item Quantity', value: 'quantity' },
                      ]}
                      value={progressMode}
                      onChange={(value) => {
                        setProgressMode(value);
                        updateProgressBarSetting('rewardsCalculation', [value === 'amount' ? 'cartTotal' : 'cartQuantity']);
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Checkbox
                      label="Show on empty cart"
                      checked={progressBarSettings.showOnEmpty}
                      onChange={(value) => updateProgressBarSetting('showOnEmpty', value)}
                    />
                  </div>
                </InlineStack>

                <Divider />

                <Text variant="headingSm" as="h3">Visual Styling</Text>
                <InlineStack gap="400">
                  <ColorPickerField
                    label="Background Color"
                    value={progressBarSettings.barBackgroundColor || '#E2E2E2'}
                    onChange={(hex) => updateProgressBarSetting('barBackgroundColor', hex)}
                  />
                  <ColorPickerField
                    label="Foreground Color"
                    value={progressBarSettings.barForegroundColor || '#2563eb'}
                    onChange={(hex) => updateProgressBarSetting('barForegroundColor', hex)}
                  />
                  <div style={{ width: '150px' }}>
                    <TextField
                      label="Border Radius (px)"
                      type="number"
                      value={String(progressBarSettings.borderRadius)}
                      onChange={(value) => updateProgressBarSetting('borderRadius', parseInt(value) || 0)}
                      autoComplete="off"
                    />
                  </div>
                </InlineStack>

                <TextField
                  label="Completion Message"
                  value={progressBarSettings.completionText}
                  onChange={(value) => updateProgressBarSetting('completionText', value)}
                  placeholder="e.g., Free shipping unlocked!"
                  helpText="Message shown when all milestones are achieved."
                  autoComplete="off"
                />
              </BlockStack>
            </Card>

            {/* Milestones / Tiers Card */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={ProductIcon} tone="base" />
                    <Text variant="headingMd" as="h2">Reward Milestones</Text>
                  </InlineStack>
                  <Button variant="secondary" icon={PlusIcon} onClick={addTier}>Add Milestone</Button>
                </InlineStack>

                <div style={{ border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', backgroundColor: '#f6f6f7', borderBottom: '1px solid #e1e3e5' }}>
                    {progressBarSettings.tiers.map((tier, idx) => (
                      <div
                        key={tier.id || idx}
                        onClick={() => setActiveTierIndex(idx)}
                        style={{
                          padding: '12px 24px',
                          cursor: 'pointer',
                          backgroundColor: activeTierIndex === idx ? '#fff' : 'transparent',
                          borderRight: '1px solid #e1e3e5',
                          borderBottom: activeTierIndex === idx ? '2px solid #008060' : 'none',
                          fontWeight: activeTierIndex === idx ? 'bold' : 'normal',
                          color: activeTierIndex === idx ? '#008060' : '#6d7175',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        Milestone {idx + 1}
                        {progressBarSettings.tiers.length > 1 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTier(idx);
                            }}
                            style={{ opacity: 0.6, cursor: 'pointer' }}
                          >
                            <Icon source={DeleteIcon} tone="critical" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '20px' }}>
                    {progressBarSettings.tiers[activeTierIndex] && (
                      <BlockStack gap="400">
                        <InlineStack gap="400">
                          <div style={{ flex: 1 }}>
                            <TextField
                              label={progressMode === 'amount' ? 'Target Amount (₹)' : 'Target Quantity'}
                              type="number"
                              value={String(progressBarSettings.tiers[activeTierIndex].minValue)}
                              onChange={(value) => updateTierSetting(activeTierIndex, 'minValue', parseInt(value) || 0)}
                              autoComplete="off"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <Select
                              label="Reward Type"
                              options={[
                                { label: 'Free Product', value: 'product' },
                                { label: 'Free Shipping', value: 'free_shipping' },
                                { label: 'Discount', value: 'discount' },
                              ]}
                              value={progressBarSettings.tiers[activeTierIndex].rewardType}
                              onChange={(value) => updateTierSetting(activeTierIndex, 'rewardType', value)}
                            />
                          </div>
                        </InlineStack>

                        <TextField
                          label="Reward Description"
                          value={progressBarSettings.tiers[activeTierIndex].description}
                          onChange={(value) => updateTierSetting(activeTierIndex, 'description', value)}
                          placeholder="e.g., You've unlocked a Free Gift!"
                          autoComplete="off"
                        />

                        <TextField
                          label="Message Before Achieving"
                          value={progressBarSettings.tiers[activeTierIndex].titleBeforeAchieving}
                          onChange={(value) => updateTierSetting(activeTierIndex, 'titleBeforeAchieving', value)}
                          helpText="Use {COUNT} as a placeholder for the remaining amount/quantity."
                          autoComplete="off"
                        />

                        {progressBarSettings.tiers[activeTierIndex].rewardType === 'product' && (
                          <BlockStack gap="200">
                            <Text as="p" fontWeight="semibold">Selected Rewards</Text>
                            <InlineStack gap="200">
                              {progressBarSettings.tiers[activeTierIndex].products?.map(productId => {
                                const product = productsList.find(p => p.id === productId);
                                return (
                                  <Badge key={productId} tone="info">
                                    {product ? product.title : productId}
                                  </Badge>
                                );
                              })}
                              {(!progressBarSettings.tiers[activeTierIndex].products || progressBarSettings.tiers[activeTierIndex].products.length === 0) && (
                                <Text tone="subdued" variant="bodySm">No products selected.</Text>
                              )}
                            </InlineStack>
                            <Button onClick={() => handleOpenProductPicker(activeTierIndex)}>Choose Products</Button>
                          </BlockStack>
                        )}
                      </BlockStack>
                    )}
                  </div>
                </div>
              </BlockStack>
            </Card>
          </>
        )}
      </BlockStack>
    </div>
  );
}

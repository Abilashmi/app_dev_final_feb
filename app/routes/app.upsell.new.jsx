/**
 * Upsell Products Configuration Page - Redesigned
 * Three-rule card-based layout with Product Pickers
 */

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
  TextField,
  Toast,
  Badge,
  Checkbox,
  Banner,
  Divider,
} from '@shopify/polaris';
import {
  getUpsellConfig,
  saveUpsellConfig,
  SAMPLE_UPSELL_PRODUCTS,
  trackUpsellEvent,
} from '../services/api.cart-settings.shared';

/**
 * Rule Card Component - Reusable for all three rules
 */
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

/**
 * Product Picker Component
 */
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

/**
 * Selected Products Display
 */
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

/**
 * Main Upsell Configuration Page
 */
export default function UpsellPage() {
  const [config, setConfig] = useState(null);
  const [initialConfig, setInitialConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const data = await getUpsellConfig();

      const loadedConfig = {
        rule1: {
          enabled: true,
          upsellProducts: data.config.upsellProducts || ['sp-1', 'sp-2'],
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
      };

      console.log('✅ Config loaded:', loadedConfig);
      setConfig(loadedConfig);
      setInitialConfig(loadedConfig);
    } catch (error) {
      setToastError(true);
      setToastMessage('Failed to load configuration');
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  }

  const isDirty =
    JSON.stringify(config) !== JSON.stringify(initialConfig);

  const getValidationError = () => {
    if (!config) return '';

    const enabledRules = [
      config.rule1?.enabled,
      config.rule2?.enabled,
      config.rule3?.enabled,
    ].filter(Boolean).length;

    if (enabledRules === 0) {
      return 'Please enable at least one rule';
    }

    if (config.rule1?.enabled && (!config.rule1?.upsellProducts || config.rule1.upsellProducts.length === 0)) {
      return 'Rule #1: Select at least one upsell product';
    }

    if (config.rule2?.enabled) {
      if (!config.rule2?.triggerProducts || config.rule2.triggerProducts.length === 0) {
        return 'Rule #2: Select at least one trigger product';
      }
      if (!config.rule2?.upsellProducts || config.rule2.upsellProducts.length === 0) {
        return 'Rule #2: Select at least one upsell product';
      }
    }

    if (config.rule3?.enabled) {
      if (!config.rule3?.cartValueThreshold || config.rule3.cartValueThreshold <= 0) {
        return 'Rule #3: Set a valid cart value threshold';
      }
      if (!config.rule3?.upsellProducts || config.rule3.upsellProducts.length === 0) {
        return 'Rule #3: Select at least one upsell product';
      }
    }

    return '';
  };

  const validationError = getValidationError();

  async function handleSave() {
    try {
      if (!isDirty) {
        setToastError(false);
        setToastMessage('No changes to save');
        return;
      }

      if (validationError) {
        setToastError(true);
        setToastMessage(validationError);
        return;
      }

      setSaving(true);
      console.log('📤 Saving config:', config);

      await saveUpsellConfig(config);

      setToastError(false);
      setToastMessage('✅ Upsell configuration saved successfully!');
      setInitialConfig(config);

      try {
        trackUpsellEvent('upsell_config_saved', {
          rule1Enabled: config.rule1?.enabled,
          rule2Enabled: config.rule2?.enabled,
          rule3Enabled: config.rule3?.enabled,
        });
      } catch (trackingError) {
        console.warn('Analytics tracking failed:', trackingError);
      }
    } catch (error) {
      setToastError(true);
      setToastMessage(error.message || 'Failed to save configuration');
      console.error('❌ Error saving config:', error);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setConfig(initialConfig);
    setToastError(false);
    setToastMessage('Changes discarded');
  }

  if (loading) {
    return (
      <Page title="Upsell Rules">
        <Card>
          <BlockStack gap="300">
            <Text tone="subdued">Loading configuration...</Text>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  if (!config) {
    return (
      <Page title="Upsell Rules">
        <Card>
          <BlockStack gap="300">
            <Text tone="subdued">Failed to load configuration</Text>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Upsell Rules"
      backAction={{ content: 'Back', onAction: () => window.history.back() }}
    >
      <Layout>
        {/* Main Settings Section */}
        <Layout.Section variant="twoThirds">
          <BlockStack gap="400">
            {/* Validation Error Banner */}
            {validationError && (
              <Banner tone="critical">
                <Text fontWeight="semibold">{validationError}</Text>
              </Banner>
            )}

            {/* Rule #1: All Products */}
            <RuleCard
              title="Rule #1: All Products"
              description="Show upsells for any product in cart"
              ruleKey="rule1"
              config={config}
              onConfigChange={setConfig}
            >
              <BlockStack gap="300">
                <ProductPicker
                  label="Upsell Products"
                  selected={config.rule1?.upsellProducts || []}
                  onChange={(selected) =>
                    setConfig({
                      ...config,
                      rule1: { ...config.rule1, upsellProducts: selected },
                    })
                  }
                />
                <SelectedProductsDisplay
                  productIds={config.rule1?.upsellProducts || []}
                  label="Selected Upsells"
                />
              </BlockStack>
            </RuleCard>

            {/* Rule #2: Triggered Products */}
            <RuleCard
              title="Rule #2: Triggered Products"
              description="Show upsells when specific products in cart"
              ruleKey="rule2"
              config={config}
              onConfigChange={setConfig}
            >
              <BlockStack gap="300">
                <ProductPicker
                  label="Trigger Products"
                  selected={config.rule2?.triggerProducts || []}
                  onChange={(selected) =>
                    setConfig({
                      ...config,
                      rule2: { ...config.rule2, triggerProducts: selected },
                    })
                  }
                />

                <Divider />

                <ProductPicker
                  label="Upsell Products"
                  selected={config.rule2?.upsellProducts || []}
                  onChange={(selected) =>
                    setConfig({
                      ...config,
                      rule2: { ...config.rule2, upsellProducts: selected },
                    })
                  }
                />

                <SelectedProductsDisplay
                  productIds={config.rule2?.upsellProducts || []}
                  label="Selected Upsells"
                />
              </BlockStack>
            </RuleCard>

            {/* Rule #3: Cart Conditions */}
            <RuleCard
              title="Rule #3: Cart Conditions"
              description="Show upsells based on cart value"
              ruleKey="rule3"
              config={config}
              onConfigChange={setConfig}
            >
              <BlockStack gap="300">
                <BlockStack gap="100">
                  <Text as="p" fontWeight="semibold">
                    Cart Value Condition
                  </Text>
                  <InlineStack gap="200" align="center">
                    <Text>Cart value {'>'}</Text>
                    <TextField
                      type="number"
                      label="Threshold"
                      labelHidden
                      value={config.rule3?.cartValueThreshold?.toString() || ''}
                      onChange={(value) =>
                        setConfig({
                          ...config,
                          rule3: {
                            ...config.rule3,
                            cartValueThreshold: parseInt(value) || 0,
                          },
                        })
                      }
                      placeholder="1000"
                      prefix="₹"
                    />
                  </InlineStack>
                </BlockStack>

                <Divider />

                <ProductPicker
                  label="Upsell Products"
                  selected={config.rule3?.upsellProducts || []}
                  onChange={(selected) =>
                    setConfig({
                      ...config,
                      rule3: { ...config.rule3, upsellProducts: selected },
                    })
                  }
                />

                <SelectedProductsDisplay
                  productIds={config.rule3?.upsellProducts || []}
                  label="Selected Upsells"
                />
              </BlockStack>
            </RuleCard>

            {/* Action Buttons */}
            <Card>
              <ButtonGroup>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={saving}
                  disabled={!isDirty || !!validationError}
                  fullWidth
                >
                  Save Settings
                </Button>
                <Button onClick={handleCancel} fullWidth>
                  Cancel
                </Button>
              </ButtonGroup>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* Summary Section */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Configuration Summary
              </Text>

              <BlockStack gap="200">
                <div>
                  <Text fontWeight="semibold">Rule #1</Text>
                  <Badge tone={config.rule1?.enabled ? 'success' : 'subdued'}>
                    {config.rule1?.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {config.rule1?.enabled && (
                    <Text tone="subdued" variant="bodySm">
                      {config.rule1?.upsellProducts?.length || 0} products
                    </Text>
                  )}
                </div>

                <div>
                  <Text fontWeight="semibold">Rule #2</Text>
                  <Badge tone={config.rule2?.enabled ? 'success' : 'subdued'}>
                    {config.rule2?.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {config.rule2?.enabled && (
                    <Text tone="subdued" variant="bodySm">
                      {config.rule2?.triggerProducts?.length || 0} triggers →{' '}
                      {config.rule2?.upsellProducts?.length || 0} upsells
                    </Text>
                  )}
                </div>

                <div>
                  <Text fontWeight="semibold">Rule #3</Text>
                  <Badge tone={config.rule3?.enabled ? 'success' : 'subdued'}>
                    {config.rule3?.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {config.rule3?.enabled && (
                    <Text tone="subdued" variant="bodySm">
                      ₹{config.rule3?.cartValueThreshold} →{' '}
                      {config.rule3?.upsellProducts?.length || 0} upsells
                    </Text>
                  )}
                </div>
              </BlockStack>

              <Divider />

              <BlockStack gap="100">
                <Text fontWeight="semibold">Status</Text>
                {isDirty && (
                  <Banner tone="warning">
                    <Text variant="bodySm">Unsaved changes</Text>
                  </Banner>
                )}
                {!isDirty && (
                  <Text tone="success" variant="bodySm">
                    ✓ All changes saved
                  </Text>
                )}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          content={toastMessage}
          onDismiss={() => setToastMessage('')}
          error={toastError}
        />
      )}
    </Page>
  );
}

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
  mockCollections,
  UPSELL_STYLES,
  UPSELL_STYLE_METADATA,
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
  items = SAMPLE_UPSELL_PRODUCTS,
  isCollection = false
}) {
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '12px',
              border: selected.includes(item.id)
                ? '2px solid #0070f3'
                : '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: selected.includes(item.id)
                ? '#f0f7ff'
                : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
            onClick={() => {
              if (selected.includes(item.id)) {
                onChange(selected.filter((id) => id !== item.id));
              } else {
                if (maxSelect === null || selected.length < maxSelect) {
                  onChange([...selected, item.id]);
                }
              }
            }}
          >
            <InlineStack gap="200" align="center" wrap={false}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {isCollection ? (
                  <Text variant="bodySm">📁</Text>
                ) : item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Text tone="subdued" variant="bodySm">
                    No Image
                  </Text>
                )}
              </div>
              <BlockStack gap="050" style={{ flex: 1, minWidth: 0 }}>
                <Text fontWeight="semibold" variant="bodySm" breakWord truncate>
                  {item.title}
                </Text>
                {!isCollection && (
                  <Text tone="subdued" variant="bodySm">
                    ₹{item.price}
                  </Text>
                )}
                {isCollection && (
                  <Text tone="subdued" variant="bodySm">
                    {item.productCount} products
                  </Text>
                )}
              </BlockStack>
              {selected.includes(item.id) && (
                <Text as="span" tone="success">
                  ✓
                </Text>
              )}
            </InlineStack>
          </div>
        ))}
      </div>
    </BlockStack>
  );
}

/**
 * Template Selection Component
 */
function TemplateSelector({ activeTemplate, onTemplateSelect }) {
  const templates = [
    { id: UPSELL_STYLES.GRID, name: 'Classic Grid', icon: '⊞' },
    { id: UPSELL_STYLES.CAROUSEL, name: 'Horizontal Carousel', icon: '↔' },
    { id: UPSELL_STYLES.LIST, name: 'Vertical List', icon: '≡' },
  ];

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h3" variant="headingMd">Choose Layout Template</Text>
        <InlineStack gap="300">
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => onTemplateSelect(t.id)}
              style={{
                flex: 1,
                padding: '16px',
                border: activeTemplate === t.id ? '2px solid #0070f3' : '1px solid #e5e7eb',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: activeTemplate === t.id ? '#f0f7ff' : '#ffffff',
                transition: 'all 0.2s ease',
              }}
            >
              <Text variant="headingLg" as="p" style={{ marginBottom: '8px', fontSize: '24px' }}>
                {t.icon}
              </Text>
              <Text fontWeight={activeTemplate === t.id ? 'bold' : 'regular'}>
                {t.name}
              </Text>
              <Badge tone={activeTemplate === t.id ? 'success' : 'subdued'}>
                {activeTemplate === t.id ? 'Selected' : 'Select'}
              </Badge>
            </div>
          ))}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

/**
 * Selected Resource Display
 */
function SelectedResourceDisplay({ ids, label, items, isCollection = false }) {
  const selectedItems = ids
    .map((id) => items.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <BlockStack gap="100">
      <Text as="p" variant="bodySm" tone="subdued">
        {label}: {selectedItems.map(i => i.title).join(', ')}
      </Text>
    </BlockStack>
  );
}


/**
 * Main Upsell Configuration Page
 */
export default function UpsellPage() {
  const [config, setConfig] = useState(null);
  const [initialConfig, setInitialConfig] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [allCollections, setAllCollections] = useState([]);
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
      const response = await getUpsellConfig();
      const configData = response.config || {};

      // Update store products and collections
      setAllProducts(response.allProducts || []);
      setAllCollections(response.allCollections || []);

      const loadedConfig = {
        activeTemplate: configData.activeTemplate || UPSELL_STYLES.GRID,
        rule1: {
          enabled: configData.rule1?.enabled ?? true,
          upsellProducts: configData.rule1?.upsellProducts || [],
          upsellCollections: configData.rule1?.upsellCollections || [],
        },
        rule2: {
          enabled: configData.rule2?.enabled ?? false,
          triggerProducts: configData.rule2?.triggerProducts || [],
          triggerCollections: configData.rule2?.triggerCollections || [],
          upsellProducts: configData.rule2?.upsellProducts || [],
          upsellCollections: configData.rule2?.upsellCollections || [],
        },
        rule3: {
          enabled: configData.rule3?.enabled ?? false,
          cartValueThreshold: configData.rule3?.cartValueThreshold ?? 1000,
          upsellProducts: configData.rule3?.upsellProducts || [],
          upsellCollections: configData.rule3?.upsellCollections || [],
        },
      };

      console.log('✅ Config loaded:', loadedConfig);
      setConfig(loadedConfig);
      setInitialConfig(loadedConfig);
    } catch (err) {
      console.error('Config load error:', err);
      setToastError(true);
      setToastMessage('Failed to load configuration');
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

    if (config.rule1?.enabled &&
      (!config.rule1?.upsellProducts || config.rule1.upsellProducts.length === 0) &&
      (!config.rule1?.upsellCollections || config.rule1.upsellCollections.length === 0)) {
      return 'Rule #1: Select at least one upsell product or collection';
    }

    if (config.rule2?.enabled) {
      if ((!config.rule2?.triggerProducts || config.rule2.triggerProducts.length === 0) &&
        (!config.rule2?.triggerCollections || config.rule2.triggerCollections.length === 0)) {
        return 'Rule #2: Select at least one trigger product or collection';
      }
      if ((!config.rule2?.upsellProducts || config.rule2.upsellProducts.length === 0) &&
        (!config.rule2?.upsellCollections || config.rule2.upsellCollections.length === 0)) {
        return 'Rule #2: Select at least one upsell product or collection';
      }
    }

    if (config.rule3?.enabled) {
      if (!config.rule3?.cartValueThreshold || config.rule3.cartValueThreshold <= 0) {
        return 'Rule #3: Set a valid cart value threshold';
      }
      if ((!config.rule3?.upsellProducts || config.rule3.upsellProducts.length === 0) &&
        (!config.rule3?.upsellCollections || config.rule3.upsellCollections.length === 0)) {
        return 'Rule #3: Select at least one upsell product or collection';
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
          activeTemplate: config.activeTemplate,
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
        {/* Template Selection Section */}
        <Layout.Section>
          <TemplateSelector
            activeTemplate={config.activeTemplate}
            onTemplateSelect={(id) => setConfig({ ...config, activeTemplate: id })}
          />
        </Layout.Section>

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
              <BlockStack gap="400">
                <ProductPicker
                  label="Upsell Products"
                  selected={config.rule1?.upsellProducts || []}
                  items={allProducts}
                  onChange={(selected) =>
                    setConfig({
                      ...config,
                      rule1: { ...config.rule1, upsellProducts: selected },
                    })
                  }
                />
                <ProductPicker
                  label="Upsell Collections"
                  selected={config.rule1?.upsellCollections || []}
                  items={allCollections}
                  isCollection={true}
                  onChange={(selected) =>
                    setConfig({
                      ...config,
                      rule1: { ...config.rule1, upsellCollections: selected },
                    })
                  }
                />
              </BlockStack>
            </RuleCard>

            {/* Rule #2: Triggered Products */}
            <RuleCard
              title="Rule #2: Triggered Products"
              description="Show upsells when specific products or collections in cart"
              ruleKey="rule2"
              config={config}
              onConfigChange={setConfig}
            >
              <BlockStack gap="400">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Triggers</Text>
                  <ProductPicker
                    label="Trigger Products"
                    selected={config.rule2?.triggerProducts || []}
                    items={allProducts}
                    onChange={(selected) =>
                      setConfig({
                        ...config,
                        rule2: { ...config.rule2, triggerProducts: selected },
                      })
                    }
                  />
                  <ProductPicker
                    label="Trigger Collections"
                    selected={config.rule2?.triggerCollections || []}
                    items={allCollections}
                    isCollection={true}
                    onChange={(selected) =>
                      setConfig({
                        ...config,
                        rule2: { ...config.rule2, triggerCollections: selected },
                      })
                    }
                  />
                </BlockStack>

                <Divider />

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Upsells</Text>
                  <ProductPicker
                    label="Upsell Products"
                    selected={config.rule2?.upsellProducts || []}
                    items={allProducts}
                    onChange={(selected) =>
                      setConfig({
                        ...config,
                        rule2: { ...config.rule2, upsellProducts: selected },
                      })
                    }
                  />
                  <ProductPicker
                    label="Upsell Collections"
                    selected={config.rule2?.upsellCollections || []}
                    items={allCollections}
                    isCollection={true}
                    onChange={(selected) =>
                      setConfig({
                        ...config,
                        rule2: { ...config.rule2, upsellCollections: selected },
                      })
                    }
                  />
                </BlockStack>
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
              <BlockStack gap="400">
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

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Upsells</Text>
                  <ProductPicker
                    label="Upsell Products"
                    selected={config.rule3?.upsellProducts || []}
                    items={allProducts}
                    onChange={(selected) =>
                      setConfig({
                        ...config,
                        rule3: { ...config.rule3, upsellProducts: selected },
                      })
                    }
                  />
                  <ProductPicker
                    label="Upsell Collections"
                    selected={config.rule3?.upsellCollections || []}
                    items={allCollections}
                    isCollection={true}
                    onChange={(selected) =>
                      setConfig({
                        ...config,
                        rule3: { ...config.rule3, upsellCollections: selected },
                      })
                    }
                  />
                </BlockStack>
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
                  <Text fontWeight="semibold">Layout</Text>
                  <Badge tone="info">
                    {UPSELL_STYLE_METADATA[config.activeTemplate]?.name || config.activeTemplate}
                  </Badge>
                </div>

                <div>
                  <Text fontWeight="semibold">Rule #1</Text>
                  <Badge tone={config.rule1?.enabled ? 'success' : 'subdued'}>
                    {config.rule1?.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {config.rule1?.enabled && (
                    <Text tone="subdued" variant="bodySm">
                      {config.rule1?.upsellProducts?.length || 0} products, {config.rule1?.upsellCollections?.length || 0} collections
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
                      {config.rule2?.triggerProducts?.length + (config.rule2?.triggerCollections?.length || 0)} triggers →{' '}
                      {config.rule2?.upsellProducts?.length + (config.rule2?.upsellCollections?.length || 0)} upsells
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
                      {config.rule3?.upsellProducts?.length + (config.rule3?.upsellCollections?.length || 0)} upsells
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

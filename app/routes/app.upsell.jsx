/**
 * Upsell Products Configuration Page
 * Admin UI for managing upsell settings with live preview
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
  Select,
  Toast,
  Badge,
  Divider,
  Checkbox,
  Grid,
} from '@shopify/polaris';
import {
  getUpsellConfig,
  saveUpsellConfig,
  SAMPLE_UPSELL_PRODUCTS,
  trackUpsellEvent,
} from '../services/api.upsell';

/**
 * Upsell Product Card Component - Used in both settings and preview
 */
function UpsellProductCard({ product, selected = false, onSelect = null }) {
  return (
    <div
      style={{
        border: selected ? '2px solid #0070f3' : '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        cursor: onSelect ? 'pointer' : 'default',
        backgroundColor: selected ? '#f0f7ff' : '#ffffff',
        transition: 'all 0.2s ease',
        marginBottom: '8px',
      }}
      onClick={onSelect}
      role={onSelect ? 'button' : 'presentation'}
      tabIndex={onSelect ? 0 : -1}
      onKeyDown={
        onSelect
          ? (e) => e.key === 'Enter' && onSelect()
          : undefined
      }
    >
      <InlineStack gap="300" align="center">
        <div
          style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
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
            <Text as="span" tone="subdued">
              No Image
            </Text>
          )}
        </div>
        <BlockStack gap="100">
          <Text as="p" fontWeight="semibold" truncate>
            {product.title}
          </Text>
          <InlineStack gap="200" align="center">
            <Text as="p" tone="subdued" variant="bodySmall">
              ₹{product.price}
            </Text>
            {product.status !== 'active' && (
              <Badge tone="warning">{product.status}</Badge>
            )}
          </InlineStack>
        </BlockStack>
      </InlineStack>
    </div>
  );
}

/**
 * Live Preview Component for Cart Drawer Upsell UI
 */
function UpsellPreview({ config, selectedProducts }) {
  if (!config.enabled) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Live Preview
          </Text>
          <div
            style={{
              padding: '40px 20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              textAlign: 'center',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text tone="subdued">Upsell is disabled</Text>
          </div>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Live Preview
        </Text>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            minHeight: '400px',
          }}
        >
          {/* Cart Drawer Container */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fafafa',
              borderRadius: '8px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI"',
            }}
          >
            {/* Upsell Section */}
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">
                {config.ui.title}
              </Text>
              <Text as="p" tone="subdued" variant="bodySmall">
                Complete your order
              </Text>

              {/* Slider Layout Preview */}
              {config.ui.layout === 'slider' && (
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    marginTop: '12px',
                  }}
                >
                  {selectedProducts.slice(0, config.limit).map((product) => (
                    <div
                      key={product.id}
                      style={{
                        minWidth: '140px',
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          marginBottom: '8px',
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
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Text tone="subdued">Image</Text>
                        )}
                      </div>
                      <Text
                        as="p"
                        fontWeight="semibold"
                        variant="bodySm"
                        truncate
                      >
                        {product.title}
                      </Text>
                      {config.ui.showPrice && (
                        <Text as="p" tone="subdued" variant="bodySm">
                          ₹{product.price}
                        </Text>
                      )}
                      <Button
                        fullWidth
                        size="slim"
                        variant="primary"
                        onClick={() =>
                          trackUpsellEvent('upsell_clicked', {
                            productId: product.id,
                            layout: config.ui.layout,
                          })
                        }
                        style={{ marginTop: '8px' }}
                      >
                        {config.ui.buttonText}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Vertical List Layout Preview */}
              {config.ui.layout === 'vertical' && (
                <BlockStack gap="200" style={{ marginTop: '12px' }}>
                  {selectedProducts.slice(0, config.limit).map((product) => (
                    <div
                      key={product.id}
                      style={{
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                      }}
                    >
                      <InlineStack gap="200">
                        <div
                          style={{
                            width: '80px',
                            height: '80px',
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
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <Text tone="subdued">Image</Text>
                          )}
                        </div>
                        <BlockStack gap="100" style={{ flex: 1 }}>
                          <Text fontWeight="semibold">{product.title}</Text>
                          {config.ui.showPrice && (
                            <Text tone="subdued">₹{product.price}</Text>
                          )}
                          <Button
                            size="slim"
                            variant="primary"
                            onClick={() =>
                              trackUpsellEvent('upsell_clicked', {
                                productId: product.id,
                                layout: config.ui.layout,
                              })
                            }
                          >
                            {config.ui.buttonText}
                          </Button>
                        </BlockStack>
                      </InlineStack>
                    </div>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </div>
        </div>
      </BlockStack>
    </Card>
  );
}

/**
 * Main Upsell Configuration Page
 */
export default function UpsellPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const data = await getUpsellConfig();
      setConfig(data.config);
    } catch (error) {
      setToastError(true);
      setToastMessage('Failed to load upsell configuration');
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await saveUpsellConfig(config);
      setToastError(false);
      setToastMessage('Upsell configuration saved successfully!');
      trackUpsellEvent('upsell_config_saved', {
        enabled: config.enabled,
        productCount: config.products.length,
        layout: config.ui.layout,
      });
    } catch (error) {
      setToastError(true);
      setToastMessage(error.message || 'Failed to save configuration');
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    loadConfig();
    setToastError(false);
    setToastMessage('Changes discarded');
  }

  if (loading) {
    return (
      <Page title="Upsell Products">
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
      <Page title="Upsell Products">
        <Card>
          <BlockStack gap="300">
            <Text tone="subdued">Failed to load configuration</Text>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  const selectedProducts = config.products
    .map((id) => SAMPLE_UPSELL_PRODUCTS.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  return (
    <Page
      title="Upsell Products"
      backAction={{ content: 'Back', onAction: () => window.history.back() }}
    >
      <Layout>
        {/* Left Column: Settings */}
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            {/* Enable/Disable Toggle */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Enable Upsell
                </Text>
                <Checkbox
                  label="Show upsell products in cart drawer"
                  checked={config.enabled}
                  onChange={(value) =>
                    setConfig({ ...config, enabled: value })
                  }
                />
              </BlockStack>
            </Card>

            {config.enabled && (
              <>
                {/* Rule Type */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Rule Type
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySmall">
                      Currently supporting Manual upsell selection
                    </Text>
                    <Badge>{config.ruleType}</Badge>
                  </BlockStack>
                </Card>

                {/* Product Selection */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Select Products
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySmall">
                      Choose {config.limit} products for upsell (max 4)
                    </Text>
                    <BlockStack gap="200">
                      {SAMPLE_UPSELL_PRODUCTS.map((product) => (
                        <Checkbox
                          key={product.id}
                          label={
                            <InlineStack gap="200" align="center">
                              <span>{product.title}</span>
                              <Badge>₹{product.price}</Badge>
                            </InlineStack>
                          }
                          checked={config.products.includes(product.id)}
                          onChange={(checked) => {
                            if (checked) {
                              if (config.products.length < config.limit) {
                                setConfig({
                                  ...config,
                                  products: [...config.products, product.id],
                                });
                              }
                            } else {
                              setConfig({
                                ...config,
                                products: config.products.filter(
                                  (id) => id !== product.id
                                ),
                              });
                            }
                          }}
                        />
                      ))}
                    </BlockStack>
                  </BlockStack>
                </Card>

                {/* Limit Selection */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Product Limit
                    </Text>
                    <Select
                      label="Number of products to show"
                      options={[
                        { label: '1 Product', value: '1' },
                        { label: '2 Products', value: '2' },
                        { label: '3 Products', value: '3' },
                        { label: '4 Products', value: '4' },
                      ]}
                      value={config.limit.toString()}
                      onChange={(value) =>
                        setConfig({ ...config, limit: parseInt(value) })
                      }
                    />
                  </BlockStack>
                </Card>

                {/* Button Text */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Button Text
                    </Text>
                    <TextField
                      label="CTA Button Text"
                      value={config.ui.buttonText}
                      onChange={(value) =>
                        setConfig({
                          ...config,
                          ui: { ...config.ui, buttonText: value },
                        })
                      }
                      placeholder="e.g., Add to Cart"
                    />
                  </BlockStack>
                </Card>

                {/* Layout Selection */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Layout
                    </Text>
                    <Select
                      label="Display layout"
                      options={[
                        {
                          label: 'Horizontal Slider',
                          value: 'slider',
                        },
                        {
                          label: 'Vertical List',
                          value: 'vertical',
                        },
                      ]}
                      value={config.ui.layout}
                      onChange={(value) =>
                        setConfig({
                          ...config,
                          ui: { ...config.ui, layout: value },
                        })
                      }
                    />
                  </BlockStack>
                </Card>

                {/* Show Price Toggle */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Display Options
                    </Text>
                    <Checkbox
                      label="Show product price"
                      checked={config.ui.showPrice}
                      onChange={(value) =>
                        setConfig({
                          ...config,
                          ui: { ...config.ui, showPrice: value },
                        })
                      }
                    />
                  </BlockStack>
                </Card>
              </>
            )}

            {/* Action Buttons */}
            <Card>
              <ButtonGroup>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={saving}
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

        {/* Right Column: Live Preview */}
        <Layout.Section variant="twoThirds">
          <UpsellPreview config={config} selectedProducts={selectedProducts} />
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

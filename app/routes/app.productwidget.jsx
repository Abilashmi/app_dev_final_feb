import React, { useState } from 'react';
import {
  Page,
  Card,
  InlineStack,
  BlockStack,
  Text,
  Button,
  Badge,
  Layout,
  Divider,
  TextField,
  PageActions,
  Banner,
  Image
} from '@shopify/polaris';

export default function ProductWidgetConfig() {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('soft');
  const [activeTab, setActiveTab] = useState('coupon');
  const [enabledWidgets, setEnabledWidgets] = useState({
    coupon: false,
    fbt: false
  });
  const [couponSettings, setCouponSettings] = useState({
    title: 'Special Offer',
    description: 'Get your discount now',
    code: 'SAVE20',
    cta: 'Copy Code'
  });
  const [fbtSettings, setFbtSettings] = useState({
    title: 'Frequently Bought Together',
    description: 'Complete your purchase',
    offer: 'Bundle & Save'
  });

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setEnabledWidgets({
      coupon: false,
      fbt: false
    });
  };

  const handleStyleSelect = (style) => {
    if (isConnected) {
      setSelectedStyle(style);
    }
  };

  const handleWidgetToggle = (widget) => {
    setEnabledWidgets({
      ...enabledWidgets,
      [widget]: !enabledWidgets[widget]
    });
  };

  const handleCouponChange = (field, value) => {
    setCouponSettings({
      ...couponSettings,
      [field]: value
    });
  };

  const handleFbtChange = (field, value) => {
    setFbtSettings({
      ...fbtSettings,
      [field]: value
    });
  };

  const handleSave = () => {
    console.log({
      isConnected,
      selectedStyle,
      enabledWidgets,
      couponSettings,
      fbtSettings
    });
  };

  const styles = [
    { id: 'soft', label: 'Soft Card Coupon' },
    { id: 'ticket', label: 'Ticket / Voucher' },
    { id: 'conditional', label: 'Conditional Offer' }
  ];

  const renderCouponPreview = () => {
    if (!enabledWidgets.coupon) return null;

    switch (selectedStyle) {
      case 'soft':
        return (
          <Card>
            <BlockStack gap="400">
              <Text variant="headingSm" as="h3">{couponSettings.title}</Text>
              <Text variant="bodySm" as="p">{couponSettings.description}</Text>
              <Badge tone="info">{couponSettings.code}</Badge>
              <Button>{couponSettings.cta}</Button>
            </BlockStack>
          </Card>
        );
      case 'ticket':
        return (
          <Card>
            <InlineStack align="space-between">
              <BlockStack gap="200">
                <Text variant="headingSm" as="h3">{couponSettings.title}</Text>
                <Text variant="bodySm" as="p">{couponSettings.description}</Text>
              </BlockStack>
              <Badge tone="info">{couponSettings.code}</Badge>
            </InlineStack>
          </Card>
        );
      case 'conditional':
        return (
          <Card>
            <BlockStack gap="400">
              <Text variant="headingSm" as="h3">{couponSettings.title}</Text>
              <Text variant="bodySm" as="p">{couponSettings.description}</Text>
              <Text variant="bodySm" as="p">Limited time offer</Text>
              <Badge tone="info">{couponSettings.code}</Badge>
              <Button>{couponSettings.cta}</Button>
            </BlockStack>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderFbtPreview = () => {
    if (!enabledWidgets.fbt) return null;

    return (
      <Card>
        <BlockStack gap="400">
          <Text variant="headingSm" as="h3">{fbtSettings.title}</Text>
          <Text variant="bodySm" as="p">{fbtSettings.description}</Text>
          <Badge tone="attention">{fbtSettings.offer}</Badge>
          <Button>Add to Cart</Button>
        </BlockStack>
      </Card>
    );
  };

  const renderPreview = () => {
    if (!isConnected) {
      return (
        <Text variant="bodyMd" as="p" tone="subdued">
          Connect your store to enable preview
        </Text>
      );
    }

    if (activeTab === 'coupon') {
      return enabledWidgets.coupon ? renderCouponPreview() : (
        <Text variant="bodyMd" as="p" tone="subdued">
          Widget disabled
        </Text>
      );
    } else {
      return enabledWidgets.fbt ? renderFbtPreview() : (
        <Text variant="bodyMd" as="p" tone="subdued">
          Widget disabled
        </Text>
      );
    }
  };

  return (
    <Page title="Product Widget">
      <BlockStack gap="500">
        <Card>
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="200">
              <Text variant="headingMd" as="h2">Shopify Store</Text>
              <Text variant="bodyMd" as="p">
                {isConnected ? 'Connected' : 'Not connected'}
              </Text>
            </BlockStack>
            {!isConnected ? (
              <Button variant="primary" onClick={handleConnect}>
                Connect
              </Button>
            ) : (
              <Button tone="critical" onClick={handleDisconnect}>
                Disconnect
              </Button>
            )}
          </InlineStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">Select your style</Text>
            <InlineStack align="center" gap="400">
              {styles.map((style) => (
                <Card 
                  key={style.id} 
                  background={selectedStyle === style.id ? 'bg-surface-success' : undefined}
                >
                  <BlockStack gap="200">
                    <Button
                      variant="plain"
                      onClick={() => handleStyleSelect(style.id)}
                      textAlign="center"
                      disabled={!isConnected}
                    >
                      <BlockStack gap="200">
                        <Text variant="bodyMd" as="p">{style.label}</Text>
                        {selectedStyle === style.id && (
                          <Badge tone="success">Selected</Badge>
                        )}
                      </BlockStack>
                    </Button>
                  </BlockStack>
                </Card>
              ))}
            </InlineStack>
          </BlockStack>
        </Card>

        <Layout>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Preview</Text>
                {renderPreview()}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Customize</Text>
                <Divider />
                
                <InlineStack gap="200">
                  <Button
                    pressed={activeTab === 'coupon'}
                    onClick={() => setActiveTab('coupon')}
                    disabled={!isConnected}
                  >
                    Coupon
                  </Button>
                  <Button
                    pressed={activeTab === 'fbt'}
                    onClick={() => setActiveTab('fbt')}
                    disabled={!isConnected}
                  >
                    Frequently Bought Together
                  </Button>
                </InlineStack>

                {activeTab === 'coupon' && (
                  <BlockStack gap="400">
                    <BlockStack gap="300">
                      <Text variant="headingSm" as="h3">Coupon</Text>
                      <Button
                        variant={enabledWidgets.coupon ? 'primary' : 'secondary'}
                        onClick={() => handleWidgetToggle('coupon')}
                        disabled={!isConnected}
                      >
                        {enabledWidgets.coupon ? 'Disable' : 'Enable'}
                      </Button>
                    </BlockStack>

                    {enabledWidgets.coupon && (
                      <BlockStack gap="400">
                        <TextField
                          label="Title"
                          value={couponSettings.title}
                          onChange={(value) => handleCouponChange('title', value)}
                          autoComplete="off"
                        />
                        <TextField
                          label="Description"
                          value={couponSettings.description}
                          onChange={(value) => handleCouponChange('description', value)}
                          autoComplete="off"
                        />
                        <TextField
                          label="Coupon Code"
                          value={couponSettings.code}
                          onChange={(value) => handleCouponChange('code', value)}
                          autoComplete="off"
                        />
                        <TextField
                          label="CTA Text"
                          value={couponSettings.cta}
                          onChange={(value) => handleCouponChange('cta', value)}
                          autoComplete="off"
                        />
                      </BlockStack>
                    )}
                  </BlockStack>
                )}

                {activeTab === 'fbt' && (
                  <BlockStack gap="400">
                    <BlockStack gap="300">
                      <Text variant="headingSm" as="h3">Frequently Bought Together</Text>
                      <Button
                        variant={enabledWidgets.fbt ? 'primary' : 'secondary'}
                        onClick={() => handleWidgetToggle('fbt')}
                        disabled={!isConnected}
                      >
                        {enabledWidgets.fbt ? 'Disable' : 'Enable'}
                      </Button>
                    </BlockStack>

                    {enabledWidgets.fbt && (
                      <BlockStack gap="400">
                        <TextField
                          label="Title"
                          value={fbtSettings.title}
                          onChange={(value) => handleFbtChange('title', value)}
                          autoComplete="off"
                        />
                        <TextField
                          label="Description"
                          value={fbtSettings.description}
                          onChange={(value) => handleFbtChange('description', value)}
                          autoComplete="off"
                        />
                        <TextField
                          label="Offer Text"
                          value={fbtSettings.offer}
                          onChange={(value) => handleFbtChange('offer', value)}
                          autoComplete="off"
                        />
                      </BlockStack>
                    )}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <PageActions
        primaryAction={{
          content: 'Save',
          onAction: handleSave
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => console.log('Cancelled')
          }
        ]}
      />
    </Page>
  );
}
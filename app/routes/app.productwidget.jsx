
import React, { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Checkbox,
  TextField,
  Select,
  Button,
} from '@shopify/polaris';

  const ProductWidget = () => {
    // Only one state variable to control which editor is visible
    const [activeTab, setActiveTab] = useState('coupon');
    // Local state for editors
    const [couponEnabled, setCouponEnabled] = useState(false);
    const [couponTitle, setCouponTitle] = useState('');
    const [couponPosition, setCouponPosition] = useState('belowPrice');
    const [fbtEnabled, setFbtEnabled] = useState(false);
    const [fbtTitle, setFbtTitle] = useState('');
    const [fbtMaxProducts, setFbtMaxProducts] = useState('2');

    // Tab button styles
    const tabButtonStyle = (tab) => ({
      background: activeTab === tab ? 'var(--p-color-bg-surface-secondary)' : undefined,
      fontWeight: activeTab === tab ? 'bold' : undefined,
    });

    // Coupon Slider Editor with more fields
    const CouponSliderEditor = (
      <BlockStack gap="400">
        <Checkbox
          label="Enable Coupon Slider"
          checked={couponEnabled}
          onChange={setCouponEnabled}
        />
        <TextField
          label="Widget Title"
          value={couponTitle}
          onChange={setCouponTitle}
          autoComplete="off"
        />
        <Select
          label="Position"
          options={[
            { label: 'Below price', value: 'belowPrice' },
            { label: 'Below Add to Cart', value: 'belowAddToCart' },
          ]}
          value={couponPosition}
          onChange={setCouponPosition}
        />
        <TextField
          label="Discount Percentage"
          type="number"
          value={couponEnabled ? '' : ''}
          onChange={() => {}}
          autoComplete="off"
        />
        <TextField
          label="Coupon Code"
          value={couponEnabled ? '' : ''}
          onChange={() => {}}
          autoComplete="off"
        />
        <TextField
          label="Expiration Date"
          type="date"
          value={couponEnabled ? '' : ''}
          onChange={() => {}}
          autoComplete="off"
        />
        <InlineStack align="end" gap="200">
          <Button variant="secondary">Cancel</Button>
          <Button primary>Save</Button>
        </InlineStack>
      </BlockStack>
    );

    // FBT Editor
    const FbtEditor = (
      <BlockStack gap="400">
        <Checkbox
          label="Enable Frequently Bought Together"
          checked={fbtEnabled}
          onChange={setFbtEnabled}
        />
        <TextField
          label="Section Title"
          value={fbtTitle}
          onChange={setFbtTitle}
          autoComplete="off"
        />
        <Select
          label="Max Products"
          options={[
            { label: '2', value: '2' },
            { label: '3', value: '3' },
            { label: '4', value: '4' },
          ]}
          value={fbtMaxProducts}
          onChange={setFbtMaxProducts}
        />
        <InlineStack align="end" gap="200">
          <Button variant="secondary">Cancel</Button>
          <Button primary>Save</Button>
        </InlineStack>
      </BlockStack>
    );

    return (
      <Page title="Product Widget">
        <Layout>
          <Layout.Section oneThird>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Features</Text>
                <BlockStack gap="200">
                  <Button
                    style={tabButtonStyle('coupon')}
                    onClick={() => setActiveTab('coupon')}
                    variant={activeTab === 'coupon' ? 'primary' : 'secondary'}
                    fullWidth
                  >
                    Coupon Slider
                  </Button>
                  <Button
                    style={tabButtonStyle('fbt')}
                    onClick={() => setActiveTab('fbt')}
                    variant={activeTab === 'fbt' ? 'primary' : 'secondary'}
                    fullWidth
                  >
                    Frequently Bought Together
                  </Button>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              {activeTab === 'coupon' ? CouponSliderEditor : FbtEditor}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  };


export default ProductWidget;

import React, { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Select,
  TextField,
  Divider,
  EmptyState,
  Banner,
} from '@shopify/polaris';

const FEATURES = [
  'Coupon Slider',
  'Frequently Bought Together',
  'Cart Drawer',
  'Progress Bar Coupon Slider',
  'Upsell',
];

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Custom', value: 'custom' },
];

const OVERVIEW_METRICS = [
  { label: 'Total Revenue Generated', value: '$12,340', trend: '+8%' },
  { label: 'Total Orders Influenced', value: '1,234', trend: '+5%' },
  { label: 'Conversion Lift %', value: '18%', trend: '+2%' },
  { label: 'Total Coupons Applied', value: '432', trend: '+4%' },
  { label: 'Total Upsell Revenue', value: '$2,340', trend: '+12%' },
  { label: 'Active Widgets Count', value: '5', trend: '' },
];

const FEATURE_METRICS = {
  'Coupon Slider': { impressions: 12000, clicks: 3400, conversions: 800, revenue: 2340, rate: '6.7%', trend: '+3%' },
  'Frequently Bought Together': { impressions: 8000, clicks: 2100, conversions: 500, revenue: 1800, rate: '6.2%', trend: '+4%' },
  'Cart Drawer': { impressions: 9000, clicks: 2500, conversions: 600, revenue: 2000, rate: '6.6%', trend: '+2%' },
  'Progress Bar Coupon Slider': { impressions: 7000, clicks: 1800, conversions: 400, revenue: 1200, rate: '5.7%', trend: '+1%' },
  'Upsell': { impressions: 6000, clicks: 1600, conversions: 350, revenue: 900, rate: '5.8%', trend: '+5%' },
};

const COUPON_ANALYTICS = {
  created: 120,
  used: 80,
  revenuePerCoupon: '$29',
  mostPerforming: 'WELCOME10',
  usageOverTime: [12, 14, 18, 20, 16, 22, 24], // Dummy data
};

const INSIGHTS = [
  'FBT increased AOV by 18% in the last 7 days.',
  'Upsell performs best in cart drawer for mobile users.',
  'Progress bar coupons convert 2x better than normal coupons.',
];

const SETUP_STEPS = [
  { label: 'Create your first coupon', completed: true },
  { label: 'Enable Cart Drawer Upsell', completed: false },
  { label: 'Add Product Widget to Store', completed: false },
];

function AppAnalytics() {
  const [dateRange, setDateRange] = useState('7d');
  const [feature, setFeature] = useState('all');
  const [coupon, setCoupon] = useState('');
  const [product, setProduct] = useState('');

  // Empty state logic (simulate no data for first-time user)
  const isEmpty = false;

  return (
    <Page title="Shopify Analytics Dashboard">
      <Layout>
        {/* Filters */}
        <Layout.Section>
          <Card>
            <InlineStack gap="400" align="start">
              <Select label="Date Range" options={DATE_RANGES} value={dateRange} onChange={setDateRange} />
              <Select label="Feature Type" options={[{label:'All',value:'all'},...FEATURES.map(f=>({label:f,value:f}))]} value={feature} onChange={setFeature} />
              <TextField label="Coupon" value={coupon} onChange={setCoupon} autoComplete="off" />
              <TextField label="Product / Collection" value={product} onChange={setProduct} autoComplete="off" />
            </InlineStack>
          </Card>
        </Layout.Section>

        {/* Empty State */}
        {isEmpty ? (
          <Layout.Section>
            <EmptyState
              heading="Welcome to your Analytics Dashboard"
              action={{ content: 'Get Started', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/empty-state.svg"
            >
              <Text>Track your widgets, coupons, and upsells. Start by creating your first coupon or enabling a widget.</Text>
            </EmptyState>
          </Layout.Section>
        ) : (
          <>
            {/* Overview Metrics */}
            <Layout.Section>
              <InlineStack gap="400" align="start">
                {OVERVIEW_METRICS.map((m) => (
                  <Card key={m.label} sectioned>
                    <BlockStack gap="100" align="center">
                      <Text variant="headingLg">{m.value}</Text>
                      <Text variant="bodySm" color="subdued">{m.label}</Text>
                      {m.trend && <Text variant="bodySm" color={m.trend.startsWith('+') ? 'success' : 'critical'}>{m.trend}</Text>}
                    </BlockStack>
                  </Card>
                ))}
              </InlineStack>
            </Layout.Section>

            {/* Feature-wise Analytics */}
            <Layout.Section>
              <BlockStack gap="400">
                {FEATURES.map((f) => (
                  <Card key={f} sectioned>
                    <BlockStack gap="100">
                      <Text variant="headingSm">{f}</Text>
                      <InlineStack gap="200">
                        <BlockStack gap="50">
                          <Text variant="bodyMd">Impressions</Text>
                          <Text variant="bodyLg" fontWeight="bold">{FEATURE_METRICS[f].impressions}</Text>
                        </BlockStack>
                        <BlockStack gap="50">
                          <Text variant="bodyMd">Clicks</Text>
                          <Text variant="bodyLg" fontWeight="bold">{FEATURE_METRICS[f].clicks}</Text>
                        </BlockStack>
                        <BlockStack gap="50">
                          <Text variant="bodyMd">Conversions</Text>
                          <Text variant="bodyLg" fontWeight="bold">{FEATURE_METRICS[f].conversions}</Text>
                        </BlockStack>
                        <BlockStack gap="50">
                          <Text variant="bodyMd">Revenue</Text>
                          <Text variant="bodyLg" fontWeight="bold">${FEATURE_METRICS[f].revenue}</Text>
                        </BlockStack>
                        <BlockStack gap="50">
                          <Text variant="bodyMd">Conversion Rate</Text>
                          <Text variant="bodyLg" fontWeight="bold">{FEATURE_METRICS[f].rate}</Text>
                        </BlockStack>
                        <BlockStack gap="50">
                          <Text variant="bodyMd">Trend</Text>
                          <Text variant="bodyLg" color={FEATURE_METRICS[f].trend.startsWith('+') ? 'success' : 'critical'}>{FEATURE_METRICS[f].trend}</Text>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                ))}
              </BlockStack>
            </Layout.Section>

            {/* Coupon Analytics */}
            <Layout.Section>
              <Card sectioned>
                <BlockStack gap="200">
                  <Text variant="headingSm">Coupon Analytics</Text>
                  <InlineStack gap="200">
                    <BlockStack gap="50">
                      <Text variant="bodyMd">Coupons Created</Text>
                      <Text variant="bodyLg" fontWeight="bold">{COUPON_ANALYTICS.created}</Text>
                    </BlockStack>
                    <BlockStack gap="50">
                      <Text variant="bodyMd">Coupons Used</Text>
                      <Text variant="bodyLg" fontWeight="bold">{COUPON_ANALYTICS.used}</Text>
                    </BlockStack>
                    <BlockStack gap="50">
                      <Text variant="bodyMd">Revenue per Coupon</Text>
                      <Text variant="bodyLg" fontWeight="bold">{COUPON_ANALYTICS.revenuePerCoupon}</Text>
                    </BlockStack>
                    <BlockStack gap="50">
                      <Text variant="bodyMd">Most Performing Coupon</Text>
                      <Text variant="bodyLg" fontWeight="bold">{COUPON_ANALYTICS.mostPerforming}</Text>
                    </BlockStack>
                  </InlineStack>
                  {/* Placeholder for Coupon Usage Over Time Graph */}
                  <Divider />
                  <Text variant="bodyMd">Coupon Usage Over Time (Graph)</Text>
                  <Text variant="bodySm" color="subdued">[Line Chart Placeholder]</Text>
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Graphs & Growth Visualization */}
            <Layout.Section>
              <Card sectioned>
                <BlockStack gap="200">
                  <Text variant="headingSm">Growth Visualization</Text>
                  <Text variant="bodyMd">Revenue Growth Over Time</Text>
                  <Text variant="bodySm" color="subdued">[Line Chart Placeholder]</Text>
                  <Divider />
                  <Text variant="bodyMd">Feature-wise Revenue Comparison</Text>
                  <Text variant="bodySm" color="subdued">[Bar Chart Placeholder]</Text>
                  <Divider />
                  <Text variant="bodyMd">Funnel: Impressions → Clicks → Conversions</Text>
                  <Text variant="bodySm" color="subdued">[Funnel Chart Placeholder]</Text>
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Insights & Recommendations */}
            <Layout.Section>
              <Card sectioned>
                <BlockStack gap="200">
                  <Text variant="headingSm">Insights & Recommendations</Text>
                  {INSIGHTS.map((ins, idx) => (
                    <Banner key={idx} status="info" title={ins} />
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Setup Tutorial Section */}
            <Layout.Section>
              <Card sectioned>
                <BlockStack gap="200">
                  <Text variant="headingSm">Setup & Learn</Text>
                  <InlineStack gap="200">
                    {SETUP_STEPS.map((step, idx) => (
                      <BlockStack key={idx} gap="50" align="center">
                        <Button disabled={step.completed} primary={!step.completed}>{step.label}</Button>
                        <Text variant="bodySm" color={step.completed ? 'success' : 'subdued'}>{step.completed ? 'Completed' : 'Pending'}</Text>
                      </BlockStack>
                    ))}
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </>
        )}
      </Layout>
    </Page>
  );
}

export default AppAnalytics;

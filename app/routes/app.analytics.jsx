import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Select,
  Divider,
  Box,
  Icon,
  Badge,
  Tabs,
  IndexTable,
  Link,
  Banner,
  ProgressBar,
  Checkbox,
  List,
  MediaCard,
  Popover,
  ActionList,
  DatePicker,
} from '@shopify/polaris';
import {
  CalendarIcon,
  FilterIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ViewIcon,
  CheckCircleIcon,
  ExternalIcon,
  QuestionCircleIcon,
  ChevronRightIcon,
  EditIcon,
  SearchIcon,
} from '@shopify/polaris-icons';

// --- MOCK DATA FOR DYNAMIC FILTERING ---

const FEATURE_DATA = {
  all: {
    revenue: "₹19,933.00",
    orders: "18",
    aov: "₹1,107.38",
    conv: "2.3%",
    revenueTrend: "53%",
    ordersTrend: "50%",
    aovTrend: "5%",
    convTrend: "40%",
    // Points for the graph (Spline)
    graphPoints: [35, 10, 5, 15, 45, 40, 45, 55, 45, 30, 50, 40],
    comparePoints: [25, 15, 10, 18, 25, 38, 35, 32, 28, 35, 25, 30]
  },
  coupon_slider: {
    revenue: "₹4,200.00",
    orders: "8",
    aov: "₹525.00",
    conv: "1.2%",
    revenueTrend: "12%",
    ordersTrend: "5%",
    aovTrend: "2%",
    convTrend: "8%",
    graphPoints: [10, 20, 15, 25, 20, 30, 25, 35, 30, 40, 35, 45],
    comparePoints: [5, 10, 8, 15, 12, 18, 15, 22, 18, 25, 20, 28]
  },
  product_widget: {
    revenue: "₹8,450.00",
    orders: "6",
    aov: "₹1,408.33",
    conv: "0.8%",
    revenueTrend: "25%",
    ordersTrend: "10%",
    aovTrend: "15%",
    convTrend: "5%",
    graphPoints: [40, 35, 45, 30, 50, 45, 55, 40, 60, 50, 65, 55],
    comparePoints: [30, 25, 35, 20, 38, 32, 42, 30, 48, 35, 52, 40]
  },
  cart_drawer: {
    revenue: "₹12,300.00",
    orders: "12",
    aov: "₹1,025.00",
    conv: "1.8%",
    revenueTrend: "42%",
    ordersTrend: "30%",
    aovTrend: "10%",
    convTrend: "15%",
    graphPoints: [20, 30, 25, 40, 35, 50, 45, 60, 55, 70, 65, 80],
    comparePoints: [15, 22, 18, 30, 25, 38, 32, 45, 40, 55, 48, 62]
  }
};

const FEATURES_LIST = [
  { label: 'All Channels', value: 'all' },
  { label: 'Coupon Slider', value: 'coupon_slider' },
  { label: 'Product Widget', value: 'product_widget' },
  { label: 'Cart Drawer', value: 'cart_drawer' },
];

const DATE_RANGE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: '7d' },
];

const EVENTS_DATA = [
  { id: '1', name: 'Widget Viewed', feature: 'Product Widget', count: '12,450', status: 'Tracking' },
  { id: '2', name: 'Coupon Shown', feature: 'Coupon Slider', count: '8,200', status: 'Tracking' },
  { id: '3', name: 'Coupon Applied', feature: 'Coupon Slider', count: '1,240', status: 'Converting' },
  { id: '4', name: 'Coupon Removed', feature: 'Coupon Slider', count: '120', status: 'Converting' },
  { id: '5', name: 'Product Widget Clicked', feature: 'Product Widget', count: '3,100', status: 'Tracking' },
  { id: '6', name: 'Add to Cart via App', feature: 'All', count: '2,450', status: 'Converting' },
];

// --- COMPONENTS ---

// Function to generate SVG path for spline (Catmull-Rom logic simplified)
const getSplinePath = (data) => {
  if (data.length < 2) return "";
  const width = 500;
  const height = 100;
  const step = width / (data.length - 1);

  let path = `M 0 ${height - data[0]}`;

  for (let i = 0; i < data.length - 1; i++) {
    const x1 = i * step;
    const y1 = height - data[i];
    const x2 = (i + 1) * step;
    const y2 = height - data[i + 1];

    const cp1x = x1 + (x2 - x1) / 2;
    const cp1y = y1;
    const cp2x = x1 + (x2 - x1) / 2;
    const cp2y = y2;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  }
  return path;
};

const HighFidelityGraph = ({ color = "#008060", points, comparePoints, compareEnabled }) => {
  const mainPath = getSplinePath(points);
  const comparePath = getSplinePath(comparePoints);

  return (
    <div style={{ width: '100%', height: '140px', position: 'relative', marginTop: '16px' }}>
      <svg viewBox="0 0 500 110" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Horizontal Grid Lines */}
        {[0, 20, 40, 60, 80, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#f1f1f1" strokeWidth="1" />
        ))}

        {/* Comparison Line (Dashed) */}
        {compareEnabled && (
          <path
            d={comparePath}
            fill="none"
            stroke="#9ed4cc"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            style={{ transition: 'd 0.5s ease' }}
          />
        )}

        {/* Main Line (Solid Spline) */}
        <path
          d={mainPath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'd 0.5s ease' }}
        />
      </svg>

      {/* Legend & X-Axis */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f1f1' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {['12 am', '4 am', '8 am', '12 pm', '4 pm', '8 pm'].map(time => (
            <Text key={time} variant="bodyXs" tone="subdued">{time}</Text>
          ))}
        </div>
        <InlineStack gap="300">
          <InlineStack gap="100" blockAlign="center">
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            <Text variant="bodyXs" tone="subdued">Feb 8 2026</Text>
          </InlineStack>
          {compareEnabled && (
            <InlineStack gap="100" blockAlign="center">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ed4cc' }} />
              <Text variant="bodyXs" tone="subdued">Feb 7 2026</Text>
            </InlineStack>
          )}
        </InlineStack>
      </div>
    </div>
  );
};

const MetricToggle = ({ title, value, trend, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      cursor: 'pointer',
      padding: '12px 16px',
      borderRadius: '12px',
      background: active ? '#f4f4f4' : 'transparent',
      flex: 1,
      transition: 'all 0.2s ease',
      position: 'relative',
      minWidth: '160px'
    }}
  >
    <BlockStack gap="050">
      <InlineStack align="space-between" blockAlign="center">
        <Text variant="bodyMd" fontWeight="medium" tone="subdued">{title}</Text>
        {active && <Icon source={EditIcon} size="small" tone="subdued" />}
      </InlineStack>
      <InlineStack gap="100" blockAlign="baseline">
        <Text variant="headingLg" fontWeight="bold">{value}</Text>
        <InlineStack gap="050" blockAlign="center">
          <Text variant="bodySm" tone="success" fontWeight="medium">↗ {trend}</Text>
        </InlineStack>
      </InlineStack>
    </BlockStack>
  </div>
);

const TutorialStep = ({ number, title, content, completed, action }) => (
  <div style={{ padding: '16px 0', borderBottom: '1px solid #f1f1f1' }}>
    <BlockStack gap="200">
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="200" blockAlign="center">
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: completed ? '#e3f1df' : '#f1f1f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {completed ? <Icon source={CheckCircleIcon} tone="success" size="small" /> : <Text variant="bodySm" fontWeight="bold">{number}</Text>}
          </div>
          <Text variant="bodyMd" fontWeight="semibold" tone={completed ? 'subdued' : 'default'}>{title}</Text>
        </InlineStack>
        {completed ? <Badge tone="success">Completed</Badge> : (action && <Button size="slim" onClick={action.onAction}>{action.label}</Button>)}
      </InlineStack>
      {!completed && <Text variant="bodySm" tone="subdued">{content}</Text>}
    </BlockStack>
  </div>
);

export default function AppAnalytics() {
  const navigate = useNavigate();
  const guidesRef = useRef(null);
  const [dateRange, setDateRange] = useState('today');
  const [popoverActive, setPopoverActive] = useState(false);
  const [{ month, year }, setMonth] = useState({ month: 1, year: 2026 });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date('2026-02-08'),
    end: new Date('2026-02-08'),
  });

  const handleMonthChange = useCallback(
    (month, year) => setMonth({ month, year }),
    [],
  );

  const togglePopoverActive = useCallback(
    () => setPopoverActive((active) => !active),
    [],
  );
  const [selectedFeature, setSelectedFeature] = useState('all');
  const [activeHeroMetric, setActiveHeroMetric] = useState('revenue');
  const [selectedTab, setSelectedTab] = useState(0);

  const data = FEATURE_DATA[selectedFeature] || FEATURE_DATA.all;

  const setupSteps = [
    { id: 1, label: 'App Installed', completed: true, guideTab: 0 },
    { id: 2, label: 'App Embed Enabled', completed: true, guideTab: 0 },
    { id: 3, label: 'Product Widget Enabled', completed: false, guideTab: 1 },
    { id: 4, label: 'Coupon Created', completed: false, guideTab: 0 },
    { id: 5, label: 'Cart Drawer Enabled', completed: false, guideTab: 2 },
  ];

  const completedSteps = setupSteps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / setupSteps.length) * 100;

  const scrollToGuides = useCallback((tabIndex) => {
    setSelectedTab(tabIndex);
    if (guidesRef.current) {
      guidesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <Page
      title="Analytics"
      fullWidth
      compactTitle
    >
      <Layout>
        {/* 1. Header Filters */}
        <Layout.Section>
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              <Popover
                active={popoverActive}
                activator={
                  <Button icon={CalendarIcon} onClick={togglePopoverActive}>
                    {dateRange === 'custom'
                      ? `${selectedDates.start.toLocaleDateString()} - ${selectedDates.end.toLocaleDateString()}`
                      : dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}
                  </Button>
                }
                onClose={togglePopoverActive}
                autofocusTarget="first-node"
              >
                <div style={{ padding: '16px', minWidth: '320px' }}>
                  <BlockStack gap="400">
                    <ActionList
                      items={[
                        { content: 'Today', onAction: () => { setDateRange('today'); togglePopoverActive(); } },
                        { content: 'Last 7 days', onAction: () => { setDateRange('7d'); togglePopoverActive(); } },
                        { content: 'Last 30 days', onAction: () => { setDateRange('30d'); togglePopoverActive(); } },
                        { content: 'Custom Range', onAction: () => setDateRange('custom') },
                      ]}
                    />
                    {dateRange === 'custom' && (
                      <DatePicker
                        month={month}
                        year={year}
                        onChange={setSelectedDates}
                        onMonthChange={handleMonthChange}
                        selected={selectedDates}
                        multiMonth
                        allowRange
                      />
                    )}
                  </BlockStack>
                </div>
              </Popover>
              <Select
                options={FEATURES_LIST}
                value={selectedFeature}
                onChange={setSelectedFeature}
              />
              <Badge tone="success" progress="complete">
                <InlineStack gap="100" blockAlign="center">
                  <div style={{ width: '6px', height: '6px', background: '#008060', borderRadius: '50%' }} />
                  4 live visitors
                </InlineStack>
              </Badge>
            </InlineStack>
          </InlineStack>
        </Layout.Section>

        {/* 2. Unified Hero Card (Metric Toggles + Graph) */}
        <Layout.Section>
          <Card padding="500">
            <BlockStack gap="400">
              <div style={{ display: 'flex', gap: '8px', paddingBottom: '16px' }}>
                <MetricToggle
                  title="Sessions"
                  value="780"
                  trend="17%"
                  active={activeHeroMetric === 'sessions'}
                  onClick={() => setActiveHeroMetric('sessions')}
                />
                <MetricToggle
                  title="Total sales"
                  value={data.revenue}
                  trend={data.revenueTrend}
                  active={activeHeroMetric === 'revenue'}
                  onClick={() => setActiveHeroMetric('revenue')}
                />
                <MetricToggle
                  title="Orders"
                  value={data.orders}
                  trend={data.ordersTrend}
                  active={activeHeroMetric === 'orders'}
                  onClick={() => setActiveHeroMetric('orders')}
                />
                <MetricToggle
                  title="Conversion rate"
                  value={data.conv}
                  trend={data.convTrend}
                  active={activeHeroMetric === 'conv'}
                  onClick={() => setActiveHeroMetric('conv')}
                />
              </div>
              <HighFidelityGraph
                color="#008060"
                points={data.graphPoints}
                comparePoints={data.comparePoints}
                compareEnabled={true}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* 3. Video Tutorial - Moved to Center */}
        <Layout.Section>
          <MediaCard
            title="Master Your Setup in 3 Minutes"
            primaryAction={{
              content: 'Watch Tutorial',
              onAction: () => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank'),
            }}
            description="Learn how to leverage our high-converting widgets and coupons to explode your Shopify store sales."
            popoverActions={[{ content: 'Dismiss', onAction: () => { } }]}
          >
            <div style={{
              background: 'linear-gradient(135deg, #008060 0%, #005bd3 100%)',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'inherit'
            }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '16px solid white', marginLeft: '4px' }} />
              </div>
            </div>
          </MediaCard>
        </Layout.Section>

        {/* 4. Setup Progress Checklist */}
        {progressPercent < 100 && (
          <Layout.Section>
            <Card padding="500">
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="050">
                    <Text variant="headingMd" fontWeight="bold">Get Started: Setup Checklist</Text>
                    <Text variant="bodyMd" tone="subdued">Complete these steps to activate all app features and boost revenue.</Text>
                  </BlockStack>
                  <div style={{ textAlign: 'right' }}>
                    <Text variant="bodyMd" fontWeight="bold" tone="success">{completedSteps}/{setupSteps.length} Steps Active</Text>
                    <Text variant="bodySm" tone="subdued">{Math.round(progressPercent)}% complete</Text>
                  </div>
                </InlineStack>
                <ProgressBar progress={progressPercent} size="medium" tone="success" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '8px' }}>
                  {setupSteps.map(step => (
                    <div
                      key={step.id}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: step.completed ? '#f6f6f7' : '#fff',
                        border: step.completed ? '1px solid transparent' : '1px solid #ebebed',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        height: '100%'
                      }}
                    >
                      <InlineStack gap="150" blockAlign="center">
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: step.completed ? '#008060' : '#d2d5d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {step.completed && <Box background="success" width="10px" height="10px" borderRadius="circle" />}
                        </div>
                        <Text variant="bodySm" fontWeight="bold">{step.label}</Text>
                      </InlineStack>
                      <Button variant="tertiary" size="micro" onClick={() => scrollToGuides(step.guideTab)} fullWidth>
                        {step.completed ? 'Review' : 'View Guide'}
                      </Button>
                    </div>
                  ))}
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* 5. Event Breakdown */}
        <Layout.Section variant="oneHalf">
          <Card padding="0">
            <Box padding="400" borderBottomWidth="025" borderColor="border-subdued">
              <InlineStack align="space-between">
                <Text variant="headingMd" fontWeight="bold">Event Performance</Text>
                <Button variant="tertiary" icon={SearchIcon} />
              </InlineStack>
            </Box>
            <IndexTable
              resourceName={{ singular: 'event', plural: 'events' }}
              itemCount={EVENTS_DATA.length}
              headings={[{ title: 'Event' }, { title: 'Count', alignment: 'end' }, { title: 'Status' }]}
              selectable={false}
            >
              {EVENTS_DATA.map((row, index) => (
                <IndexTable.Row id={row.id} key={row.id} position={index}>
                  <IndexTable.Cell>
                    <BlockStack>
                      <Text variant="bodyMd" fontWeight="bold">{row.name}</Text>
                      <Text variant="bodySm" tone="subdued">{row.feature}</Text>
                    </BlockStack>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <div style={{ textAlign: 'right' }}>
                      <Text variant="bodyMd" fontWeight="semibold">{row.count}</Text>
                    </div>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge tone={row.status === 'Converting' ? 'success' : 'info'} size="small">
                      {row.status}
                    </Badge>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card padding="500">
            <BlockStack gap="400">
              <Text variant="headingMd" fontWeight="bold">Store Insights</Text>
              <Banner tone="info" hideIcon>
                <Text variant="bodySm">Users who see a **Coupon Slider** are 3x more likely to complete a purchase. Try enabling it for mobile users first.</Text>
              </Banner>
              <BlockStack gap="200">
                <Button fullWidth variant="primary" onClick={() => navigate('/app/productwidget')}>Manage Widgets</Button>
                <Button fullWidth onClick={() => navigate('/app/cartdrawer')}>Customize Cart</Button>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* 6. Setup Guides Tabs */}
        <Layout.Section>
          <div ref={guidesRef}>
            <Card padding="0">
              <Tabs
                tabs={[
                  { id: 'general', content: 'General Setup' },
                  { id: 'widgets', content: 'Product Widgets' },
                  { id: 'cart', content: 'Cart Drawer' }
                ]}
                selected={selectedTab}
                onSelect={setSelectedTab}
              >
                <Box padding="600">
                  {selectedTab === 0 && (
                    <BlockStack gap="400">
                      <Text variant="headingMd">General App Configuration</Text>
                      <TutorialStep number="1" title="Install the App" content="Ensure the app is correctly installed." completed={true} />
                      <TutorialStep number="2" title="Enable App Embeds" content="Go to the Theme Editor and toggle 'Cart App Core' to ON." completed={true} action={{ label: 'Theme Editor', onAction: () => window.open('https://admin.shopify.com', '_blank') }} />
                      <TutorialStep number="3" title="Create Your First Coupon" content="Start offering discounts to your customers." completed={false} action={{ label: 'Create Coupon', onAction: () => navigate('/app/createcoupon') }} />
                    </BlockStack>
                  )}
                  {selectedTab === 1 && (
                    <BlockStack gap="400">
                      <Text variant="headingMd">Setting Up Product Widgets</Text>
                      <TutorialStep number="1" title="Choose a Template" content="Select from Grid, List, or Minimal templates." completed={false} action={{ label: 'Choose Template', onAction: () => navigate('/app/productwidget') }} />
                      <TutorialStep number="2" title="Select Related Products" content="Enable AI-driven recommendations." completed={false} />
                      <TutorialStep number="3" title="Preview and Publish" content="Verify the widget looks great on your store." completed={false} />
                    </BlockStack>
                  )}
                  {selectedTab === 2 && (
                    <BlockStack gap="400">
                      <Text variant="headingMd">Enabling the Cart Drawer</Text>
                      <TutorialStep number="1" title="Toggle Cart Drawer ON" content="Enable the slide-out cart drawer." completed={false} action={{ label: 'Enable Drawer', onAction: () => navigate('/app/cartdrawer') }} />
                      <TutorialStep number="2" title="Add Cart Upsells" content="Configure upsell products." completed={false} />
                      <TutorialStep number="3" title="Customize Design" content="Adjust colors and fonts." completed={false} />
                    </BlockStack>
                  )}
                </Box>
              </Tabs>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

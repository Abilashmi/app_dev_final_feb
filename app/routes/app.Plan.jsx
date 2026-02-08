import React, { useState } from 'react';
import {
    Page,
    Layout,
    Card,
    BlockStack,
    InlineStack,
    Text,
    Button,
    Box,
    Icon,
    Badge,
    Divider,
    IndexTable,
} from '@shopify/polaris';
import {
    CheckCircleIcon,
    MinusIcon,
    MagicIcon,
    ChartVerticalIcon,
    CartIcon,
    CheckIcon,
} from '@shopify/polaris-icons';

const PlanCard = ({ title, price, features, mostPopular, isCurrentPlan, onUpgrade }) => (
    <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <Card padding="500">
            <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingMd" as="h2" fontWeight="bold">
                        {title}
                    </Text>
                    {mostPopular && (
                        <Badge tone="success">Most Popular</Badge>
                    )}
                </InlineStack>

                <InlineStack gap="100" blockAlign="baseline">
                    <Text variant="heading2xl" as="p" fontWeight="bold">
                        {price}
                    </Text>
                    <Text variant="bodyMd" tone="subdued">
                        /month
                    </Text>
                </InlineStack>

                <Button
                    fullWidth
                    variant={mostPopular ? "primary" : "secondary"}
                    disabled={isCurrentPlan}
                    onClick={onUpgrade}
                >
                    {isCurrentPlan ? "Current Plan" : "Upgrade"}
                </Button>

                <Divider />

                <BlockStack gap="200">
                    {features.map((feature, index) => (
                        <InlineStack key={index} gap="200" blockAlign="start">
                            <div style={{ marginTop: '2px' }}>
                                <Icon source={CheckIcon} tone="success" size="small" />
                            </div>
                            <Text variant="bodyMd" tone="subdued">
                                {feature}
                            </Text>
                        </InlineStack>
                    ))}
                </BlockStack>
            </BlockStack>
        </Card>
    </div>
);

export default function PricingPage() {
    const [currentPlan, setCurrentPlan] = useState('Basic');

    const handleUpgrade = (planName) => {
        alert(`Upgrading to ${planName}...`);
        // In a real app, this would initiate a Shopify billing flow
    };

    const plans = [
        {
            title: 'Basic',
            price: '₹9',
            isCurrentPlan: currentPlan === 'Basic',
            features: [
                'Overall app analytics',
                'Limited event tracking',
                'Up to 3 coupons',
                '1 Product widget',
                'Basic cart drawer',
                '30-day data retention',
                'Email support',
            ],
        },
        {
            title: 'Growth',
            price: '₹29',
            mostPopular: true,
            isCurrentPlan: currentPlan === 'Growth',
            features: [
                'Everything in Basic, plus:',
                'Advanced analytics & filters',
                'Conversion funnel',
                'Unlimited coupons',
                'Multiple product widgets',
                'Cart drawer with upsells',
                '180-day data retention',
                'Priority support',
            ],
        },
        {
            title: 'Pro',
            price: '₹59',
            isCurrentPlan: currentPlan === 'Pro',
            features: [
                'Everything in Growth, plus:',
                'Unlimited data retention',
                'CSV export & reporting',
                'Revenue uplift analytics',
                'Custom events & API access',
                'Priority onboarding',
                'SLA support',
            ],
        },
    ];

    const comparisonRows = [
        ['Overall Analytics', 'Basic', 'Full', 'Full'],
        ['Date Filters', 'Last 30 days', 'Custom Range', 'Custom Range'],
        ['Event Tracking', 'Limited', 'Full', 'Advanced'],
        ['Coupons', '3', 'Unlimited', 'Unlimited'],
        ['Product Widgets', '1', 'Multiple', 'Multiple'],
        ['Cart Drawer', 'Basic', 'Advanced', 'Fully Customizable'],
        ['Data Retention', '30 days', '180 days', 'Unlimited'],
        ['Support', 'Email', 'Priority', 'SLA Support'],
    ];

    return (
        <Page title="Plans & Pricing" subtitle="Choose the best plan for your business growth.">
            <Layout>
                <Layout.Section>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
                        {plans.map((plan) => (
                            <PlanCard
                                key={plan.title}
                                {...plan}
                                onUpgrade={() => handleUpgrade(plan.title)}
                            />
                        ))}
                    </div>
                </Layout.Section>

                <Layout.Section>
                    <Box paddingBlockStart="800">
                        <Card padding="0">
                            <Box padding="400" borderBottomWidth="025" borderColor="border-subdued">
                                <Text variant="headingMd" as="h3">Compare Plan Features</Text>
                            </Box>
                            <IndexTable
                                resourceName={{ singular: 'feature', plural: 'features' }}
                                itemCount={comparisonRows.length}
                                headings={[
                                    { title: 'Feature' },
                                    { title: 'Basic' },
                                    { title: 'Growth' },
                                    { title: 'Pro' },
                                ]}
                                selectable={false}
                            >
                                {comparisonRows.map((row, index) => (
                                    <IndexTable.Row id={index.toString()} key={index} position={index}>
                                        <IndexTable.Cell>
                                            <Text variant="bodyMd" fontWeight="bold">{row[0]}</Text>
                                        </IndexTable.Cell>
                                        <IndexTable.Cell>{row[1]}</IndexTable.Cell>
                                        <IndexTable.Cell>
                                            <Text fontWeight={row[2] === 'Full' || row[2] === 'Unlimited' ? 'bold' : 'regular'}>
                                                {row[2]}
                                            </Text>
                                        </IndexTable.Cell>
                                        <IndexTable.Cell>{row[3]}</IndexTable.Cell>
                                    </IndexTable.Row>
                                ))}
                            </IndexTable>
                        </Card>
                    </Box>
                </Layout.Section>

                <Layout.Section>
                    <Card padding="500">
                        <BlockStack gap="400">
                            <Text variant="headingMd">Frequently Asked Questions</Text>
                            <Grid>
                                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                                    <BlockStack gap="100">
                                        <Text variant="bodyMd" fontWeight="bold">Can I change plans later?</Text>
                                        <Text variant="bodyMd" tone="subdued">Yes, you can upgrade or downgrade your plan at any time from this page.</Text>
                                    </BlockStack>
                                </Grid.Cell>
                                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                                    <BlockStack gap="100">
                                        <Text variant="bodyMd" fontWeight="bold">How does the 30-day data retention work?</Text>
                                        <Text variant="bodyMd" tone="subdued">On the Basic plan, analytics data older than 30 days is automatically archived.</Text>
                                    </BlockStack>
                                </Grid.Cell>
                            </Grid>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

const Grid = ({ children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {children}
    </div>
);

Grid.Cell = ({ children }) => <div>{children}</div>;

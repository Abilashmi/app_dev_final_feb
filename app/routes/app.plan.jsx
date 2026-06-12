import { boundary } from "@shopify/shopify-app-react-router/server";
import { useLoaderData } from "react-router";
import {
    Page, Layout, Card, BlockStack, InlineStack, Text, Badge, Box, Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { isDataRequest } from "../utils/auth.server";
import { redirect } from "react-router";

export const shouldRevalidate = () => false;

export async function loader({ request }) {
    if (isDataRequest(request)) return {};
    const { admin } = await authenticate.admin(request);
    const res = await admin.graphql(`
        query { shop { plan { partnerDevelopment } } }
    `);
    const data = await res.json();
    const isDevStore = data.data?.shop?.plan?.partnerDevelopment === true;
    if (!isDevStore) throw redirect("/app");
    return {};
}

const FREE_FEATURES = [
    "Cart drawer customization",
    "Coupon slider",
    "Product recommendations (FBT, Grid, Carousel)",
    "Free shipping progress bar",
    "Star ratings on cart items",
    "Analytics dashboard",
    "Unlimited orders",
    "Dev store only — no billing",
];

const PRO_FEATURES = [
    "Everything in Free",
    "Live merchant store support",
    "50 orders/day included",
    "Overage: $0.10/order above 50/day",
    "Capped at $500/month",
    "Priority support",
    "14-day free trial",
];

export default function PlanPage() {
    return (
        <Page title="Plans" subtitle="You're on a development store — all features are free.">
            <Layout>
                <Layout.Section variant="oneHalf">
                    <Card padding="600">
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="headingLg" fontWeight="bold">Free</Text>
                                <Badge tone="success">Your current plan</Badge>
                            </InlineStack>

                            <InlineStack gap="100" blockAlign="baseline">
                                <Text variant="heading2xl" fontWeight="bold">$0</Text>
                                <Text variant="bodyMd" tone="subdued">/month</Text>
                            </InlineStack>

                            <Box background="bg-surface-success-subdued" padding="300" borderRadius="150">
                                <Text variant="bodySm" tone="success" fontWeight="semibold">
                                    Dev store — no charges ever
                                </Text>
                            </Box>

                            <Divider />

                            <BlockStack gap="200">
                                {FREE_FEATURES.map((f, i) => (
                                    <InlineStack key={i} gap="200" blockAlign="center">
                                        <Text tone="success">✓</Text>
                                        <Text variant="bodyMd">{f}</Text>
                                    </InlineStack>
                                ))}
                            </BlockStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                <Layout.Section variant="oneHalf">
                    <Card padding="600">
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="headingLg" fontWeight="bold">Pro</Text>
                                <Badge tone="info">For live stores</Badge>
                            </InlineStack>

                            <InlineStack gap="100" blockAlign="baseline">
                                <Text variant="heading2xl" fontWeight="bold">$29</Text>
                                <Text variant="bodyMd" tone="subdued">/month</Text>
                            </InlineStack>

                            <Box background="bg-surface-info-subdued" padding="300" borderRadius="150">
                                <Text variant="bodySm" tone="info" fontWeight="semibold">
                                    14-day free trial · no credit card required
                                </Text>
                            </Box>

                            <Divider />

                            <BlockStack gap="200">
                                {PRO_FEATURES.map((f, i) => (
                                    <InlineStack key={i} gap="200" blockAlign="center">
                                        <Text tone="success">✓</Text>
                                        <Text variant="bodyMd">{f}</Text>
                                    </InlineStack>
                                ))}
                            </BlockStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

import { useRouteError } from "react-router";
export function ErrorBoundary() { return boundary.error(useRouteError()); }
export const headers = (h) => boundary.headers(h);

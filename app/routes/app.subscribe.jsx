import { boundary } from "@shopify/shopify-app-react-router/server";
import { useActionData, useLoaderData, useNavigation, useSubmit, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
    Page, Card, BlockStack, InlineStack, Text, Button, Box, Badge, Divider, Banner, ButtonGroup
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { isDataRequest } from "../utils/auth.server";

export const shouldRevalidate = () => false;

export async function loader({ request }) {
    if (isDataRequest(request)) return { isSubscribed: false };
    const { admin } = await authenticate.admin(request);
    const res = await admin.graphql(`
        query {
            currentAppInstallation {
                activeSubscriptions { id status }
            }
        }
    `);
    const data = await res.json();
    const subs = data.data?.currentAppInstallation?.activeSubscriptions || [];
    return { isSubscribed: subs.some(s => s.status === "ACTIVE") };
}

export async function action({ request }) {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const interval = formData.get("interval") === "ANNUAL" ? "ANNUAL" : "EVERY_30_DAYS";
    const price = interval === "ANNUAL" ? "290.00" : "29.00";
    const shop = session.shop;
    // eslint-disable-next-line no-undef
    const apiKey = process.env.SHOPIFY_API_KEY;
    // Return into the embedded app via Shopify admin — avoids OAuth loop on redirect back
    const returnUrl = `https://${shop}/admin/apps/${apiKey}/app/billing`;

    const mutation = `
        mutation AppSubscriptionCreate(
            $name: String!
            $lineItems: [AppSubscriptionLineItemInput!]!
            $returnUrl: URL!
            $trialDays: Int
        ) {
            appSubscriptionCreate(
                name: $name
                lineItems: $lineItems
                returnUrl: $returnUrl
                trialDays: $trialDays
            ) {
                userErrors { field message }
                confirmationUrl
                appSubscription { id status }
            }
        }
    `;

    const variables = {
        name: "Cart Ninja Pro",
        lineItems: [
            {
                plan: {
                    appRecurringPricingDetails: {
                        price: { amount: price, currencyCode: "USD" },
                        interval,
                    },
                },
            },
            {
                plan: {
                    appUsagePricingDetails: {
                        terms: "$0.10 per order above 50 orders/day. Capped at $500/month.",
                        cappedAmount: { amount: "500.00", currencyCode: "USD" },
                    },
                },
            },
        ],
        returnUrl,
        trialDays: 14,
    };

    const res = await admin.graphql(mutation, { variables });
    const data = await res.json();

    const userErrors = data.data?.appSubscriptionCreate?.userErrors;
    if (userErrors?.length > 0) {
        return { error: userErrors[0].message };
    }

    const confirmationUrl = data.data?.appSubscriptionCreate?.confirmationUrl;
    if (!confirmationUrl) {
        return { error: "No confirmation URL returned from Shopify." };
    }

    return { confirmationUrl };
}

const PRO_FEATURES = [
    "Cart drawer customization",
    "Coupon slider",
    "Product recommendations (FBT, Grid, Carousel)",
    "Free shipping progress bar",
    "Star ratings on cart items",
    "Advanced analytics dashboard",
    "50 orders/day included",
    "Overage: $0.10/order above 50/day (max $500/mo)",
    "Priority support",
];

export default function SubscribePage() {
    const { isSubscribed } = useLoaderData();
    const actionData = useActionData();
    const navigation = useNavigation();
    const submit = useSubmit();
    const navigate = useNavigate();
    const [interval, setInterval] = useState("EVERY_30_DAYS");

    const isAnnual = interval === "ANNUAL";
    const isSubmitting = navigation.state === "submitting";

    useEffect(() => {
        if (isSubscribed) navigate("/app/billing");
    }, [isSubscribed]);

    useEffect(() => {
        if (actionData?.confirmationUrl) {
            window.top.location.href = actionData.confirmationUrl;
        }
    }, [actionData]);

    return (
        <Page title="Upgrade to Cart Ninja Pro" subtitle="Unlock all features with a 14-day free trial">
            {actionData?.error && (
                <Box paddingBlockEnd="400">
                    <Banner tone="critical">{actionData.error}</Banner>
                </Box>
            )}

            <InlineStack align="center">
                <Box minWidth="340px" maxWidth="420px">
                    <Card padding="600">
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="headingLg" fontWeight="bold">Cart Ninja Pro</Text>
                                <Badge tone="success">14-day free trial</Badge>
                            </InlineStack>

                            {/* Billing toggle */}
                            <InlineStack align="center">
                                <ButtonGroup variant="segmented">
                                    <Button pressed={!isAnnual} onClick={() => setInterval("EVERY_30_DAYS")}>
                                        Monthly
                                    </Button>
                                    <Button pressed={isAnnual} onClick={() => setInterval("ANNUAL")}>
                                        Yearly — save 2 months
                                    </Button>
                                </ButtonGroup>
                            </InlineStack>

                            <InlineStack gap="100" blockAlign="baseline">
                                <Text variant="heading2xl" fontWeight="bold">
                                    {isAnnual ? "$290" : "$29"}
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                    {isAnnual ? "/year ($24.16/mo)" : "/month"}
                                </Text>
                            </InlineStack>

                            <Box background="bg-surface-success" padding="300" borderRadius="150">
                                <Text variant="bodySm" fontWeight="bold" tone="success">
                                    14 days free — no charge until trial ends
                                </Text>
                            </Box>

                            <Divider />

                            <BlockStack gap="200">
                                {PRO_FEATURES.map((f, i) => (
                                    <InlineStack key={i} gap="200" blockAlign="center">
                                        <Text variant="bodyMd" tone="success">✓</Text>
                                        <Text variant="bodyMd">{f}</Text>
                                    </InlineStack>
                                ))}
                            </BlockStack>

                            <Button
                                variant="primary"
                                size="large"
                                fullWidth
                                loading={isSubmitting}
                                onClick={() => submit({ interval }, { method: "POST" })}
                            >
                                Start 14-Day Free Trial
                            </Button>

                            <Text variant="bodySm" tone="subdued" alignment="center">
                                {isAnnual ? "Billed once yearly." : "Billed monthly, cancel anytime."}
                                {" "}Usage fees apply above 50 orders/day.
                            </Text>
                        </BlockStack>
                    </Card>
                </Box>
            </InlineStack>
        </Page>
    );
}

import { useRouteError } from "react-router";
export function ErrorBoundary() { return boundary.error(useRouteError()); }
export const headers = (h) => boundary.headers(h);

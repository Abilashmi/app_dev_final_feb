import { boundary } from "@shopify/shopify-app-react-router/server";
import { useLoaderData, useNavigate } from "react-router";
import { useEffect } from "react";
import {
  Page, Layout, Card, BlockStack, Text, Badge, Box, InlineStack, Button, ProgressBar, Divider,
} from "@shopify/polaris";
import { CheckCircleIcon, ChartVerticalIcon, CreditCardIcon } from "@shopify/polaris-icons";
import { Icon } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { isDataRequest } from "../utils/auth.server";

export const shouldRevalidate = () => false;

export async function loader({ request }) {
  if (isDataRequest(request)) return { subscription: null };
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const subRes = await admin.graphql(`
    query {
      currentAppInstallation {
        activeSubscriptions {
          id name status trialDays createdAt currentPeriodEnd
          lineItems {
            id
            plan {
              pricingDetails {
                __typename
                ... on AppRecurringPricing {
                  price { amount currencyCode }
                  interval
                }
                ... on AppUsagePricing {
                  terms
                  cappedAmount { amount currencyCode }
                  balanceUsed { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  `);
  const subData = await subRes.json();
  const subs = subData.data?.currentAppInstallation?.activeSubscriptions || [];
  const activeSub = subs.find(s => s.status === "ACTIVE" || s.status === "PENDING");

  if (!activeSub) return { subscription: null };

  const recurringLine = activeSub.lineItems?.find(
    li => li.plan.pricingDetails.__typename === "AppRecurringPricing"
  );
  const usageLine = activeSub.lineItems?.find(
    li => li.plan.pricingDetails.__typename === "AppUsagePricing"
  );

  const balanceUsed = parseFloat(usageLine?.plan?.pricingDetails?.balanceUsed?.amount || 0);
  const cappedAmount = parseFloat(usageLine?.plan?.pricingDetails?.cappedAmount?.amount || 500);
  const basePrice = recurringLine?.plan?.pricingDetails?.price?.amount || "29.00";
  const interval = recurringLine?.plan?.pricingDetails?.interval || "EVERY_30_DAYS";

  return {
    shop,
    subscription: {
      id: activeSub.id,
      status: activeSub.status,
      name: activeSub.name,
      currentPeriodEnd: activeSub.currentPeriodEnd,
      basePrice,
      interval,
      balanceUsed,
      cappedAmount,
    },
  };
}

export default function BillingDashboard() {
  const { subscription } = useLoaderData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!subscription) navigate("/app/subscribe");
  }, [subscription]);

  if (!subscription) return null;

  const usagePct = subscription.cappedAmount > 0
    ? Math.min((subscription.balanceUsed / subscription.cappedAmount) * 100, 100)
    : 0;

  const periodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  const isAnnual = subscription.interval === "ANNUAL";
  const isActive = subscription.status === "ACTIVE";

  return (
    <Page title="Billing" subtitle="Cart Ninja Pro subscription">
      <Layout>
        {/* Left column */}
        <Layout.Section variant="oneHalf">
          <BlockStack gap="400">

            {/* Plan card */}
            <Card padding="600">
              <BlockStack gap="500">
                <InlineStack align="space-between" blockAlign="start">
                  <BlockStack gap="100">
                    <Text variant="headingMd" fontWeight="bold">Cart Ninja Pro</Text>
                    <Text variant="bodySm" tone="subdued">
                      ${subscription.basePrice}/{isAnnual ? "year" : "month"}
                    </Text>
                  </BlockStack>
                  <Badge tone={isActive ? "success" : "attention"}>
                    {isActive ? "Active" : subscription.status}
                  </Badge>
                </InlineStack>

                <Divider />

                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodySm" tone="subdued">Renewal date</Text>
                    <Text variant="bodySm" fontWeight="semibold">{periodEnd}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text variant="bodySm" tone="subdued">Billing cycle</Text>
                    <Text variant="bodySm" fontWeight="semibold">{isAnnual ? "Annual" : "Monthly"}</Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text variant="bodySm" tone="subdued">Base price</Text>
                    <Text variant="bodySm" fontWeight="semibold">${subscription.basePrice}/{isAnnual ? "yr" : "mo"}</Text>
                  </InlineStack>
                </BlockStack>

                <Box background="bg-surface-success-subdued" padding="300" borderRadius="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={CheckCircleIcon} tone="success" />
                    <Text tone="success" variant="bodySm" fontWeight="semibold">
                      All features unlocked · 50 orders/day included
                    </Text>
                  </InlineStack>
                </Box>
              </BlockStack>
            </Card>

            {/* Manage card */}
            <Card padding="600">
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={CreditCardIcon} />
                  <Text variant="headingMd" fontWeight="bold">Manage Subscription</Text>
                </InlineStack>
                <Text tone="subdued" variant="bodySm">
                  To cancel or change your plan, visit your Shopify admin billing settings.
                </Text>
                <Button url="https://admin.shopify.com/settings/billing" external variant="plain">
                  Open Shopify Billing Settings
                </Button>
              </BlockStack>
            </Card>

          </BlockStack>
        </Layout.Section>

        {/* Right column */}
        <Layout.Section variant="oneHalf">
          <Card padding="600">
            <BlockStack gap="500">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={ChartVerticalIcon} />
                <Text variant="headingMd" fontWeight="bold">Usage This Period</Text>
              </InlineStack>

              <Divider />

              {/* Usage stats */}
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodySm" tone="subdued">Usage charges</Text>
                  <Text variant="headingMd" fontWeight="bold">
                    ${subscription.balanceUsed.toFixed(2)}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodySm" tone="subdued">Monthly cap</Text>
                  <Text variant="bodySm" fontWeight="semibold">
                    ${subscription.cappedAmount.toFixed(2)}
                  </Text>
                </InlineStack>
              </BlockStack>

              {/* Progress bar */}
              <BlockStack gap="200">
                <ProgressBar
                  progress={usagePct}
                  tone={usagePct > 80 ? "critical" : "success"}
                  size="medium"
                />
                <InlineStack align="space-between">
                  <Text variant="bodySm" tone="subdued">${subscription.balanceUsed.toFixed(2)} used</Text>
                  <Text variant="bodySm" tone="subdued">${subscription.cappedAmount.toFixed(2)} cap</Text>
                </InlineStack>
              </BlockStack>

              <Divider />

              {/* How it works */}
              <BlockStack gap="200">
                <Text variant="headingSm" fontWeight="semibold">How usage billing works</Text>
                <BlockStack gap="100">
                  <InlineStack gap="150" blockAlign="start">
                    <Text tone="subdued">·</Text>
                    <Text variant="bodySm" tone="subdued">50 orders/day included in your plan</Text>
                  </InlineStack>
                  <InlineStack gap="150" blockAlign="start">
                    <Text tone="subdued">·</Text>
                    <Text variant="bodySm" tone="subdued">$0.10 per order above 50/day</Text>
                  </InlineStack>
                  <InlineStack gap="150" blockAlign="start">
                    <Text tone="subdued">·</Text>
                    <Text variant="bodySm" tone="subdued">Charges added to monthly invoice automatically</Text>
                  </InlineStack>
                  <InlineStack gap="150" blockAlign="start">
                    <Text tone="subdued">·</Text>
                    <Text variant="bodySm" tone="subdued">Capped at ${subscription.cappedAmount.toFixed(0)}/month max</Text>
                  </InlineStack>
                </BlockStack>
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

import { useLoaderData } from "react-router";
import { Page, Layout, Card, BlockStack, Text, Badge, Banner, IndexTable, Box, InlineStack, Button } from "@shopify/polaris";
import { CheckCircleIcon, ChartVerticalIcon } from "@shopify/polaris-icons";
import { Icon } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { redirect } from "react-router";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get active subscription from Shopify
  const subRes = await admin.graphql(`
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          trialDays
          createdAt
          currentPeriodEnd
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

  // No active subscription — redirect to subscribe
  if (!activeSub) {
    throw redirect("/app/subscribe");
  }

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

  const usagePct = subscription.cappedAmount > 0
    ? Math.min((subscription.balanceUsed / subscription.cappedAmount) * 100, 100)
    : 0;

  const periodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  const isAnnual = subscription.interval === "ANNUAL";

  return (
    <Page
      title="Billing"
      subtitle="Cart Ninja Pro subscription"
    >
      <Layout>
        <Layout.Section>
          {/* Plan Summary */}
          <Card padding="600">
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text variant="headingMd" fontWeight="bold">Cart Ninja Pro</Text>
                  <Text variant="bodySm" tone="subdued">
                    ${subscription.basePrice}/{isAnnual ? "year" : "month"} · renews {periodEnd}
                  </Text>
                </BlockStack>
                <Badge tone={subscription.status === "ACTIVE" ? "success" : "attention"}>
                  {subscription.status === "ACTIVE" ? "Active" : subscription.status}
                </Badge>
              </InlineStack>

              <Box background="bg-surface-success-subdued" padding="300" borderRadius="150">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={CheckCircleIcon} tone="success" />
                  <Text tone="success" variant="bodySm">
                    All features unlocked · 50 orders/day included
                  </Text>
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Usage-based charges */}
        <Layout.Section>
          <Card padding="600">
            <BlockStack gap="400">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={ChartVerticalIcon} />
                <Text variant="headingMd" fontWeight="bold">Usage Charges This Period</Text>
              </InlineStack>

              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="bodySm" tone="subdued">Used</Text>
                  <Text variant="bodySm" fontWeight="semibold">
                    ${subscription.balanceUsed.toFixed(2)} / ${subscription.cappedAmount.toFixed(2)} cap
                  </Text>
                </InlineStack>
                <Box background="bg-surface-secondary" borderRadius="100" minHeight="8px">
                  <Box
                    background={usagePct > 80 ? "bg-fill-critical" : "bg-fill-success"}
                    borderRadius="100"
                    minHeight="8px"
                    style={{ width: `${usagePct}%` }}
                  />
                </Box>
                <Text variant="bodySm" tone="subdued">
                  $0.10 per order above 50 orders/day. Charges are added to your monthly invoice automatically.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Manage */}
        <Layout.Section>
          <Card padding="600">
            <BlockStack gap="300">
              <Text variant="headingMd" fontWeight="bold">Manage Subscription</Text>
              <Text tone="subdued" variant="bodySm">
                To cancel or change your plan, visit your Shopify admin billing settings.
              </Text>
              <Button
                url="https://admin.shopify.com/settings/billing"
                external
                variant="plain"
              >
                Open Shopify Billing Settings
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

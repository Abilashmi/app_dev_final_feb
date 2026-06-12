import { boundary } from "@shopify/shopify-app-react-router/server";
import { useRouteError } from "react-router";
import { Page, Card, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { isDataRequest } from "../utils/auth.server";

export const shouldRevalidate = () => false;

export async function loader({ request }) {
  if (isDataRequest(request)) return {};
  await authenticate.admin(request);
  return {};
}

export default function UpsellPage() {
  return (
    <Page title="Upsell">
      <Card padding="600">
        <Text>Upsell configuration</Text>
      </Card>
    </Page>
  );
}

export function ErrorBoundary() { return boundary.error(useRouteError()); }
export const headers = (h) => boundary.headers(h);

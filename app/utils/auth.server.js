import { authenticate } from "../shopify.server";

/**
 * Detects React Router client-side data fetch requests.
 * These arrive with ?_routes= query param, no Shopify session token header,
 * and no shop/host query params — passing them to authenticate.admin()
 * causes the SDK to emit an App Bridge redirect page (200 HTML) that
 * breaks the embedded iframe navigation.
 */
export function isDataRequest(request) {
  const url = new URL(request.url);
  return url.searchParams.has("_routes");
}

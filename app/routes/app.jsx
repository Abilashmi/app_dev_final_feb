import { Outlet, useLoaderData, useRouteError, useNavigate, useLocation } from "react-router";
import { useEffect } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { authenticate } from "../shopify.server";
import { getShopCurrencySymbol } from "../utils/currency.server";
import { CurrencyProvider } from "../components/CurrencyContext";
import { PlanProvider } from "../components/PlanContext";

export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request);

    const res = await admin.graphql(`
        query {
            shop { plan { partnerDevelopment } }
            currentAppInstallation {
                activeSubscriptions { id status }
            }
        }
    `);
    const data = await res.json();

    // Dev stores (partner_test) get free access — required for Shopify review
    const isDevStore = data.data?.shop?.plan?.partnerDevelopment === true;
    const subs = data.data?.currentAppInstallation?.activeSubscriptions || [];
    const isPro = isDevStore || subs.some(s => s.status === "ACTIVE");

    const currencySymbol = await getShopCurrencySymbol(admin);
    // eslint-disable-next-line no-undef
    return { apiKey: process.env.SHOPIFY_API_KEY || "", currencySymbol, isPro, isDevStore };
};

export default function App() {
    const { apiKey, currencySymbol, isPro, isDevStore } = useLoaderData();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isPro && location.pathname !== "/app/subscribe") {
            navigate("/app/subscribe");
        }
    }, [isPro, location.pathname]);

    return (
        <ShopifyAppProvider embedded apiKey={apiKey}>
            <PolarisAppProvider i18n={enTranslations}>
                <CurrencyProvider symbol={currencySymbol}>
                    <PlanProvider isPro={isPro}>
                        <s-app-nav>
                            <s-link href="/app/discount">Create coupons</s-link>
                            <s-link href="/app/productwidget">Productwidget</s-link>
                            <s-link href="/app/cartdrawer">Cartdrawer Editor</s-link>
                            {isDevStore && <s-link href="/app/plan">Plan</s-link>}
                        </s-app-nav>
                        <Outlet context={{ currencySymbol }} />
                    </PlanProvider>
                </CurrencyProvider>
            </PolarisAppProvider>
        </ShopifyAppProvider>
    );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
    return boundary.error(useRouteError());
}
export const headers = (headersArgs) => {
    return boundary.headers(headersArgs);
};

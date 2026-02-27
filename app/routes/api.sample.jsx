// ---------------- EXTERNAL API ----------------
const EXTERNAL_CART_API = "https://spread-monitored-chronicles-ray.trycloudflare.com/cartdrawer/save_cart_drawer.php";

// ---------------- DEFAULTS ----------------
const DEFAULT_SETTINGS = {
    progressBar: {
        enabled: false,
        mode: "amount",
        showOnEmpty: true,
        barBackgroundColor: "#e2e8f0",
        borderRadius: 8,
        completionText: "🎉 You've unlocked free shipping!",
        maxTarget: 1000,
        tiers: [
            { id: 1, minValue: 500, description: "Free Shipping", products: [], rewardType: 'product' }
        ]
    },
    coupons: {
        enabled: false,
        selectedStyle: "style-2",
        position: "top",
        layout: "grid",
        alignment: "horizontal"
    },
    upsell: {
        enabled: false,
        upsellMode: 'manual',
        upsellTitle: { text: "Frequently Bought Together", color: "#111827" },
        manualRules: [],
        activeTemplate: 'grid'
    }
};

const DEFAULT_CART_DATA = {
    cartValue: 0,
    totalQuantity: 0,
    items: [],
};

// ---------------- TRANSFORM FROM DB ----------------
function transformFromDB(dbData) {
    const parseJSON = (val) => {
        if (!val) return {};
        if (typeof val === "object") return val;
        try { return JSON.parse(val); } catch { return {}; }
    };

    const progressData = parseJSON(dbData.progress_data);
    const couponData = parseJSON(dbData.coupon_data);
    const upsellData = parseJSON(dbData.upsell_data);

    // Map DB status flags to enabled booleans
    const progressEnabled = dbData.progress_status === 1 || dbData.progress_status === "1" || dbData.progress_status === true;
    const couponEnabled = dbData.coupon_status === 1 || dbData.coupon_status === "1" || dbData.coupon_status === true;
    const upsellEnabled = dbData.upsell_status === 1 || dbData.upsell_status === "1" || dbData.upsell_status === true;

    // Support both cartStatus and cart_status from DB
    const cartActive = dbData.cartStatus === 1 || dbData.cartStatus === "1" || dbData.cartStatus === true ||
        dbData.cart_status === 1 || dbData.cart_status === "1" || dbData.cart_status === true;

    // Build settings in the format the frontend expects
    const settings = {
        progressBar: {
            ...DEFAULT_SETTINGS.progressBar,
            ...progressData,
            enabled: progressEnabled,
        },
        coupons: {
            ...DEFAULT_SETTINGS.coupons,
            enabled: couponEnabled,
            selectedStyle: couponData.style || couponData.selectedStyle || DEFAULT_SETTINGS.coupons.selectedStyle,
            position: couponData.position || DEFAULT_SETTINGS.coupons.position,
            layout: couponData.layout || DEFAULT_SETTINGS.coupons.layout,
            alignment: couponData.alignment || DEFAULT_SETTINGS.coupons.alignment,
        },
        upsell: {
            ...DEFAULT_SETTINGS.upsell,
            ...upsellData,
            enabled: upsellEnabled,
        }
    };

    // Extract coupon selections if present in coupon_data
    const couponSelections = {
        selectedCouponIds: couponData.selectedActiveCoupons || [],
        couponOverrides: couponData.couponOverrides || {},
    };

    return { settings, couponSelections, cartActive };
}

import { getStoredCoupons } from "./api.create_coupon-sample";

// ---------------- LOADER ----------------
export async function loader({ request }) {
    const url = new URL(request.url);
    const shopDomain = url.searchParams.get("shop") || "";

    const storedCoupons = await getStoredCoupons(shopDomain);

    // Map stored coupons to the format app.cartdrawer.jsx expects
    const formattedCoupons = storedCoupons.map(c => ({
        id: c.id,
        code: c.code,
        heading: c.title || c.code,
        subtext: c.type === 'amount_off_order' ? 'Order Discount' : 'Product Discount',
        discountType: c.valueType === 'percentage' ? 'percentage' : 'fixed',
        discountValue: parseFloat(c.value || 0),
        ends_at: c.endDate,
        status: 'ACTIVE'
    }));

    // If no shopDomain, return defaults
    if (!shopDomain) {
        console.warn("No shop domain provided to sample API loader, returning defaults");
        return Response.json({
            success: true,
            settings: { ...DEFAULT_SETTINGS },
            cartStatus: false,
            cartData: { ...DEFAULT_CART_DATA },
            coupons: formattedCoupons
        });
    }

    try {
        const apiUrl = `${EXTERNAL_CART_API}?shopdomain=${encodeURIComponent(shopDomain)}`;
        console.log("Fetching cart drawer config from:", apiUrl);

        const extRes = await fetch(apiUrl, {
            method: "GET",
            headers: { "ngrok-skip-browser-warning": "true" },
        });

        const extBody = await extRes.json();
        console.log(`External Cart API GET response [${extRes.status}]:`, JSON.stringify(extBody));

        if (extBody.status === "success" && extBody.data) {
            const { settings, couponSelections, cartActive } = transformFromDB(extBody.data);

            return Response.json({
                success: true,
                settings,
                couponSelections,
                cartStatus: cartActive,
                cartData: { ...DEFAULT_CART_DATA },
                coupons: formattedCoupons
            });
        } else {
            console.warn("External Cart API returned non-success, using defaults");
            return Response.json({
                success: true,
                settings: { ...DEFAULT_SETTINGS },
                cartData: { ...DEFAULT_CART_DATA },
                coupons: formattedCoupons
            });
        }
    } catch (error) {
        console.error("Failed to fetch from external Cart API:", error.message);
        return Response.json({
            success: true,
            settings: { ...DEFAULT_SETTINGS },
            cartData: { ...DEFAULT_CART_DATA },
            coupons: formattedCoupons
        });
    }
}

// In-memory store for cart drawer settings
let savedSettings = null;

// ---------------- ACTION ----------------
export async function action({ request }) {
    if (request.method !== "POST") {
        return Response.json(
            { error: "Method not allowed" },
            { status: 405 }
        );
    }

    try {
        const data = await request.json();

        console.log("------------------------------------------");
        console.log("RECEIVED DATA ON SAMPLE API:");
        console.log(JSON.stringify(data, null, 2));
        console.log("------------------------------------------");

        // Save to in-memory store
        savedSettings = data;

        // Attempt to forward to external PHP endpoint (optional, non-blocking)
        try {
            const externalResponse = await fetch(
                "https://omaha-permissions-moves-fifteen.trycloudflare.com/cartdrawer/save_cart_drawer.php",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                }
            );

            if (externalResponse.ok) {
                const externalResult = await externalResponse.json();
                console.log("External sync successful:", externalResult);
            } else {
                const errorText = await externalResponse.text();
                console.warn(`External sync warning (${externalResponse.status}):`, errorText);
            }
        } catch (externalError) {
            // External endpoint is optional - log but don't fail the request
            console.warn("External sync unavailable (data saved locally):", externalError.message);
        }

        // Always return success to the client
        return Response.json({
            success: true,
            message: "Configuration saved successfully",
            receivedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Sample API Critical Error:", error);
        return Response.json(
            { success: false, error: error.message || "Failed to parse request" },
            { status: 400 }
        );
    }
}
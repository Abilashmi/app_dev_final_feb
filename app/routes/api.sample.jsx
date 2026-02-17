// ---------------- SAMPLE DATA ----------------
const SAMPLE_DATA = {
    success: true,
    cartData: {
        cartValue: 125,
        totalQuantity: 3,
        items: [
            { id: 'item-1', title: 'Premium Cotton Tee', price: 45, quantity: 1, image: '👕' },
            { id: 'item-2', title: 'Designer Hoodie', price: 80, quantity: 1, image: '🧥' },
            { id: 'item-3', title: 'Snapback Cap', price: 25, quantity: 1, image: '🧢' },
        ],
    },
    settings: {
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
            upsellTitle: { text: "Frequently Bought Together", color: "#111827" },
            manualRules: [],
            activeTemplate: 'grid'
        }
    }
};

import { getStoredCoupons } from "./api.create_coupon-sample";

// ---------------- LOADER ----------------
export async function loader() {
    const storedCoupons = await getStoredCoupons();

    // Map stored coupons to the format app.cartdrawer.jsx expects
    const formattedCoupons = storedCoupons.map(c => ({
        id: c.id,
        code: c.code,
        heading: c.title || c.code,
        subtext: c.type === 'amount_off_order' ? 'Order Discount' : 'Product Discount',
        discountType: c.valueType === 'percentage' ? 'percentage' : 'fixed',
        discountValue: parseFloat(c.value || 0),
        ends_at: c.endDate,
        status: 'ACTIVE' // Force active to ensure it shows in the "Active Coupons" list
    }));

    return Response.json({
        ...SAMPLE_DATA,
        coupons: formattedCoupons
    });
}

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

        // SEND DATA TO PHP ENDPOINT
        const externalResponse = await fetch(
            "https://prefixal-turbanlike-britt.ngrok-free.dev/cartdrawer/test.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );

        const externalResult = await externalResponse.json();

        return Response.json({
            success: true,
            message: "Data successfully synced",
            externalResponse: externalResult,
            receivedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error("Sample API Error:", error);

        return Response.json(
            { success: false, error: "Invalid JSON or forwarding failed" },
            { status: 400 }
        );
    }
}


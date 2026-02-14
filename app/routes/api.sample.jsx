// Sample Data Configuration
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
    },
    shopifyProducts: [
        { id: 'sp-1', title: 'Wireless Headphones', price: 99.99, image: '🎧' },
        { id: 'sp-2', title: 'Smart Watch', price: 199.99, image: '⌚' },
        { id: 'sp-3', title: 'Portable Speaker', price: 59.99, image: '🔊' },
        { id: 'sp-4', title: 'Leather Wallet', price: 39.99, image: '👛' },
        { id: 'sp-5', title: 'Running Shoes', price: 120.00, image: '👟' }
    ],
    shopifyCollections: [
        { id: 'sc-1', title: 'Trending Now', productCount: 12 },
        { id: 'sc-2', title: 'New Arrivals', productCount: 8 }
    ],
    coupons: [
        { id: 'cp-1', status: 'ACTIVE', code: 'SAVE10', heading: '10% Discount', discountType: 'percentage', discountValue: 10 },
        { id: 'cp-2', status: 'ACTIVE', code: 'OFF50', heading: '₹50 OFF Your Order', discountType: 'fixed', discountValue: 50 },
        { id: 'cp-3', status: 'ACTIVE', code: 'SHIPFREE', heading: 'Free Shipping', discountType: 'fixed', discountValue: 0 }
    ]
};

export async function loader() {
    return Response.json(SAMPLE_DATA);
}

export async function action({ request }) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const data = await request.json();
        console.log("------------------------------------------");
        console.log("RECEIVED DATA ON SAMPLE API:");
        console.log(JSON.stringify(data, null, 2));
        console.log("------------------------------------------");

        return Response.json({
            success: true,
            message: "Data successfully synced to sample API",
            receivedAt: new Date().toISOString()
        }, { status: 200 });
    } catch (error) {
        console.error("Sample API Error:", error);
        return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }
}

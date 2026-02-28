
// ===============================
// Configuration
// ===============================

const PHP_ENDPOINT = "https://cameron-shadows-eggs-fruits.trycloudflare.com/cartdrawer/save_coupon.php";


// ===============================
// PHP Forwarding & Fetching
// ===============================

/**
 * Send coupon to PHP endpoint (POST)
 */
async function sendCouponToPHP(coupon) {
    try {
        const response = await fetch(PHP_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(coupon)
        });

        const text = await response.text();

        console.log("---------- PHP POST RESPONSE ----------");
        console.log(text);
        console.log("---------------------------------------");

        if (!response.ok) {
            throw new Error(`PHP POST returned status ${response.status}`);
        }

        return true;

    } catch (error) {
        console.error("Error sending coupon to PHP:", error);
        return false;
    }
}

/**
 * Fetch coupons from PHP endpoint (GET)
 */
export async function getStoredCoupons(shopDomain = "") {
    if (!shopDomain) {
        console.warn("getStoredCoupons: No shopDomain provided");
        return [];
    }

    try {
        const url = `${PHP_ENDPOINT}?shopdomain=${encodeURIComponent(shopDomain)}`;
        console.log("Fetching coupons from PHP:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "ngrok-skip-browser-warning": "true"
            }
        });

        if (!response.ok) {
            throw new Error(`PHP GET returned status ${response.status}`);
        }

        const result = await response.json();

        if (result.status === "success" && Array.isArray(result.data)) {
            // Map PHP response fields (internal_id) to id field used by Remix
            return result.data.map(item => ({
                ...item,
                id: item.internal_id || item.id || `php_${item.shopify_id?.split('/').pop() || Date.now()}`,
            }));
        }

        console.warn("PHP GET returned success but no data array:", result);
        return [];
    } catch (error) {
        console.error("Error fetching coupons from PHP:", error);
        return [];
    }
}


// ===============================
// Coupon Preparation Logic
// ===============================

/**
 * Prepare coupon for storage (now just returns processed object)
 */
export async function storeCoupon(couponData) {
    const newCoupon = {
        ...couponData,
        id: couponData.id || `sample_${Date.now()}`,
        createdAt: new Date().toISOString()
    };

    console.log("------------------------------------------");
    console.log("[COUPON PREPARED FOR SYNC]");
    console.log(JSON.stringify(newCoupon, null, 2));
    console.log("------------------------------------------");

    return newCoupon;
}

// ===============================
// API Loader (GET) Handler
// ===============================

export async function loader({ request }) {
    const url = new URL(request.url);
    const shopdomain = url.searchParams.get("shopdomain") || url.searchParams.get("shop") || "";

    try {
        const coupons = await getStoredCoupons(shopdomain);
        return Response.json({ coupons }, { status: 200 });
    } catch (error) {
        console.error("Error loading coupons:", error);
        return Response.json(
            { error: "Failed to load coupons", details: error.message },
            { status: 500 }
        );
    }
}

// ===============================
// API Action (POST) Handler
// ===============================

export async function action({ request }) {

    if (request.method !== "POST") {
        return Response.json(
            { error: "Method not allowed" },
            { status: 405 }
        );
    }

    try {
        const couponData = await request.json();

        if (!couponData || Object.keys(couponData).length === 0) {
            return Response.json(
                { error: "Invalid or empty JSON payload" },
                { status: 400 }
            );
        }

        // 1. Store locally
        const storedCoupon = await storeCoupon(couponData);

        // 2. Send to PHP
        const phpSuccess = await sendCouponToPHP(storedCoupon);

        if (!phpSuccess) {
            console.warn("Coupon stored locally but PHP sync failed");
        }

        // 3. Return response
        return Response.json(storedCoupon, { status: 201 });

    } catch (error) {

        console.error("Create coupon error:", error);

        return Response.json(
            {
                error: "Failed to process request",
                details: error.message
            },
            { status: 500 }
        );
    }
}

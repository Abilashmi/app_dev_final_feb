import fs from "fs/promises";
import path from "path";

const DB_PATH = path.join(process.cwd(), "create_coupon-sample");

// Helper to read the "stored" coupons
async function getStoredCoupons() {
    try {
        const data = await fs.readFile(DB_PATH, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper to write/update coupons
async function storeCoupon(couponData) {
    const coupons = await getStoredCoupons();
    const newCoupon = {
        id: new Date().getTime().toString(), // Simple ID generation
        createdAt: new Date().toISOString(),
        ...couponData,
    };
    coupons.push(newCoupon);
    await fs.writeFile(DB_PATH, JSON.stringify(coupons, null, 2));
    return newCoupon;
}

export const loader = async () => {
    const coupons = await getStoredCoupons();
    return new Response(JSON.stringify(coupons), {
        headers: { "Content-Type": "application/json" },
    });
};

export const action = async ({ request }) => {
    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const data = await request.json();
        const savedCoupon = await storeCoupon(data);
        return new Response(JSON.stringify({ success: true, coupon: savedCoupon }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error storing coupon:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

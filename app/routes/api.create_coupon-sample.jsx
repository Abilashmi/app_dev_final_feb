import fs from "fs/promises";
import path from "path";

// ===============================
// Configuration
// ===============================

const SAMPLE_DATA_PATH = path.resolve("create_coupon-sample.json");

const PHP_ENDPOINT =
    "https://prefixal-turbanlike-britt.ngrok-free.dev/cartdrawer/save_coupon.php";


// ===============================
// File Helpers
// ===============================

/**
 * Read stored coupons from file
 */
async function getSampleData() {
    try {
        const data = await fs.readFile(SAMPLE_DATA_PATH, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }

        console.error("Error reading coupon file:", error);
        return [];
    }
}

/**
 * Write coupons to file
 */
async function writeSampleData(data) {
    try {
        await fs.writeFile(
            SAMPLE_DATA_PATH,
            JSON.stringify(data, null, 2),
            "utf-8"
        );
        return true;
    } catch (error) {
        console.error("Error writing coupon file:", error);
        return false;
    }
}


// ===============================
// PHP Forwarding
// ===============================

/**
 * Send coupon to PHP endpoint
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

        console.log("---------- PHP RESPONSE ----------");
        console.log(text);
        console.log("----------------------------------");

        if (!response.ok) {
            throw new Error(`PHP returned status ${response.status}`);
        }

        return true;

    } catch (error) {
        console.error("Error sending coupon to PHP:", error);
        return false;
    }
}


// ===============================
// Coupon Storage Logic
// ===============================

export async function getStoredCoupons() {
    return await getSampleData();
}

/**
 * Store coupon locally
 */
export async function storeCoupon(couponData) {
    const coupons = await getSampleData();

    const newCoupon = {
        ...couponData,
        id: couponData.id || `sample_${Date.now()}`,
        createdAt: new Date().toISOString()
    };

    coupons.push(newCoupon);

    const written = await writeSampleData(coupons);

    if (!written) {
        throw new Error("Failed to write coupon data");
    }

    console.log("------------------------------------------");
    console.log("[COUPON STORED]");
    console.log(JSON.stringify(newCoupon, null, 2));
    console.log("------------------------------------------");

    return newCoupon;
}

// ===============================
// API Loader (GET) Handler
// ===============================

export async function loader() {
    try {
        const coupons = await getSampleData();
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

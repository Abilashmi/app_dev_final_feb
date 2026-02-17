import fs from "fs/promises";
import path from "path";

// Define the path to the sample data file
const SAMPLE_DATA_PATH = path.resolve("create_coupon-sample.json");

/**
 * Helper to read the sample data file.
 * Returns an empty array if file read fails.
 */
async function getSampleData() {
    try {
        const data = await fs.readFile(SAMPLE_DATA_PATH, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return empty array
            return [];
        }
        console.error("Error reading sample coupon data:", error);
        return [];
    }
}

/**
 * Helper to write to the sample data file.
 */
async function writeSampleData(data) {
    try {
        await fs.writeFile(SAMPLE_DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
        return true;
    } catch (error) {
        console.error("Error writing sample coupon data:", error);
        return false;
    }
}

/**
 * Fetches all stored sample coupons.
 * @returns {Promise<Array>} List of coupons
 */
export async function getStoredCoupons() {
    return await getSampleData();
}

/**
 * Stores a new coupon in the sample data file.
 * @param {Object} couponData - The coupon object to store
 * @returns {Promise<Object>} The stored coupon with ID
 */
export async function storeCoupon(couponData) {
    const coupons = await getSampleData();

    const newCoupon = {
        ...couponData,
        id: couponData.id || `sample_${Date.now()}`,
        createdAt: new Date().toISOString(),
    };

    coupons.push(newCoupon);
    await writeSampleData(coupons);

    console.log("------------------------------------------");
    console.log("[api.create_coupon-sample] STORED COUPON:");
    console.log(JSON.stringify(newCoupon, null, 2));
    console.log("------------------------------------------");

    return newCoupon;
}

/**
 * Handle POST requests to create a new coupon.
 */
export async function action({ request }) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const couponData = await request.json();

        if (!couponData || Object.keys(couponData).length === 0) {
            return Response.json({ error: "Invalid or empty JSON payload" }, { status: 400 });
        }

        const storedCoupon = await storeCoupon(couponData);

        return Response.json(storedCoupon, { status: 201 });
    } catch (error) {
        console.error("Error processing create coupon request:", error);
        return Response.json({ error: "Failed to process request", details: error.message }, { status: 500 });
    }
}

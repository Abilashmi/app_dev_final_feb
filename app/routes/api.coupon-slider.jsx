import { promises as fs } from "fs";
import path from "path";

// JSON file path for persisting Coupon data
const DATA_FILE = path.resolve("coupon-slider-data.json");

// Default Coupon Data
const DEFAULT_COUPON_DATA = {
    activeTemplate: "template1",
    selectedActiveCoupons: [],
    displayCondition: "all",
    productHandles: [],
    collectionHandles: [],
    displayTags: [],
    templates: {
        template1: {
            name: "Classic Banner",
            headingText: "GET 10% OFF!",
            subtextText: "Apply at checkout for savings",
            bgColor: "#ffffff",
            textColor: "#111827",
            accentColor: "#3b82f6",
            buttonColor: "#3b82f6",
            buttonTextColor: "#ffffff",
            borderRadius: 12,
            fontSize: 16,
            padding: 16,
        },
        template2: {
            name: "Minimal Card",
            headingText: "SPECIAL OFFER",
            subtextText: "Free shipping on orders over ₹500",
            bgColor: "#f9fafb",
            textColor: "#374151",
            accentColor: "#10b981",
            buttonColor: "#10b981",
            buttonTextColor: "#ffffff",
            borderRadius: 8,
            fontSize: 14,
            padding: 14,
        },
        template3: {
            name: "Bold & Vibrant",
            headingText: "FLASH SALE!",
            subtextText: "Use code: BOLD25 for extra 25% OFF",
            bgColor: "#4f46e5",
            textColor: "#ffffff",
            accentColor: "#f59e0b",
            buttonColor: "#f59e0b",
            buttonTextColor: "#111827",
            borderRadius: 16,
            fontSize: 18,
            padding: 20,
        },
    },
};

// ---------- Helpers ----------

// Read stored data
async function readStoredData() {
    try {
        const raw = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(raw);
    } catch (err) {
        return DEFAULT_COUPON_DATA;
    }
}

// Write stored data
async function writeStoredData(data) {
    await fs.writeFile(
        DATA_FILE,
        JSON.stringify(data, null, 2),
        "utf-8"
    );
}

// ---------- LOADER ----------

export async function loader() {
    const storedData = await readStoredData();

    return Response.json(
        {
            success: true,
            config: storedData,
        },
        { status: 200 }
    );
}

// ---------- ACTION ----------

export async function action({ request }) {

    if (request.method !== "POST") {
        return Response.json(
            { error: "Method not allowed" },
            { status: 405 }
        );
    }

    try {
        const data = await request.json();
        const { actionType, shop } = data;

        if (actionType !== "saveCouponConfig") {
            return Response.json(
                { success: false, error: "Invalid actionType" },
                { status: 400 }
            );
        }

        const {
            activeTemplate,
            templateData,
            selectedActiveCoupons,
            couponOverrides, // Received from frontend
            displayCondition,
            productHandles,
            collectionHandles,
            displayTags,
        } = data;

        // Parse templates
        const templates = typeof templateData === "string"
            ? JSON.parse(templateData)
            : templateData;

        // Parse overrides
        const overrides = typeof couponOverrides === "string"
            ? JSON.parse(couponOverrides)
            : (couponOverrides || {});

        // Get active template config
        const activeTpl = templates[activeTemplate] || {};

        // Parse coupons to ensure we save names
        const rawCoupons = selectedActiveCoupons || [];
        const selectedCouponNames = rawCoupons.map(coupon => {
            if (typeof coupon === 'object' && coupon !== null) {
                return coupon.title || coupon.code || coupon.name || JSON.stringify(coupon);
            }
            return coupon;
        });

        // Determine EFFECTIVE configuration for "textContent", "color", "styling"
        // If there's an override for the FIRST selected coupon, we use that as the "saved" visual state.
        // This aligns with user expectation: "See it is not showing what i saved" (when they edited an override).
        let effectiveTpl = { ...activeTpl };

        // Use the first active coupon to check for overrides
        const firstCouponId = rawCoupons.length > 0
            ? (typeof rawCoupons[0] === 'object' ? rawCoupons[0].id : rawCoupons[0])
            : null;

        if (firstCouponId && overrides[firstCouponId]) {
            effectiveTpl = { ...effectiveTpl, ...overrides[firstCouponId] };
        }

        // Extract structured data from the EFFECTIVE template
        const textContent = {
            headingText: effectiveTpl.headingText,
            subtext: effectiveTpl.subtextText // Note: subtextText vs subtext
        };

        const color = {
            bgColor: effectiveTpl.bgColor,
            textColor: effectiveTpl.textColor,
            accent: effectiveTpl.accentColor,
            buttonColor: effectiveTpl.buttonColor,
            buttonText: effectiveTpl.buttonTextColor
        };

        const styling = {
            borderRadius: effectiveTpl.borderRadius,
            fontSize: effectiveTpl.fontSize,
            padding: effectiveTpl.padding
        };

        // Parse display condition data
        const parsedDisplayCondition = displayCondition || "all";
        const parsedProductHandles = Array.isArray(productHandles) ? productHandles : [];
        const parsedCollectionHandles = Array.isArray(collectionHandles) ? collectionHandles : [];
        const parsedDisplayTags = Array.isArray(displayTags) ? displayTags : [];

        const newConfig = {
            activeTemplate,
            templates,
            // Save IDs for frontend compatibility
            selectedActiveCoupons: rawCoupons.map(c => (typeof c === 'object' && c !== null) ? c.id : c),
            // New saved fields
            selectedTemplate: activeTemplate,
            selectedCouponNames,
            textContent,
            color,
            styling,
            couponOverrides: overrides, // Save overrides to config
            // Display condition fields
            displayCondition: parsedDisplayCondition,
            productHandles: parsedProductHandles,
            collectionHandles: parsedCollectionHandles,
            displayTags: parsedDisplayTags,
        };

        // Save locally
        await writeStoredData(newConfig);

        // ---------- SEND TO PHP ENDPOINT ----------
        try {
            const phpResponse = await fetch(
                "https://prefixal-turbanlike-britt.ngrok-free.dev/cartdrawer/test2.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        shop,
                        // Send the full enhanced config
                        ...newConfig
                    }),
                }
            );

            const phpResult = await phpResponse.text();
            console.log("PHP Response:", phpResult);

        } catch (err) {
            console.error("Error sending data to PHP:", err);
        }

        // ---------- LOGGING ----------
        console.log("==========================================");
        console.log("[SAVED] COUPON CONFIGURATION");
        console.log("Shop:", shop);

        console.log("Selected Template ID:", activeTemplate);
        console.log("Active Coupons (IDs/Objs):", rawCoupons);
        console.log("Active Coupon Names:", selectedCouponNames);

        console.log("Text Content:", textContent);
        console.log("Color:", color);
        console.log("Styling:", styling);
        console.log("Display Condition:", parsedDisplayCondition);
        if (parsedDisplayCondition === "product_handle") console.log("Product Handles:", parsedProductHandles);
        if (parsedDisplayCondition === "collection_handle") console.log("Collection Handles:", parsedCollectionHandles);
        if (parsedDisplayCondition === "tag") console.log("Display Tags:", parsedDisplayTags);
        console.log("==========================================");

        return Response.json(
            {
                success: true,
                message: "Coupon configuration saved successfully!",
                shop,
                config: newConfig,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Coupon API Error:", error);

        return Response.json(
            {
                success: false,
                error: "Invalid JSON or internal error",
            },
            { status: 400 }
        );
    }
}

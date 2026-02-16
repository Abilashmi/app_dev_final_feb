import { promises as fs } from "fs";
import path from "path";

// JSON file path for persisting Coupon data
const DATA_FILE = path.resolve("coupon-slider-data.json");

// Default Coupon Data
const DEFAULT_COUPON_DATA = {
    activeTemplate: "template1",
    selectedActiveCoupons: [],
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

// --- Helper: Read stored data from JSON file ---
async function readStoredData() {
    try {
        const raw = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(raw);
    } catch (err) {
        return DEFAULT_COUPON_DATA;
    }
}

// --- Helper: Write data to JSON file ---
async function writeStoredData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// --- LOADER: Return stored Coupon data ---
export async function loader() {
    const storedData = await readStoredData();
    return Response.json({
        success: true,
        config: storedData
    }, { status: 200 });
}

// --- ACTION: Save Coupon configuration ---
export async function action({ request }) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const data = await request.json();
        const { actionType, shop } = data;

        if (actionType !== "saveCouponConfig") {
            return Response.json({ success: false, error: "Invalid actionType" }, { status: 400 });
        }

        const { activeTemplate, templateData, selectedActiveCoupons } = data;

        const newConfig = {
            activeTemplate,
            templates: typeof templateData === 'string' ? JSON.parse(templateData) : templateData,
            selectedActiveCoupons: selectedActiveCoupons || []
        };

        await writeStoredData(newConfig);

        // Logging
        console.log("==========================================");
        console.log("[SAVED] COUPON CONFIGURATION");
        console.log("Shop:", shop);
        const activeTpl = newConfig.templates[newConfig.activeTemplate];
        console.log("Selected Template ID:", newConfig.activeTemplate);
        console.log("Active Coupons:", newConfig.selectedActiveCoupons);
        console.log("Customize Fields:");
        console.log(" - Heading Text:", activeTpl.headingText);
        console.log(" - Subtext:", activeTpl.subtextText);
        console.log(" - Background:", activeTpl.bgColor);
        console.log(" - Text Color:", activeTpl.textColor);
        console.log(" - Accent Color:", activeTpl.accentColor);
        console.log(" - Button Color:", activeTpl.buttonColor);
        console.log(" - Button Text:", activeTpl.buttonTextColor);
        console.log(" - Border Radius:", activeTpl.borderRadius);
        console.log(" - Font Size:", activeTpl.fontSize);
        console.log(" - Padding:", activeTpl.padding);
        console.log("==========================================");

        return Response.json({
            success: true,
            message: "Coupon configuration saved successfully!",
            shop,
            config: newConfig
        }, { status: 200 });

    } catch (error) {
        console.error("Coupon API Error:", error);
        return Response.json(
            { success: false, error: "Invalid JSON or internal error" },
            { status: 400 }
        );
    }
}

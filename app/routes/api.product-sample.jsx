import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.resolve("fbt-product-data.json");

/* ---------------- DEFAULT CONFIGS ---------------- */

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

const DEFAULT_FBT_DATA = {
    activeTemplate: "fbt1",
    mode: "manual",
    openaiKey: "",
    templates: {
        fbt1: {
            name: "Classic Grid",
            layout: "horizontal",
            interactionType: "classic",
            bgColor: "#ffffff",
            textColor: "#111827",
            priceColor: "#059669",
            buttonColor: "#111827",
            buttonTextColor: "#ffffff",
            borderColor: "#e5e7eb",
            borderRadius: 8,
            showPrices: true,
            showAddAllButton: true,
        },
        fbt2: {
            name: "Modern Cards",
            layout: "horizontal",
            interactionType: "bundle",
            bgColor: "#f9fafb",
            textColor: "#374151",
            priceColor: "#dc2626",
            buttonColor: "#4f46e5",
            buttonTextColor: "#ffffff",
            borderColor: "#d1d5db",
            borderRadius: 12,
            showPrices: true,
            showAddAllButton: true,
        },
        fbt3: {
            name: "Vertical List",
            layout: "vertical",
            interactionType: "quickAdd",
            bgColor: "#ffffff",
            textColor: "#1f2937",
            priceColor: "#2563eb",
            buttonColor: "#10b981",
            buttonTextColor: "#ffffff",
            borderColor: "#f3f4f6",
            borderRadius: 4,
            showPrices: true,
            showAddAllButton: true,
        },
    },
    manualRules: [],
};

/* ---------------- FILE HELPERS ---------------- */

async function readStoredData() {
    try {
        const raw = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(raw);
    } catch {
        return {
            couponSlider: DEFAULT_COUPON_DATA,
            fbt: DEFAULT_FBT_DATA
        };
    }
}

async function writeStoredData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/* ---------------- LOADER ---------------- */

export async function loader() {
    const storedData = await readStoredData();

    return Response.json({
        success: true,
        fbt: storedData.fbt || DEFAULT_FBT_DATA
    });
}

/* ---------------- ACTION ---------------- */

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

        if (!actionType) {
            return Response.json(
                { success: false, error: "Missing actionType" },
                { status: 400 }
            );
        }

        const storedData = await readStoredData();

        if (actionType === "saveFBTConfig") {

            const {
                activeTemplate,
                templateData,
                mode,
                openaiKey,
                configData
            } = data;

            storedData.fbt = {
                activeTemplate,
                templates: typeof templateData === "string"
                    ? JSON.parse(templateData)
                    : templateData,
                mode,
                openaiKey: openaiKey || "",
                manualRules: typeof configData === "string"
                    ? JSON.parse(configData)
                    : (configData || [])
            };

            await writeStoredData(storedData);

            /* -------- SEND DATA TO PHP ENDPOINT -------- */

            try {
                const response = await fetch(
                    "https://prefixal-turbanlike-britt.ngrok-free.dev/cartdrawer/fbt.php",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            shop,
                            fbt: storedData.fbt
                        })
                    }
                );

                const result = await response.text();
                console.log("[FBT PUSH RESPONSE]", result);

            } catch (pushError) {
                console.error("[FBT PUSH FAILED]", pushError);
            }

        } else {
            return Response.json(
                { success: false, error: "Unsupported actionType" },
                { status: 400 }
            );
        }

        console.log("==========================================");
        console.log("[SAVED] FBT CONFIGURATION");
        console.log("Shop:", shop);
        console.log("FBT Config:", storedData.fbt);
        console.log("==========================================");

        return Response.json({
            success: true,
            message: "FBT configuration saved successfully!",
            shop,
            config: storedData.fbt
        });

    } catch (error) {
        console.error("Product Sample API Error:", error);

        return Response.json(
            { success: false, error: "Invalid JSON or internal error" },
            { status: 400 }
        );
    }
}

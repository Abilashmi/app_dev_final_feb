import { promises as fs } from "fs";
import path from "path";

const EXTERNAL_API = "https://prefixal-turbanlike-britt.ngrok-free.dev/cartdrawer/test2.php";

const DATA_FILE = path.resolve("coupon-slider-data.json");

/* ---------------- DEFAULTS ---------------- */
const DEFAULT_DATA = {
    activeTemplate: "template1",
    templates: {
        template1: {
            name: "Classic Banner",
            headingText: "GET 10% OFF!",
            subtextText: "Use code: SAVE10 at checkout",
            bgColor: "#ffffff",
            textColor: "#1a1a1a",
            accentColor: "#2563eb",
            buttonColor: "#2563eb",
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
    selectedActiveCoupons: [],
    couponOverrides: {},
};

/* ---------------- FILE HELPERS ---------------- */

async function readData() {
    try {
        const raw = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(raw);
    } catch {
        return { ...DEFAULT_DATA };
    }
}

async function writeData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

/* ---------------- LOADER (GET) ---------------- */

export async function loader() {
    const data = await readData();
    return new Response(JSON.stringify({ success: true, config: data }), {
        headers: { "Content-Type": "application/json" },
    });
}

/* ---------- TRANSFORM TO DB SCHEMA ---------- */

const STYLE_KEYS = ["bgColor", "textColor", "accentColor", "buttonColor", "buttonTextColor", "borderRadius", "fontSize", "padding"];
const CONDITION_KEYS = ["displayCondition", "productHandles", "collectionHandles", "displayTags"];

function transformForDB(data, shopDomain) {
    const templates = data.templates || {};
    const overrides = data.couponOverrides || {};
    const selectedCoupons = data.selectedActiveCoupons || [];

    // Build per-template DB object
    function buildTemplate(tplKey) {
        const tpl = templates[tplKey] || {};

        // Separate styles
        const styles = {};
        for (const k of STYLE_KEYS) {
            styles[k] = tpl[k] !== undefined ? tpl[k] : "";
        }

        // Only include coupons & overrides if this is the active template
        const isActive = data.activeTemplate === tplKey;
        const tplCoupons = isActive ? selectedCoupons : [];

        // Build couponConditions and couponStyles from overrides for selected coupons
        const couponConditions = [];
        const couponStyles = {};

        for (const couponId of tplCoupons) {
            const ov = overrides[couponId] || {};

            // Conditions
            const condition = {
                couponId,
                displayCondition: ov.displayCondition || "all",
            };
            if (ov.productHandles?.length) condition.productHandles = ov.productHandles;
            if (ov.collectionHandles?.length) condition.collectionHandles = ov.collectionHandles;
            if (ov.displayTags?.length) condition.displayTags = ov.displayTags;
            couponConditions.push(condition);

            // Style overrides (only non-condition, non-style-key overrides = text overrides + color overrides)
            const styleOv = {};
            for (const [k, v] of Object.entries(ov)) {
                if (!CONDITION_KEYS.includes(k)) {
                    styleOv[k] = v;
                }
            }
            if (Object.keys(styleOv).length > 0) {
                couponStyles[couponId] = styleOv;
            }
        }

        return {
            name: tpl.name || "",
            headingText: tpl.headingText || "",
            subtextText: tpl.subtextText || "",
            styles,
            couponConditions,
            selectedCoupons: tplCoupons,
            couponStyles,
        };
    }

    return {
        id: "",
        shopDomain: shopDomain || "",
        template1: buildTemplate("template1"),
        template2: buildTemplate("template2"),
        template3: buildTemplate("template3"),
        selectedTemplate: data.activeTemplate || "",
        selectedCouponsGlobal: selectedCoupons,
    };
}

/* ---------------- ACTION (POST) ---------------- */

export async function action({ request }) {
    try {
        const body = await request.json();

        // Read existing data
        const existing = await readData();

        // Merge incoming fields onto existing data
        const updated = {
            ...existing,
            ...(body.activeTemplate !== undefined && { activeTemplate: body.activeTemplate }),
            ...(body.templateData !== undefined && { templates: { ...existing.templates, ...body.templateData } }),
            ...(body.selectedActiveCoupons !== undefined && { selectedActiveCoupons: body.selectedActiveCoupons }),
            ...(body.couponOverrides !== undefined && { couponOverrides: body.couponOverrides }),
        };

        // Remove stale legacy top-level fields
        delete updated.displayCondition;
        delete updated.productHandles;
        delete updated.collectionHandles;
        delete updated.displayTags;
        delete updated.selectedTemplate;
        delete updated.selectedCouponNames;
        delete updated.textContent;
        delete updated.color;
        delete updated.styling;

        await writeData(updated);

        // Transform to DB schema and send to external PHP endpoint
        const shopDomain = body.shop || "";
        const dbPayload = transformForDB(updated, shopDomain);

        try {
            const extRes = await fetch(EXTERNAL_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dbPayload),
            });
            const extBody = await extRes.text();
            console.log(`External API response [${extRes.status}]:`, extBody);
        } catch (extErr) {
            console.error("Failed to send to external API:", extErr.message);
        }

        return new Response(
            JSON.stringify({ success: true, config: updated }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Coupon slider action error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

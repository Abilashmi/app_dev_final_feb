import { promises as fs } from "fs";
import path from "path";

const EXTERNAL_API = "https://spread-monitored-chronicles-ray.trycloudflare.com/cartdrawer/save_coupon_slider_widget.php";

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

/* ---------- TRANSFORM FROM DB RESPONSE ---------- */

function transformFromDB(dbData) {
    // Parse style JSON strings back into objects
    const parseJSON = (val) => {
        if (!val) return {};
        if (typeof val === "object") return val;
        try { return JSON.parse(val); } catch { return {}; }
    };
    const parseJSONArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try { return JSON.parse(val); } catch { return []; }
    };

    const temp1Style = parseJSON(dbData.temp1DefaultStyle);
    const temp2Style = parseJSON(dbData.temp2DefaultStyle);
    const temp3Style = parseJSON(dbData.temp3DefaultStyle);

    const temp1CouponStyle = parseJSON(dbData.temp1CouponStyle);
    const temp2CouponStyle = parseJSON(dbData.temp2CouponStyle);
    const temp3CouponStyle = parseJSON(dbData.temp3CouponStyle);

    const temp1CouponCondition = parseJSONArray(dbData.temp1CouponCondition);
    const temp2CouponCondition = parseJSONArray(dbData.temp2CouponCondition);
    const temp3CouponCondition = parseJSONArray(dbData.temp3CouponCondition);

    const selectedCoupons = parseJSONArray(dbData.selectedTemplateCoupon);

    const activeTemplate = dbData.selectedTemplate || "template1";

    // Build templates object
    const templates = {
        template1: {
            name: "Classic Banner",
            headingText: DEFAULT_DATA.templates.template1.headingText,
            subtextText: DEFAULT_DATA.templates.template1.subtextText,
            ...temp1Style,
        },
        template2: {
            name: "Minimal Card",
            headingText: DEFAULT_DATA.templates.template2.headingText,
            subtextText: DEFAULT_DATA.templates.template2.subtextText,
            ...temp2Style,
        },
        template3: {
            name: "Bold & Vibrant",
            headingText: DEFAULT_DATA.templates.template3.headingText,
            subtextText: DEFAULT_DATA.templates.template3.subtextText,
            ...temp3Style,
        },
    };

    // Build couponOverrides by merging style overrides and conditions
    // Pick the coupon styles & conditions for the active template
    const couponStyleMap = {
        template1: temp1CouponStyle,
        template2: temp2CouponStyle,
        template3: temp3CouponStyle,
    };
    const couponConditionMap = {
        template1: temp1CouponCondition,
        template2: temp2CouponCondition,
        template3: temp3CouponCondition,
    };

    const activeCouponStyles = couponStyleMap[activeTemplate] || {};
    const activeCouponConditions = couponConditionMap[activeTemplate] || [];

    const couponOverrides = {};
    for (const couponId of selectedCoupons) {
        const styleOv = activeCouponStyles[couponId] || {};
        const conditionEntry = activeCouponConditions.find(c => c.couponId === couponId) || {};

        const override = { ...styleOv };
        if (conditionEntry.displayCondition) override.displayCondition = conditionEntry.displayCondition;
        if (conditionEntry.productHandles?.length) override.productHandles = conditionEntry.productHandles;
        if (conditionEntry.collectionHandles?.length) override.collectionHandles = conditionEntry.collectionHandles;
        if (conditionEntry.displayTags?.length) override.displayTags = conditionEntry.displayTags;

        if (Object.keys(override).length > 0) {
            couponOverrides[couponId] = override;
        }
    }

    return {
        activeTemplate,
        templates,
        selectedActiveCoupons: selectedCoupons,
        couponOverrides,
    };
}

/* ---------------- LOADER (GET) ---------------- */

export async function loader({ request }) {
    const url = new URL(request.url);
    const shopDomain = url.searchParams.get("shop") || "";

    // If no shopDomain provided, fall back to local defaults
    if (!shopDomain) {
        console.warn("No shop domain provided to coupon-slider loader, returning defaults");
        return new Response(JSON.stringify({ success: true, config: { ...DEFAULT_DATA } }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const apiUrl = `${EXTERNAL_API}?shopdomain=${encodeURIComponent(shopDomain)}`;
        console.log("Fetching coupon slider config from:", apiUrl);

        const extRes = await fetch(apiUrl, {
            method: "GET",
            headers: { "ngrok-skip-browser-warning": "true" },
        });

        const extBody = await extRes.json();
        console.log(`External API GET response [${extRes.status}]:`, JSON.stringify(extBody));

        if (extBody.status === "success" && extBody.data) {
            const config = transformFromDB(extBody.data);
            return new Response(JSON.stringify({ success: true, config }), {
                headers: { "Content-Type": "application/json" },
            });
        } else {
            console.warn("External API returned non-success, using defaults");
            return new Response(JSON.stringify({ success: true, config: { ...DEFAULT_DATA } }), {
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.error("Failed to fetch from external API:", error.message);
        return new Response(JSON.stringify({ success: true, config: { ...DEFAULT_DATA } }), {
            headers: { "Content-Type": "application/json" },
        });
    }
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
        // Get default styles for this template
        const defaultTpl = (DEFAULT_DATA.templates && DEFAULT_DATA.templates[tplKey]) || {};

        // Merge default styles with user styles (user styles take precedence)
        const mergedStyles = {};
        for (const k of STYLE_KEYS) {
            mergedStyles[k] = tpl[k] !== undefined ? tpl[k] : defaultTpl[k] !== undefined ? defaultTpl[k] : "";
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
            name: tpl.name || defaultTpl.name || "",
            headingText: tpl.headingText || defaultTpl.headingText || "",
            subtextText: tpl.subtextText || defaultTpl.subtextText || "",
            styles: JSON.stringify(mergedStyles),
            couponConditions: JSON.stringify(couponConditions),
            selectedCoupons: JSON.stringify(tplCoupons),
            couponStyles: JSON.stringify(couponStyles),
        };
    }

    return {
        id: "",
        shopDomain: shopDomain || "",
        template1: buildTemplate("template1"),
        template2: buildTemplate("template2"),
        template3: buildTemplate("template3"),
        selectedTemplate: data.activeTemplate || "",
        selectedCouponsGlobal: JSON.stringify(selectedCoupons),
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
        console.log("Outgoing DB payload:", JSON.stringify(dbPayload, null, 2));

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

import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.resolve("coupon-slider-data.json");
const CONDITION_KEYS = ["displayCondition", "productHandles", "collectionHandles", "displayTags"];

async function readData() {
    try {
        const raw = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function buildCouponStyles(allTemplateOverrides, tplKey) {
    const tplOverrides = allTemplateOverrides[tplKey] || {};
    const couponStyles = {};
    for (const [couponId, ov] of Object.entries(tplOverrides)) {
        const styleOv = {};
        for (const [k, v] of Object.entries(ov)) {
            if (!CONDITION_KEYS.includes(k) && !["label", "description"].includes(k)) {
                styleOv[k] = v;
            }
        }
        if (Object.keys(styleOv).length > 0) couponStyles[couponId] = styleOv;
    }
    return couponStyles;
}

function buildCouponConditions(allTemplateOverrides, tplKey) {
    const tplOverrides = allTemplateOverrides[tplKey] || {};
    return Object.entries(tplOverrides)
        .filter(([, ov]) => ov.displayCondition)
        .map(([couponId, ov]) => {
            const cond = { couponId, displayCondition: ov.displayCondition };
            if (ov.productHandles?.length) cond.productHandles = ov.productHandles;
            if (ov.collectionHandles?.length) cond.collectionHandles = ov.collectionHandles;
            if (ov.displayTags?.length) cond.displayTags = ov.displayTags;
            return cond;
        });
}

export async function loader() {
    const config = await readData();

    const activeTemplate = config.activeTemplate || "template1";
    const selectedActiveCoupons = config.selectedActiveCoupons || [];
    const allTemplateOverrides = config.allTemplateOverrides || {};
    const templates = config.templates || {};
    const title = config.title || {};

    const activeOverrides = allTemplateOverrides[activeTemplate] || {};
    const selectedTemplateCoupon = selectedActiveCoupons.map(id => {
        const ov = activeOverrides[id] || {};
        const item = { id };
        if (ov.couponCode && !/^\d+$/.test(ov.couponCode)) item.code = ov.couponCode;
        if (ov.headingText !== undefined) item.h = ov.headingText;
        if (ov.subtextText !== undefined) item.s = ov.subtextText;
        return item;
    });

    const data = {
        selectedTemplate: activeTemplate,
        selectedTemplateCoupon,
        temp1DefaultStyle: { ...(templates.template1 || {}), title },
        temp2DefaultStyle: { ...(templates.template2 || {}), title },
        temp3DefaultStyle: { ...(templates.template3 || {}), title },
        temp1CouponStyle: buildCouponStyles(allTemplateOverrides, "template1"),
        temp2CouponStyle: buildCouponStyles(allTemplateOverrides, "template2"),
        temp3CouponStyle: buildCouponStyles(allTemplateOverrides, "template3"),
        temp1CouponCondition: buildCouponConditions(allTemplateOverrides, "template1"),
        temp2CouponCondition: buildCouponConditions(allTemplateOverrides, "template2"),
        temp3CouponCondition: buildCouponConditions(allTemplateOverrides, "template3"),
        updated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ status: "success", data }), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
}

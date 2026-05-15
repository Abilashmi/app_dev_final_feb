import { promises as fs } from "fs";
import path from "path";

const LOCAL_DATA_FILE = path.resolve("cartdrawer-config-data.json");

async function readLocalConfigMap() {
    try {
        const raw = await fs.readFile(LOCAL_DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export async function loader({ request }) {
    const url = new URL(request.url);
    const shopDomain = (url.searchParams.get("shopdomain") || url.searchParams.get("shop") || "").toLowerCase();

    const localMap = await readLocalConfigMap();

    // Find by exact shop key, or fall back to first available entry
    const shopData = (shopDomain && localMap[shopDomain])
        ? localMap[shopDomain]
        : Object.values(localMap)[0] || null;

    if (!shopData) {
        return new Response(
            JSON.stringify({ status: "error", message: "No config found for this shop" }),
            { status: 404, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
    }

    // The local JSON already stores data in the exact PHP API format
    // (progress_data, coupon_data, upsell_data as JSON strings, progress_status etc. as ints)
    // so pass it through directly as the "data" field.
    return new Response(JSON.stringify({ status: "success", data: shopData }), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
}

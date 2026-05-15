import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.resolve("fbt-product-data.json");

export async function loader() {
    try {
        const raw = await fs.readFile(DATA_FILE, "utf-8");
        const fullData = JSON.parse(raw);
        const fbt = fullData.fbt || {};

        return new Response(JSON.stringify({ status: "success", data: fbt }), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ status: "error", message: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

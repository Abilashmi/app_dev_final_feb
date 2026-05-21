export async function action({ request }) {
    // Accept click tracking events from the cart drawer extension
    // Just acknowledge — no storage needed in dev
    return new Response(JSON.stringify({ status: "ok" }), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
}

export async function loader() {
    return new Response(JSON.stringify({ status: "ok" }), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
}

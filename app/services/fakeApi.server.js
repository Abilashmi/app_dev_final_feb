/**
 * Simulates a backend API call for discount creation.
 * In a real application, this would be an external API request.
 */
export async function sendToFakeApi(data) {
    console.log("--- FAKE API CALL START ---");
    console.log("Endpoint: POST /api/v1/discounts");
    console.log("Payload:", JSON.stringify(data, null, 2));

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    console.log("Response: 201 Created");
    console.log("--- FAKE API CALL END ---");

    return {
        success: true,
        message: "Discount data synced to backend successfully.",
        backendId: `backend_${Math.random().toString(36).substr(2, 9)}`,
    };
}

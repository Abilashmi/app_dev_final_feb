import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Card,
    BlockStack,
    InlineStack,
    Text,
    Button,
    Banner,
    Spinner,
} from "@shopify/polaris";

function normalizeCurrentProduct(currentProduct) {
    if (!currentProduct || typeof currentProduct !== "object") return null;

    const title = typeof currentProduct.title === "string" ? currentProduct.title.trim() : "";
    const id = typeof currentProduct.id === "string" ? currentProduct.id.trim() : "";

    if (!title && !id) return null;

    const tags = Array.isArray(currentProduct.tags)
        ? currentProduct.tags.map((t) => String(t || "").trim()).filter(Boolean)
        : [];

    return {
        id,
        title,
        tags,
        category: typeof currentProduct.category === "string" ? currentProduct.category.trim() : (typeof currentProduct.productType === "string" ? currentProduct.productType.trim() : ""),
        vendor: typeof currentProduct.vendor === "string" ? currentProduct.vendor.trim() : "",
        price: currentProduct.price != null ? String(currentProduct.price).trim() : "",
        currencyCode: typeof currentProduct.currencyCode === "string" ? currentProduct.currencyCode.trim() : "",
    };
}

export default function AiUpsellSection({ currentProduct, limit = 4 }) {
    const normalizedProduct = useMemo(
        () => normalizeCurrentProduct(currentProduct),
        [currentProduct]
    );

    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [error, setError] = useState("");

    const abortRef = useRef(null);

    const safeLimit = useMemo(() => {
        const parsed = Number.parseInt(String(limit ?? ""), 10);
        if (!Number.isFinite(parsed)) return 4;
        return Math.min(5, Math.max(3, parsed));
    }, [limit]);

    const runFetch = useCallback(async ({ excludeTitles = [], cacheMode = "allow", mode = "initial" }) => {
        if (!normalizedProduct) return;

        if (abortRef.current) {
            try { abortRef.current.abort(); } catch (e) { void e; }
        }

        const controller = new AbortController();
        abortRef.current = controller;

        setError("");

        if (mode === "initial") {
            setLoading(true);
        } else {
            setRegenerating(true);
        }

        try {
            const res = await fetch("/api/ai-upsell", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    currentProduct: normalizedProduct,
                    limit: safeLimit,
                    excludeTitles,
                    cacheMode,
                    variationSeed: String(Date.now()),
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
                const msg = data?.error || `Request failed (${res.status})`;
                throw new Error(msg);
            }

            setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
        } catch (e) {
            if (e?.name === "AbortError") return;
            setError(e?.message || "Failed to generate suggestions");
        } finally {
            setLoading(false);
            setRegenerating(false);
        }
    }, [normalizedProduct, safeLimit]);

    useEffect(() => {
        if (!normalizedProduct) return;
        runFetch({ excludeTitles: [], cacheMode: "allow", mode: "initial" });

        return () => {
            if (abortRef.current) {
                try { abortRef.current.abort(); } catch (e) { void e; }
            }
        };
    }, [normalizedProduct, runFetch]);

    const handleRegenerate = useCallback(() => {
        const exclude = recommendations.map((r) => r?.title).filter(Boolean);
        runFetch({ excludeTitles: exclude, cacheMode: "bypass", mode: "regen" });
    }, [recommendations, runFetch]);

    const busy = loading || regenerating;

    return (
        <Card>
            <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                        <Text variant="headingMd" as="h2">Upsell Suggestions</Text>
                        <Text variant="bodySm" tone="subdued">
                            AI-generated recommendations (server-side).
                        </Text>
                    </BlockStack>
                    <Button
                        variant="secondary"
                        onClick={handleRegenerate}
                        disabled={!normalizedProduct || busy}
                        loading={regenerating}
                    >
                        Regenerate Suggestions
                    </Button>
                </InlineStack>

                {!normalizedProduct && (
                    <Banner tone="warning">
                        <p>Select or load a product to generate upsells.</p>
                    </Banner>
                )}

                {error && (
                    <Banner tone="critical">
                        <p>{error}</p>
                    </Banner>
                )}

                {loading && recommendations.length === 0 && (
                    <InlineStack gap="200" blockAlign="center">
                        <Spinner size="small" />
                        <Text variant="bodySm" tone="subdued">Generating suggestions…</Text>
                    </InlineStack>
                )}

                {recommendations.length > 0 && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "12px",
                        }}
                    >
                        {recommendations.map((rec, idx) => (
                            <Card key={`${rec?.title || "rec"}-${idx}`}>
                                <BlockStack gap="100">
                                    <Text variant="bodyMd" fontWeight="semibold">
                                        {rec?.title || "Suggested item"}
                                    </Text>
                                    <Text variant="bodySm" tone="subdued">
                                        {rec?.reason || "Pairs well with this item"}
                                    </Text>
                                    {rec?.description ? (
                                        <Text variant="bodySm">{rec.description}</Text>
                                    ) : null}
                                    {rec?.priceRange ? (
                                        <Text variant="bodySm" tone="subdued">{rec.priceRange}</Text>
                                    ) : null}
                                </BlockStack>
                            </Card>
                        ))}
                    </div>
                )}
            </BlockStack>
        </Card>
    );
}

AiUpsellSection.propTypes = {
    currentProduct: () => null,
    limit: () => null,
};

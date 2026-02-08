/**
 * Product Widgets Configuration Page
 * Features: Coupons and Frequently Bought Together tabs with templates and color pickers
 */

import React, { useState, useEffect, useCallback } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
    Page,
    Layout,
    Card,
    BlockStack,
    InlineStack,
    Text,
    Button,
    ButtonGroup,
    TextField,
    Badge,
    Checkbox,
    Banner,
    Divider,
    Tabs,
    Select,
    ChoiceList,
    Thumbnail,
    Box,
    Icon,
    Popover,
    ColorPicker,
    RangeSlider,
} from "@shopify/polaris";
import {
    DiscountIcon,
    ProductIcon,
    MagicIcon,
    SettingsIcon,
    ColorIcon,
} from "@shopify/polaris-icons";

// --- UTILITY FUNCTIONS ---

// Convert HSB to Hex
function hsbToHex(hsb) {
    const { hue, saturation, brightness } = hsb;
    const h = hue / 360;
    const s = saturation;
    const v = brightness;

    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: r = 0; g = 0; b = 0;
    }

    const toHex = (x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert Hex to HSB
function hexToHsb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: break;
        }
        h /= 6;
    }

    return { hue: h * 360, saturation: s, brightness: v };
}

// --- FAKE BACKEND DATA ---

const FAKE_COUPON_CONFIG = {
    activeTemplate: "template1",
    templates: {
        template1: {
            name: "Classic Banner",
            headingText: "Use code for 10% OFF!",
            subtextText: "Limited time offer",
            bgColor: "#1a1a2e",
            textColor: "#ffffff",
            accentColor: "#e94560",
            buttonColor: "#e94560",
            buttonTextColor: "#ffffff",
            borderRadius: 8,
            fontSize: 16,
            padding: 16,
        },
        template2: {
            name: "Minimal Card",
            headingText: "Special Discount",
            subtextText: "Apply at checkout",
            bgColor: "#ffffff",
            textColor: "#333333",
            accentColor: "#0070f3",
            buttonColor: "#0070f3",
            buttonTextColor: "#ffffff",
            borderRadius: 4,
            fontSize: 14,
            padding: 12,
        },
        template3: {
            name: "Bold & Vibrant",
            headingText: "Exclusive Savings!",
            subtextText: "Don't miss out",
            bgColor: "#6366f1",
            textColor: "#ffffff",
            accentColor: "#fbbf24",
            buttonColor: "#fbbf24",
            buttonTextColor: "#1f2937",
            borderRadius: 12,
            fontSize: 18,
            padding: 20,
        },
    },
};

const FAKE_FBT_CONFIG = {
    activeTemplate: "fbt1",
    mode: "manual",
    openaiKey: "",
    templates: {
        fbt1: {
            name: "Classic Grid",
            layout: "horizontal",
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

// --- LOADER ---

export async function loader({ request }) {
    const { admin } = await authenticate.admin(request);

    let products = [];
    try {
        const response = await admin.graphql(`
      query getProducts {
        products(first: 50) {
          edges {
            node {
              id
              title
              featuredImage {
                url
              }
              variants(first: 1) {
                edges {
                  node {
                    price
                  }
                }
              }
            }
          }
        }
      }
    `);
        const data = await response.json();
        products = data.data?.products?.edges?.map(({ node }) => ({
            id: node.id,
            title: node.title,
            image: node.featuredImage?.url || "",
            price: node.variants.edges[0]?.node?.price || "0.00",
        })) || [];
    } catch (e) {
        console.error("Failed to fetch products:", e);
    }

    return {
        couponConfig: FAKE_COUPON_CONFIG,
        fbtConfig: FAKE_FBT_CONFIG,
        products,
    };
}

// --- ACTION ---

export async function action({ request }) {
    await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("actionType");

    if (actionType === "saveCouponConfig") {
        const activeTemplate = formData.get("activeTemplate");
        const templateData = formData.get("templateData");

        if (!activeTemplate || !templateData) {
            return { success: false, error: "Missing required fields" };
        }

        try {
            JSON.parse(templateData);
        } catch (e) {
            return { success: false, error: "Invalid template data" };
        }

        console.log("[FAKE API] Saving Coupon Config:", { activeTemplate, templateData });
        return { success: true, message: "Coupon configuration saved!" };
    }

    if (actionType === "saveFBTConfig") {
        const mode = formData.get("mode");
        const configData = formData.get("configData");
        const activeTemplate = formData.get("activeTemplate");

        if (!mode || !["manual", "ai"].includes(mode)) {
            return { success: false, error: "Invalid mode" };
        }

        if (mode === "ai") {
            const openaiKey = formData.get("openaiKey");
            if (!openaiKey || openaiKey.trim() === "") {
                return { success: false, error: "OpenAI API Key is required for AI mode" };
            }
        }

        console.log("[FAKE API] Saving FBT Config:", { mode, activeTemplate, configData });
        return { success: true, message: "Frequently Bought Together configuration saved!" };
    }

    return { success: false, error: "Unknown action type" };
}

// --- COLOR PICKER COMPONENT ---

function ColorPickerField({ label, value, onChange }) {
    const [popoverActive, setPopoverActive] = useState(false);
    const [color, setColor] = useState(hexToHsb(value || "#000000"));

    const handleColorChange = (newColor) => {
        setColor(newColor);
        onChange(hsbToHex(newColor));
    };

    const activator = (
        <Button onClick={() => setPopoverActive(!popoverActive)} disclosure>
            <InlineStack gap="200" blockAlign="center">
                <div
                    style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: value,
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                    }}
                />
                <Text variant="bodySm">{value}</Text>
            </InlineStack>
        </Button>
    );

    return (
        <BlockStack gap="100">
            <Text as="label" variant="bodySm" fontWeight="semibold">
                {label}
            </Text>
            <Popover
                active={popoverActive}
                activator={activator}
                onClose={() => setPopoverActive(false)}
                preferredAlignment="left"
            >
                <Box padding="300">
                    <ColorPicker onChange={handleColorChange} color={color} />
                    <Box paddingBlockStart="200">
                        <TextField
                            label="Hex"
                            labelHidden
                            value={value}
                            onChange={(v) => {
                                if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
                                    setColor(hexToHsb(v));
                                }
                                onChange(v);
                            }}
                            prefix="#"
                            maxLength={7}
                        />
                    </Box>
                </Box>
            </Popover>
        </BlockStack>
    );
}

// --- COUPON TEMPLATE PREVIEW ---

function CouponTemplatePreview({ templateKey, config, isActive, onSelect }) {
    const t = config;

    return (
        <div
            style={{
                padding: `${t.padding}px`,
                borderRadius: `${t.borderRadius}px`,
                background: t.bgColor,
                color: t.textColor,
                border: isActive ? "3px solid #0070f3" : "3px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: "120px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
            }}
            onClick={() => onSelect(templateKey)}
        >
            <Text as="h3" variant="headingMd" fontWeight="bold">
                <span style={{ color: t.textColor, fontSize: `${t.fontSize}px` }}>
                    {t.headingText}
                </span>
            </Text>
            <Text as="p" variant="bodySm">
                <span style={{ color: t.textColor, opacity: 0.8 }}>{t.subtextText}</span>
            </Text>
            <div
                style={{
                    marginTop: "12px",
                    padding: "8px 16px",
                    background: t.buttonColor,
                    borderRadius: `${t.borderRadius / 2}px`,
                    color: t.buttonTextColor,
                    fontWeight: "bold",
                    fontSize: "12px",
                }}
            >
                COPY CODE
            </div>
            {isActive && (
                <Box paddingBlockStart="200">
                    <Badge tone="success">Active</Badge>
                </Box>
            )}
        </div>
    );
}

// --- FBT TEMPLATE PREVIEW ---

function FBTTemplatePreview({ templateKey, config, isActive, onSelect }) {
    const t = config;

    return (
        <div
            style={{
                padding: "12px",
                borderRadius: `${t.borderRadius}px`,
                background: t.bgColor,
                border: isActive ? "3px solid #0070f3" : `2px solid ${t.borderColor}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
            }}
            onClick={() => onSelect(templateKey)}
        >
            <BlockStack gap="200">
                <Text as="h4" variant="headingSm">
                    <span style={{ color: t.textColor }}>Frequently Bought Together</span>
                </Text>
                <InlineStack gap="200">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            style={{
                                width: "50px",
                                height: "50px",
                                background: t.borderColor,
                                borderRadius: `${t.borderRadius / 2}px`,
                            }}
                        />
                    ))}
                </InlineStack>
                {t.showPrices && (
                    <Text variant="bodySm">
                        <span style={{ color: t.priceColor, fontWeight: "bold" }}>$99.99</span>
                    </Text>
                )}
                {t.showAddAllButton && (
                    <div
                        style={{
                            padding: "6px 12px",
                            background: t.buttonColor,
                            borderRadius: `${t.borderRadius / 2}px`,
                            color: t.buttonTextColor,
                            fontSize: "11px",
                            fontWeight: "bold",
                            textAlign: "center",
                        }}
                    >
                        Add All to Cart
                    </div>
                )}
            </BlockStack>
            {isActive && (
                <Box paddingBlockStart="100">
                    <Badge tone="success" size="small">Active</Badge>
                </Box>
            )}
        </div>
    );
}

// --- COUPONS SECTION ---

function CouponsSection({ config, onSave, saving }) {
    const [activeTemplate, setActiveTemplate] = useState(config.activeTemplate);
    const [templates, setTemplates] = useState(config.templates);

    const handleTemplateSelect = (templateKey) => {
        setActiveTemplate(templateKey);
    };

    const updateTemplate = (field, value) => {
        setTemplates({
            ...templates,
            [activeTemplate]: { ...templates[activeTemplate], [field]: value },
        });
    };

    const handleSave = () => {
        onSave({
            activeTemplate,
            templateData: JSON.stringify(templates),
        });
    };

    const currentTemplate = templates[activeTemplate];

    return (
        <BlockStack gap="400">
            {/* Header */}
            <InlineStack gap="200" align="start" blockAlign="center">
                <Icon source={DiscountIcon} tone="primary" />
                <Text as="h2" variant="headingLg">Coupon Templates</Text>
            </InlineStack>

            <Text as="p" tone="subdued">
                Choose and customize a template for displaying coupons on your store.
            </Text>

            {/* Template Selector */}
            <Card>
                <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">Select Template</Text>
                    <InlineStack gap="300">
                        {Object.keys(templates).map((templateKey) => (
                            <Button
                                key={templateKey}
                                pressed={activeTemplate === templateKey}
                                onClick={() => handleTemplateSelect(templateKey)}
                            >
                                {templates[templateKey].name}
                            </Button>
                        ))}
                    </InlineStack>
                </BlockStack>
            </Card>

            {/* Two Column Layout: Preview Left, Customization Right */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* LEFT: Preview */}
                <Card>
                    <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">Preview</Text>
                        <div
                            style={{
                                padding: `${currentTemplate.padding}px`,
                                borderRadius: `${currentTemplate.borderRadius}px`,
                                background: currentTemplate.bgColor,
                                color: currentTemplate.textColor,
                                minHeight: "200px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                textAlign: "center",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                        >
                            <div style={{ fontSize: `${currentTemplate.fontSize}px`, fontWeight: "bold", marginBottom: "8px" }}>
                                {currentTemplate.headingText}
                            </div>
                            <div style={{ fontSize: `${currentTemplate.fontSize - 2}px`, opacity: 0.8, marginBottom: "16px" }}>
                                {currentTemplate.subtextText}
                            </div>
                            <div
                                style={{
                                    padding: "10px 24px",
                                    background: currentTemplate.buttonColor,
                                    borderRadius: `${currentTemplate.borderRadius / 2}px`,
                                    color: currentTemplate.buttonTextColor,
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                }}
                            >
                                COPY CODE
                            </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <Badge tone="success">{currentTemplate.name}</Badge>
                        </div>
                    </BlockStack>
                </Card>

                {/* RIGHT: Customization */}
                <Card>
                    <BlockStack gap="400">
                        <Text as="h3" variant="headingMd">Customize: {currentTemplate.name}</Text>

                        <Divider />

                        <Text as="h4" variant="headingSm">Text Content</Text>
                        <TextField
                            label="Heading Text"
                            value={currentTemplate.headingText}
                            onChange={(v) => updateTemplate("headingText", v)}
                        />
                        <TextField
                            label="Subtext"
                            value={currentTemplate.subtextText}
                            onChange={(v) => updateTemplate("subtextText", v)}
                        />

                        <Divider />

                        <Text as="h4" variant="headingSm">Colors</Text>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <ColorPickerField
                                label="Background"
                                value={currentTemplate.bgColor}
                                onChange={(v) => updateTemplate("bgColor", v)}
                            />
                            <ColorPickerField
                                label="Text Color"
                                value={currentTemplate.textColor}
                                onChange={(v) => updateTemplate("textColor", v)}
                            />
                            <ColorPickerField
                                label="Accent"
                                value={currentTemplate.accentColor}
                                onChange={(v) => updateTemplate("accentColor", v)}
                            />
                            <ColorPickerField
                                label="Button Color"
                                value={currentTemplate.buttonColor}
                                onChange={(v) => updateTemplate("buttonColor", v)}
                            />
                            <ColorPickerField
                                label="Button Text"
                                value={currentTemplate.buttonTextColor}
                                onChange={(v) => updateTemplate("buttonTextColor", v)}
                            />
                        </div>

                        <Divider />

                        <Text as="h4" variant="headingSm">Styling</Text>
                        <RangeSlider
                            label={`Border Radius: ${currentTemplate.borderRadius}px`}
                            value={currentTemplate.borderRadius}
                            onChange={(v) => updateTemplate("borderRadius", v)}
                            min={0}
                            max={24}
                            output
                        />
                        <RangeSlider
                            label={`Font Size: ${currentTemplate.fontSize}px`}
                            value={currentTemplate.fontSize}
                            onChange={(v) => updateTemplate("fontSize", v)}
                            min={12}
                            max={24}
                            output
                        />
                        <RangeSlider
                            label={`Padding: ${currentTemplate.padding}px`}
                            value={currentTemplate.padding}
                            onChange={(v) => updateTemplate("padding", v)}
                            min={8}
                            max={32}
                            output
                        />
                    </BlockStack>
                </Card>
            </div>

            <Button variant="primary" onClick={handleSave} loading={saving}>
                Save Coupon Settings
            </Button>
        </BlockStack>
    );
}

// --- FBT SECTION ---

function FBTSection({ config, products, onSave, saving }) {
    const [activeTemplate, setActiveTemplate] = useState(config.activeTemplate);
    const [templates, setTemplates] = useState(config.templates);
    const [mode, setMode] = useState(config.mode);
    const [openaiKey, setOpenaiKey] = useState(config.openaiKey);
    const [manualRules, setManualRules] = useState(config.manualRules);
    const [selectedTriggerProduct, setSelectedTriggerProduct] = useState("");
    const [selectedUpsellProducts, setSelectedUpsellProducts] = useState([]);

    const handleModeChange = useCallback((value) => {
        setMode(value[0]);
    }, []);

    const updateTemplate = (field, value) => {
        setTemplates({
            ...templates,
            [activeTemplate]: { ...templates[activeTemplate], [field]: value },
        });
    };

    const handleAddRule = () => {
        if (!selectedTriggerProduct || selectedUpsellProducts.length === 0) return;

        const newRule = {
            id: `rule-${Date.now()}`,
            triggerProductId: selectedTriggerProduct,
            upsellProductIds: selectedUpsellProducts,
        };

        setManualRules([...manualRules, newRule]);
        setSelectedTriggerProduct("");
        setSelectedUpsellProducts([]);
    };

    const handleRemoveRule = (ruleId) => {
        setManualRules(manualRules.filter((r) => r.id !== ruleId));
    };

    const handleSave = () => {
        onSave({
            activeTemplate,
            templateData: JSON.stringify(templates),
            mode,
            openaiKey: mode === "ai" ? openaiKey : "",
            configData: mode === "manual" ? JSON.stringify(manualRules) : "",
        });
    };

    const productOptions = products.map((p) => ({
        label: p.title,
        value: p.id,
    }));

    const getProductById = (id) => products.find((p) => p.id === id);
    const currentTemplate = templates[activeTemplate];

    return (
        <BlockStack gap="400">
            {/* Header */}
            <InlineStack gap="200" align="start" blockAlign="center">
                <Icon source={ProductIcon} tone="primary" />
                <Text as="h2" variant="headingLg">Frequently Bought Together</Text>
            </InlineStack>

            <Text as="p" tone="subdued">
                Choose a template and configure product recommendations.
            </Text>

            {/* Template Selector */}
            <Card>
                <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">Select Template</Text>
                    <InlineStack gap="300">
                        {Object.keys(templates).map((templateKey) => (
                            <Button
                                key={templateKey}
                                pressed={activeTemplate === templateKey}
                                onClick={() => setActiveTemplate(templateKey)}
                            >
                                {templates[templateKey].name}
                            </Button>
                        ))}
                    </InlineStack>
                </BlockStack>
            </Card>

            {/* Two Column Layout: Preview Left, Customization Right */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* LEFT: Preview */}
                <Card>
                    <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">Preview</Text>
                        <div
                            style={{
                                padding: "16px",
                                borderRadius: `${currentTemplate.borderRadius}px`,
                                background: currentTemplate.bgColor,
                                border: `2px solid ${currentTemplate.borderColor}`,
                                minHeight: "200px",
                            }}
                        >
                            <BlockStack gap="200">
                                <div style={{ color: currentTemplate.textColor, fontWeight: "bold", fontSize: "16px" }}>
                                    Frequently Bought Together
                                </div>
                                <div style={{ display: "flex", flexDirection: currentTemplate.layout === "vertical" ? "column" : "row", gap: "8px" }}>
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: currentTemplate.layout === "vertical" ? "100%" : "80px",
                                                height: currentTemplate.layout === "vertical" ? "40px" : "80px",
                                                background: currentTemplate.borderColor,
                                                borderRadius: `${currentTemplate.borderRadius / 2}px`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: currentTemplate.layout === "vertical" ? "flex-start" : "center",
                                                paddingLeft: currentTemplate.layout === "vertical" ? "12px" : "0",
                                                color: currentTemplate.textColor,
                                                fontSize: "12px",
                                            }}
                                        >
                                            Product {i}
                                        </div>
                                    ))}
                                </div>
                                {currentTemplate.showPrices && (
                                    <div style={{ color: currentTemplate.priceColor, fontWeight: "bold", fontSize: "18px" }}>
                                        Total: $99.99
                                    </div>
                                )}
                                {currentTemplate.showAddAllButton && (
                                    <div
                                        style={{
                                            padding: "10px 20px",
                                            background: currentTemplate.buttonColor,
                                            borderRadius: `${currentTemplate.borderRadius / 2}px`,
                                            color: currentTemplate.buttonTextColor,
                                            fontWeight: "bold",
                                            fontSize: "14px",
                                            textAlign: "center",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Add All to Cart
                                    </div>
                                )}
                            </BlockStack>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <Badge tone="success">{currentTemplate.name}</Badge>
                        </div>
                    </BlockStack>
                </Card>

                {/* RIGHT: Customization */}
                <Card>
                    <BlockStack gap="400">
                        <Text as="h3" variant="headingMd">Customize: {currentTemplate.name}</Text>

                        <Divider />

                        <Text as="h4" variant="headingSm">Colors</Text>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <ColorPickerField
                                label="Background"
                                value={currentTemplate.bgColor}
                                onChange={(v) => updateTemplate("bgColor", v)}
                            />
                            <ColorPickerField
                                label="Text Color"
                                value={currentTemplate.textColor}
                                onChange={(v) => updateTemplate("textColor", v)}
                            />
                            <ColorPickerField
                                label="Price Color"
                                value={currentTemplate.priceColor}
                                onChange={(v) => updateTemplate("priceColor", v)}
                            />
                            <ColorPickerField
                                label="Button Color"
                                value={currentTemplate.buttonColor}
                                onChange={(v) => updateTemplate("buttonColor", v)}
                            />
                            <ColorPickerField
                                label="Button Text"
                                value={currentTemplate.buttonTextColor}
                                onChange={(v) => updateTemplate("buttonTextColor", v)}
                            />
                            <ColorPickerField
                                label="Border Color"
                                value={currentTemplate.borderColor}
                                onChange={(v) => updateTemplate("borderColor", v)}
                            />
                        </div>

                        <Divider />

                        <Text as="h4" variant="headingSm">Styling</Text>
                        <RangeSlider
                            label={`Border Radius: ${currentTemplate.borderRadius}px`}
                            value={currentTemplate.borderRadius}
                            onChange={(v) => updateTemplate("borderRadius", v)}
                            min={0}
                            max={24}
                            output
                        />

                        <Divider />

                        <Text as="h4" variant="headingSm">Display Options</Text>
                        <InlineStack gap="400">
                            <Checkbox
                                label="Show Prices"
                                checked={currentTemplate.showPrices}
                                onChange={(v) => updateTemplate("showPrices", v)}
                            />
                            <Checkbox
                                label="Show 'Add All' Button"
                                checked={currentTemplate.showAddAllButton}
                                onChange={(v) => updateTemplate("showAddAllButton", v)}
                            />
                        </InlineStack>
                    </BlockStack>
                </Card>
            </div>

            {/* Mode Selection */}
            <Card>
                <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">Configuration Mode</Text>
                    <ChoiceList
                        title=""
                        choices={[
                            {
                                label: (
                                    <InlineStack gap="200" blockAlign="center">
                                        <Icon source={SettingsIcon} />
                                        <span>Manual Configuration</span>
                                    </InlineStack>
                                ),
                                value: "manual",
                                helpText: "Manually set which products to upsell",
                            },
                            {
                                label: (
                                    <InlineStack gap="200" blockAlign="center">
                                        <Icon source={MagicIcon} />
                                        <span>AI Configuration (OpenAI)</span>
                                    </InlineStack>
                                ),
                                value: "ai",
                                helpText: "Let AI suggest products automatically",
                            },
                        ]}
                        selected={[mode]}
                        onChange={handleModeChange}
                    />
                </BlockStack>
            </Card>

            {/* Manual Mode */}
            {mode === "manual" && (
                <Card>
                    <BlockStack gap="400">
                        <Text as="h3" variant="headingMd">Manual Upsell Rules</Text>

                        <Select
                            label="When customer views this product..."
                            options={[{ label: "Select a product", value: "" }, ...productOptions]}
                            value={selectedTriggerProduct}
                            onChange={setSelectedTriggerProduct}
                        />

                        <Text as="p" fontWeight="semibold">Show these products as suggestions:</Text>

                        <div style={{ maxHeight: "200px", overflow: "auto", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px" }}>
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "8px",
                                        cursor: "pointer",
                                        borderRadius: "4px",
                                        background: selectedUpsellProducts.includes(product.id) ? "#e0f0ff" : "transparent",
                                    }}
                                    onClick={() => {
                                        if (selectedUpsellProducts.includes(product.id)) {
                                            setSelectedUpsellProducts(selectedUpsellProducts.filter((id) => id !== product.id));
                                        } else {
                                            setSelectedUpsellProducts([...selectedUpsellProducts, product.id]);
                                        }
                                    }}
                                >
                                    <Checkbox label="" checked={selectedUpsellProducts.includes(product.id)} onChange={() => { }} />
                                    <Thumbnail source={product.image || ""} alt={product.title} size="small" />
                                    <div style={{ marginLeft: "12px" }}>
                                        <Text as="span" fontWeight="semibold">{product.title}</Text>
                                        <Text as="p" tone="subdued" variant="bodySm">${product.price}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button onClick={handleAddRule} disabled={!selectedTriggerProduct || selectedUpsellProducts.length === 0}>
                            Add Rule
                        </Button>

                        <Divider />

                        <Text as="h4" variant="headingMd">Saved Rules ({manualRules.length})</Text>

                        {manualRules.length === 0 ? (
                            <Banner>No rules configured yet.</Banner>
                        ) : (
                            <BlockStack gap="200">
                                {manualRules.map((rule) => {
                                    const triggerProduct = getProductById(rule.triggerProductId);
                                    const upsellProducts = rule.upsellProductIds.map(getProductById).filter(Boolean);

                                    return (
                                        <Card key={rule.id}>
                                            <InlineStack align="space-between" blockAlign="start">
                                                <BlockStack gap="200">
                                                    <Text as="p" fontWeight="semibold">
                                                        Trigger: {triggerProduct?.title || rule.triggerProductId}
                                                    </Text>
                                                    <InlineStack gap="100" wrap>
                                                        {upsellProducts.map((p) => (
                                                            <Badge key={p.id}>{p.title}</Badge>
                                                        ))}
                                                    </InlineStack>
                                                </BlockStack>
                                                <Button tone="critical" onClick={() => handleRemoveRule(rule.id)}>
                                                    Remove
                                                </Button>
                                            </InlineStack>
                                        </Card>
                                    );
                                })}
                            </BlockStack>
                        )}
                    </BlockStack>
                </Card>
            )}

            {/* AI Mode */}
            {mode === "ai" && (
                <Card>
                    <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">AI Configuration</Text>
                        <Banner tone="info">
                            AI mode uses OpenAI to analyze your catalog and suggest frequently bought together products.
                        </Banner>
                        <TextField
                            label="OpenAI API Key"
                            type="password"
                            value={openaiKey}
                            onChange={setOpenaiKey}
                            placeholder="sk-..."
                            helpText="Your API key is stored securely."
                        />
                    </BlockStack>
                </Card>
            )}

            <Button variant="primary" onClick={handleSave} loading={saving} fullWidth>
                Save FBT Settings
            </Button>
        </BlockStack>
    );
}

// --- MAIN COMPONENT ---

export default function ProductWidgetPage() {
    const { couponConfig, fbtConfig, products } = useLoaderData();
    const fetcher = useFetcher();
    const shopify = useAppBridge();

    const [selectedTab, setSelectedTab] = useState(0);

    const tabs = [
        {
            id: "coupons",
            content: "Coupons",
            accessibilityLabel: "Coupon Templates",
            panelID: "coupons-panel",
        },
        {
            id: "fbt",
            content: "Frequently Bought Together",
            accessibilityLabel: "Frequently Bought Together Configuration",
            panelID: "fbt-panel",
        },
    ];

    const handleTabChange = useCallback((selectedTabIndex) => {
        setSelectedTab(selectedTabIndex);
    }, []);

    useEffect(() => {
        if (fetcher.data) {
            if (fetcher.data.success) {
                shopify.toast.show(fetcher.data.message || "Saved successfully!");
            } else {
                shopify.toast.show(fetcher.data.error || "Failed to save.", { isError: true });
            }
        }
    }, [fetcher.data, shopify]);

    const handleCouponSave = (data) => {
        fetcher.submit(
            {
                actionType: "saveCouponConfig",
                activeTemplate: data.activeTemplate,
                templateData: data.templateData,
            },
            { method: "POST" }
        );
    };

    const handleFBTSave = (data) => {
        fetcher.submit(
            {
                actionType: "saveFBTConfig",
                activeTemplate: data.activeTemplate,
                templateData: data.templateData,
                mode: data.mode,
                openaiKey: data.openaiKey || "",
                configData: data.configData || "",
            },
            { method: "POST" }
        );
    };

    const isSaving = fetcher.state === "submitting";

    return (
        <Page
            title="Product Widgets"
            backAction={{ content: "Back", onAction: () => window.history.back() }}
        >
            <Layout>
                <Layout.Section>
                    <Card>
                        <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
                            <Box padding="400">
                                {selectedTab === 0 && (
                                    <CouponsSection
                                        config={couponConfig}
                                        onSave={handleCouponSave}
                                        saving={isSaving}
                                    />
                                )}
                                {selectedTab === 1 && (
                                    <FBTSection
                                        config={fbtConfig}
                                        products={products}
                                        onSave={handleFBTSave}
                                        saving={isSaving}
                                    />
                                )}
                            </Box>
                        </Tabs>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

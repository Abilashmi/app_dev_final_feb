import {
    Page,
    Card,
    TextField,
    Button,
    BlockStack,
    InlineStack,
    Text,
    Toast,
    Layout,
    Box,
    ChoiceList,
    Divider,
    Icon,
    Banner,
    List,
    Grid,
    Thumbnail,
} from "@shopify/polaris";
import {
    DiscountIcon,
    ProductIcon,
    CollectionIcon,
} from "@shopify/polaris-icons";
import { useNavigate, useActionData, useNavigation, useSubmit } from "react-router";
import { useCallback, useState, useMemo, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { sendToFakeApi } from "../services/fakeApi.server";

/* ---------------- SERVER-SIDE ACTION ---------------- */

export const action = async ({ request }) => {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();

    const title = formData.get("title");
    const code = formData.get("code");
    const type = formData.get("type"); // amount_off_products, amount_off_order, bxgy, free_shipping
    const valueType = formData.get("valueType"); // percentage, fixed_amount
    const value = parseFloat(formData.get("value") || "0");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");

    // Resource IDs
    const selectionType = formData.get("selectionType"); // all, collections, products
    const selectedResources = JSON.parse(formData.get("selectedResources") || "[]");

    let mutation = "";
    let variables = {};

    const startsAt = new Date(startDate).toISOString();
    const endsAt = endDate ? new Date(endDate).toISOString() : null;

    if (type === "amount_off_products" || type === "amount_off_order") {
        mutation = `#graphql
            mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
                discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
                    codeDiscountNode { id }
                    userErrors { field message }
                }
            }
        `;

        variables = {
            basicCodeDiscount: {
                title: title || code,
                code,
                startsAt,
                ...(endsAt && { endsAt }),
                customerSelection: { all: true },
                customerGets: {
                    value: {
                        [valueType === "percentage" ? "percentage" : "discountAmount"]: valueType === "percentage"
                            ? value / 100
                            : { amount: value, currencyCode: "USD" }
                    },
                    items: type === "amount_off_order" ? { all: true } : {
                        [selectionType === "collections" ? "collections" : selectionType === "products" ? "products" : "all"]: selectionType === "all" ? true : {
                            add: selectedResources.map(r => r.id)
                        }
                    }
                },
                appliesOncePerCustomer: false
            }
        };
    } else if (type === "free_shipping") {
        mutation = `#graphql
            mutation discountCodeFreeShippingCreate($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
                discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
                    codeDiscountNode { id }
                    userErrors { field message }
                }
            }
        `;
        variables = {
            freeShippingCodeDiscount: {
                title: title || code,
                code,
                startsAt,
                ...(endsAt && { endsAt }),
                customerSelection: { all: true },
                destinationSelection: { all: true },
                appliesOncePerCustomer: false
            }
        };
    } else if (type === "bxgy") {
        mutation = `#graphql
            mutation discountCodeBxgyCreate($bxgyCodeDiscount: DiscountCodeBxgyInput!) {
                discountCodeBxgyCreate(bxgyCodeDiscount: $bxgyCodeDiscount) {
                    codeDiscountNode { id }
                    userErrors { field message }
                }
            }
        `;
        // Simplified BXGY: Buy 1 Get 1 Free
        variables = {
            bxgyCodeDiscount: {
                title: title || code,
                code,
                startsAt,
                ...(endsAt && { endsAt }),
                customerSelection: { all: true },
                usesPerCustomerLimit: 1,
                buys: {
                    items: { all: true },
                    value: { quantity: "1" }
                },
                gets: {
                    items: { all: true },
                    value: { percentage: 1.0 },
                    quantity: { quantity: "1" }
                }
            }
        };
    }

    try {
        const response = await admin.graphql(mutation, { variables });
        const responseJson = await response.json();

        const mutationKey = Object.keys(responseJson.data)[0];
        const result = responseJson.data[mutationKey];
        const errors = result.userErrors;

        if (errors.length > 0) {
            return { errors };
        }

        const createdDiscountId = result.codeDiscountNode?.id;

        await sendToFakeApi({
            shopifyId: createdDiscountId,
            title,
            code,
            type,
            value,
            startDate,
            endDate,
            selectionType,
            numResources: selectedResources.length
        });

        return { success: true, discountId: createdDiscountId };
    } catch (error) {
        console.error("Error creating discount:", error);
        return { errors: [{ message: "Failed to create discount" }] };
    }
};

/* ---------------- COMPONENT ---------------- */

export default function CreateDiscount() {
    const navigate = useNavigate();
    const actionData = useActionData();
    const navigation = useNavigation();
    const submit = useSubmit();
    const shopify = useAppBridge();
    const isSubmitting = navigation.state === "submitting";

    // Form State
    const [title, setTitle] = useState("");
    const [code, setCode] = useState("");
    const [type, setType] = useState(["amount_off_products"]); // amount_off_products, amount_off_order, bxgy, free_shipping
    const [valueType, setValueType] = useState(["percentage"]);
    const [value, setValue] = useState("");

    // Resource Selection
    const [selectionType, setSelectionType] = useState(["all"]); // all, collections, products
    const [selectedResources, setSelectedResources] = useState([]);

    // Dates
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState("");
    const [hasEndDate, setHasEndDate] = useState(false);

    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (actionData?.success) {
            setShowToast(true);
            setTimeout(() => navigate("/app/discount"), 2000);
        }
    }, [actionData, navigate]);

    /* ---------------- HANDLERS ---------------- */

    const selectResources = async () => {
        const resourceType = selectionType[0] === "collections" ? "collection" : "product";
        const selected = await shopify.resourcePicker({
            type: resourceType,
            multiple: true,
            selectionIds: selectedResources.map(r => ({ id: r.id }))
        });

        if (selected) {
            setSelectedResources(selected.map(item => ({
                id: item.id,
                title: item.title,
                handle: item.handle,
                image: item.images?.[0]?.originalSrc || item.image?.originalSrc
            })));
        }
    };

    /* ---------------- SUMMARY ---------------- */

    const summaryItems = useMemo(() => {
        const items = [];
        const typeLabels = {
            amount_off_products: "Amount off products",
            amount_off_order: "Amount off order",
            bxgy: "Buy X Get Y",
            free_shipping: "Free shipping"
        };
        items.push(`Type: ${typeLabels[type[0]]}`);

        if (type[0].includes("amount")) {
            const isPercentage = valueType[0] === "percentage";
            items.push(`${isPercentage ? value + "%" : "$" + value} off`);
        }

        if (type[0] === "amount_off_products") {
            if (selectionType[0] === "all") items.push("Applies to all products");
            else items.push(`Applies to ${selectedResources.length} ${selectionType[0]}`);
        }

        items.push(`Code: ${code || "Not set"}`);
        items.push(`Starts ${startDate}`);
        if (hasEndDate && endDate) items.push(`Ends ${endDate}`);

        return items;
    }, [type, value, valueType, selectionType, selectedResources, code, startDate, endDate, hasEndDate]);

    /* ---------------- UI ---------------- */

    return (
        <Page
            title="Create discount"
            backAction={{ content: "Discounts", onAction: () => navigate("/app/discount") }}
            primaryAction={{
                content: "Save discount",
                onAction: () => {
                    const formData = new FormData();
                    formData.append("title", title || code);
                    formData.append("code", code);
                    formData.append("type", type[0]);
                    formData.append("valueType", valueType[0]);
                    formData.append("value", value);
                    formData.append("startDate", startDate);
                    if (hasEndDate) formData.append("endDate", endDate);
                    formData.append("selectionType", selectionType[0]);
                    formData.append("selectedResources", JSON.stringify(selectedResources));
                    submit(formData, { method: "post" });
                },
                loading: isSubmitting,
                disabled: !code || (type[0].includes("amount") && !value) || (selectionType[0] !== "all" && selectedResources.length === 0),
            }}
        >
            <Layout>
                <Layout.Section>
                    <BlockStack gap="400">
                        {/* DISCOUNT TYPE CARD */}
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Select Class</Text>
                                <ChoiceList
                                    choices={[
                                        { label: "Amount off products", value: "amount_off_products" },
                                        { label: "Amount off order", value: "amount_off_order" },
                                        { label: "Buy X get Y", value: "bxgy" },
                                        { label: "Free shipping", value: "free_shipping" },
                                    ]}
                                    selected={type}
                                    onChange={setType}
                                />
                                <Divider />
                                <TextField
                                    label="Discount code"
                                    value={code}
                                    onChange={setCode}
                                    autoComplete="off"
                                    placeholder="e.g. SUMMER2024"
                                    suffix={<Button onClick={() => setCode(Math.random().toString(36).substring(2, 10).toUpperCase())}>Generate</Button>}
                                />
                                <TextField label="Internal title" value={title} onChange={setTitle} autoComplete="off" />
                            </BlockStack>
                        </Card>

                        {/* VALUE & APPLIES TO CARD (CONDITIONAL) */}
                        {type[0].includes("amount") && (
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h2">Value</Text>
                                    <ChoiceList
                                        title="Discount type"
                                        choices={[
                                            { label: "Percentage", value: "percentage" },
                                            { label: "Fixed amount", value: "fixed_amount" },
                                        ]}
                                        selected={valueType}
                                        onChange={setValueType}
                                    />
                                    <TextField
                                        label="Amount"
                                        type="number"
                                        value={value}
                                        onChange={setValue}
                                        prefix={valueType[0] === "fixed_amount" ? "$" : ""}
                                        suffix={valueType[0] === "percentage" ? "%" : ""}
                                    />

                                    {type[0] === "amount_off_products" && (
                                        <>
                                            <Divider />
                                            <Text variant="headingMd" as="h2">Applies to</Text>
                                            <ChoiceList
                                                choices={[
                                                    { label: "All products", value: "all" },
                                                    { label: "Specific collections", value: "collections" },
                                                    { label: "Specific products", value: "products" },
                                                ]}
                                                selected={selectionType}
                                                onChange={setSelectionType}
                                            />
                                            {selectionType[0] !== "all" && (
                                                <BlockStack gap="200">
                                                    <Button onClick={selectResources}>Browse {selectionType[0]}</Button>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                                                        {selectedResources.map(res => (
                                                            <Box key={res.id} padding="100" border="divider" borderRadius="200">
                                                                <BlockStack align="center" gap="100">
                                                                    <Thumbnail source={res.image || (selectionType[0] === 'products' ? ProductIcon : CollectionIcon)} size="small" />
                                                                    <Text variant="bodyXs" truncate>{res.title}</Text>
                                                                </BlockStack>
                                                            </Box>
                                                        ))}
                                                    </div>
                                                </BlockStack>
                                            )}
                                        </>
                                    )}
                                </BlockStack>
                            </Card>
                        )}

                        {/* BXGY CARD */}
                        {type[0] === "bxgy" && (
                            <Card>
                                <Banner tone="info">BXGY is preset to "Buy 1 Get 1 Free" for all products.</Banner>
                            </Card>
                        )}

                        {/* ACTIVE DATES CARD */}
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Active dates</Text>
                                <InlineStack gap="400" align="start" blockAlign="start">
                                    <Box minWidth="200px">
                                        <TextField
                                            label="Start date"
                                            type="date"
                                            value={startDate}
                                            onChange={setStartDate}
                                        />
                                    </Box>
                                    <Box minWidth="200px">
                                        <BlockStack gap="200">
                                            <ChoiceList
                                                choices={[{ label: "No end date", value: "false" }, { label: "Set end date", value: "true" }]}
                                                selected={[String(hasEndDate)]}
                                                onChange={(val) => setHasEndDate(val[0] === "true")}
                                            />
                                            {hasEndDate && (
                                                <TextField
                                                    label="End date"
                                                    type="date"
                                                    value={endDate}
                                                    onChange={setEndDate}
                                                />
                                            )}
                                        </BlockStack>
                                    </Box>
                                </InlineStack>
                            </BlockStack>
                        </Card>

                        {actionData?.errors && (
                            <Banner tone="critical">
                                <List>
                                    {actionData.errors.map((error, i) => (
                                        <List.Item key={i}>{error.message}</List.Item>
                                    ))}
                                </List>
                            </Banner>
                        )}
                    </BlockStack>
                </Layout.Section>

                {/* SIDEBAR SUMMARY */}
                <Layout.Section variant="oneThird">
                    <BlockStack gap="400">
                        <Card>
                            <BlockStack gap="300">
                                <Text variant="headingMd" as="h2">Summary</Text>
                                {code && (
                                    <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                                        <InlineStack align="center" gap="200">
                                            <Icon source={DiscountIcon} tone="base" />
                                            <Text variant="headingLg" as="p">{code}</Text>
                                        </InlineStack>
                                    </Box>
                                )}
                                <Divider />
                                <List type="bullet">
                                    {summaryItems.map((item, i) => (
                                        <List.Item key={i}>{item}</List.Item>
                                    ))}
                                </List>
                            </BlockStack>
                        </Card>

                        <Banner title="Discount Tip" tone="info">
                            <p>Code-based discounts allow you to track specific marketing campaigns.</p>
                        </Banner>
                    </BlockStack>
                </Layout.Section>
            </Layout>

            {showToast && (
                <Toast
                    content="Discount created successfully"
                    onDismiss={() => setShowToast(false)}
                />
            )}
        </Page>
    );
}

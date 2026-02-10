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
    DatePicker,
    Popover,
    Checkbox,
    Select,
    Modal,
    Scrollable,
} from "@shopify/polaris";
import {
    DiscountIcon,
    ProductIcon,
    CollectionIcon,
    CalendarIcon,
} from "@shopify/polaris-icons";
import { useNavigate, useActionData, useNavigation, useSubmit } from "react-router";
import { useCallback, useState, useMemo, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { sendToFakeApi } from "../services/fakeApi.server";

const COUNTRIES = [
    { label: "India", value: "IN", flag: "🇮🇳" },
    { label: "United States", value: "US", flag: "🇺🇸" },
    { label: "United Kingdom", value: "GB", flag: "🇬🇧" },
    { label: "Canada", value: "CA", flag: "🇨🇦" },
    { label: "Australia", value: "AU", flag: "🇦🇺" },
    { label: "Germany", value: "DE", flag: "🇩🇪" },
    { label: "France", value: "FR", flag: "🇫🇷" },
    { label: "Japan", value: "JP", flag: "🇯🇵" },
    { label: "China", value: "CN", flag: "🇨🇳" },
    { label: "Brazil", value: "BR", flag: "🇧🇷" },
];

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

    const minimumRequirementValue = formData.get("minimumRequirement");
    const minimumPurchaseAmount = formData.get("minimumPurchaseAmount");
    const minimumQuantity = formData.get("minimumQuantity");
    const limitTotalUses = formData.get("limitTotalUses") === "true";
    const totalUsesLimit = parseInt(formData.get("totalUsesLimit") || "0");
    const limitOnePerCustomer = formData.get("limitOnePerCustomer") === "true";
    const combineProduct = formData.get("combineProduct") === "true";
    const combineOrder = formData.get("combineOrder") === "true";
    const combineShipping = formData.get("combineShipping") === "true";
    const oncePerOrder = formData.get("oncePerOrder") === "true";

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
                            : { amount: value, currencyCode: "INR", appliesOnEachItem: !oncePerOrder }
                    },
                    items: (type === "amount_off_order" && selectionType === "all") ? { all: true } : {
                        [selectionType === "collections" ? "collections" : selectionType === "products" ? "products" : "all"]: selectionType === "all" ? true : {
                            add: selectedResources.map(r => r.id)
                        }
                    }
                },
                appliesOncePerCustomer: limitOnePerCustomer,
                ...(limitTotalUses && { usageLimit: totalUsesLimit }),
                combinesWith: {
                    productDiscounts: combineProduct,
                    orderDiscounts: combineOrder,
                    shippingDiscounts: combineShipping
                },
                ...(minimumRequirementValue === "amount" && {
                    minimumRequirement: {
                        subtotal: { greaterThanOrEqualToSubtotal: { amount: minimumPurchaseAmount, currencyCode: "INR" } }
                    }
                }),
                ...(minimumRequirementValue === "quantity" && {
                    minimumRequirement: {
                        quantity: { greaterThanOrEqualToQuantity: minimumQuantity }
                    }
                })
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

        const countriesType = formData.get("countriesType");
        const selectedCountries = JSON.parse(formData.get("selectedCountries") || "[]");

        variables = {
            freeShippingCodeDiscount: {
                title: title || code,
                code,
                startsAt,
                ...(endsAt && { endsAt }),
                customerSelection: { all: true },
                destinationSelection: countriesType === "all" ? { all: true } : {
                    countries: { add: selectedCountries }
                },
                appliesOncePerCustomer: limitOnePerCustomer,
                ...(limitTotalUses && { usageLimit: totalUsesLimit }),
                combinesWith: {
                    productDiscounts: combineProduct,
                    orderDiscounts: combineOrder,
                    shippingDiscounts: combineShipping
                },
                ...(minimumRequirementValue === "amount" && {
                    minimumRequirement: {
                        subtotal: { greaterThanOrEqualToSubtotal: { amount: minimumPurchaseAmount, currencyCode: "INR" } }
                    }
                }),
                ...(minimumRequirementValue === "quantity" && {
                    minimumRequirement: {
                        quantity: { greaterThanOrEqualToQuantity: minimumQuantity }
                    }
                })
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

        const buysType = formData.get("bxgyBuysType") === "collections" ? "collections" : "products";
        const buysResources = JSON.parse(formData.get("bxgyBuysResources") || "[]");
        const buysQuantity = formData.get("bxgyBuysQuantity");

        const getsType = formData.get("bxgyGetsType"); // same, products, collections
        const getsResources = JSON.parse(formData.get("bxgyGetsResources") || "[]");
        const getsValueType = formData.get("bxgyGetsValueType");
        const getsValue = parseFloat(formData.get("bxgyGetsValue") || "0");
        const getsQuantity = formData.get("bxgyGetsQuantity");
        const repeatOncePerOrder = formData.get("bxgyRepeatOncePerOrder") === "true";

        variables = {
            bxgyCodeDiscount: {
                title: title || code,
                code,
                startsAt,
                ...(endsAt && { endsAt }),
                customerSelection: { all: true },
                usesPerCustomerLimit: limitOnePerCustomer ? 1 : null,
                buys: {
                    items: {
                        [buysType]: { add: buysResources.map(r => r.id) }
                    },
                    value: { quantity: buysQuantity }
                },
                gets: {
                    items: getsType === "same" ? {
                        [buysType]: { add: buysResources.map(r => r.id) }
                    } : {
                        [getsType]: { add: getsResources.map(r => r.id) }
                    },
                    value: {
                        [getsValueType === "free" ? "percentage" : getsValueType === "percentage" ? "percentage" : "discountAmount"]:
                            getsValueType === "free" ? 1.0 : getsValueType === "percentage" ? getsValue / 100 : { amount: getsValue, currencyCode: "INR" }
                    },
                    quantity: { quantity: getsQuantity }
                },
                appliesOncePerOrder: repeatOncePerOrder,
                combinesWith: {
                    productDiscounts: combineProduct,
                    orderDiscounts: combineOrder,
                    shippingDiscounts: combineShipping
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
    const [value, setValue] = useState("");

    // Discount Value
    const [discountValueType, setDiscountValueType] = useState("percentage");

    // Applies To
    const [appliesTo, setAppliesTo] = useState("all_products");
    const [selectedResources, setSelectedResources] = useState([]);
    const [resourceSearch, setResourceSearch] = useState("");

    // Buy X Get Y Specific State
    const [bxgyBuysType, setBxgyBuysType] = useState(["products"]);
    const [bxgyBuysResources, setBxgyBuysResources] = useState([]);
    const [bxgyBuysQuantity, setBxgyBuysQuantity] = useState("1");
    const [bxgyGetsType, setBxgyGetsType] = useState(["same"]);
    const [bxgyGetsResources, setBxgyGetsResources] = useState([]);
    const [bxgyGetsValueType, setBxgyGetsValueType] = useState("free");
    const [bxgyGetsValue, setBxgyGetsValue] = useState("");
    const [bxgyGetsQuantity, setBxgyGetsQuantity] = useState("1");
    const [bxgyRepeatOncePerOrder, setBxgyRepeatOncePerOrder] = useState(true);

    // Minimum Purchase Requirements
    const [minimumRequirement, setMinimumRequirement] = useState(["none"]);
    const [minimumPurchaseAmount, setMinimumPurchaseAmount] = useState("");
    const [minimumQuantity, setMinimumQuantity] = useState("");

    // Free Shipping Specific State
    const [shippingRatesType, setShippingRatesType] = useState(["all"]);
    const [selectedShippingRates, setSelectedShippingRates] = useState([]);
    const [countriesType, setCountriesType] = useState(["all"]);
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [countrySearch, setCountrySearch] = useState("");
    const [countryModalActive, setCountryModalActive] = useState(false);
    const [tempSelectedCountries, setTempSelectedCountries] = useState([]);

    // Maximum Discount Uses
    const [limitTotalUses, setLimitTotalUses] = useState(false);
    const [totalUsesLimit, setTotalUsesLimit] = useState("");
    const [limitOnePerCustomer, setLimitOnePerCustomer] = useState(false);

    // Combinations
    const [combineProduct, setCombineProduct] = useState(false);
    const [combineOrder, setCombineOrder] = useState(false);
    const [combineShipping, setCombineShipping] = useState(false);
    const [oncePerOrder, setOncePerOrder] = useState(false);

    // Dates — using Date objects + Polaris DatePicker
    const today = useMemo(() => new Date(), []);
    const [startDate, setStartDate] = useState(today);
    const [startTime, setStartTime] = useState("12:00");
    const [{ startMonth, startYear }, setStartMonthYear] = useState({
        startMonth: today.getMonth(),
        startYear: today.getFullYear(),
    });
    const [startPopoverActive, setStartPopoverActive] = useState(false);

    const [endDate, setEndDate] = useState(today);
    const [endTime, setEndTime] = useState("12:00");
    const [{ endMonth, endYear }, setEndMonthYear] = useState({
        endMonth: today.getMonth(),
        endYear: today.getFullYear(),
    });
    const [endPopoverActive, setEndPopoverActive] = useState(false);
    const [hasEndDate, setHasEndDate] = useState(false);

    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (actionData?.success) {
            setShowToast(true);
            setTimeout(() => navigate("/app/discount"), 2000);
        }
    }, [actionData, navigate]);

    /* ------------ DATE HELPERS ------------ */

    const formatDate = useCallback((date) => {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }, []);

    const handleStartDateChange = useCallback((range) => {
        setStartDate(range.start);
        setStartPopoverActive(false);
    }, []);

    const handleEndDateChange = useCallback((range) => {
        setEndDate(range.start);
        setEndPopoverActive(false);
    }, []);

    const handleStartMonthChange = useCallback(
        (month, year) => setStartMonthYear({ startMonth: month, startYear: year }),
        [],
    );

    const handleEndMonthChange = useCallback(
        (month, year) => setEndMonthYear({ endMonth: month, endYear: year }),
        [],
    );

    const combineDateAndTime = useCallback((date, time) => {
        const [hours, minutes] = time.split(":").map(Number);
        const combined = new Date(date);
        combined.setHours(hours, minutes, 0, 0);
        return combined.toISOString();
    }, []);

    /* ---------------- HANDLERS ---------------- */

    const selectResources = async (context = "standard") => {
        let resourceType = appliesTo === "specific_collections" ? "collection" : "product";
        if (context === "buys") resourceType = bxgyBuysType[0] === "collections" ? "collection" : "product";
        if (context === "gets") resourceType = bxgyGetsType[0] === "collections" ? "collection" : "product";

        const selected = await shopify.resourcePicker({
            type: resourceType,
            multiple: true,
            selectionIds: context === "buys" ? bxgyBuysResources.map(r => ({ id: r.id })) : context === "gets" ? bxgyGetsResources.map(r => ({ id: r.id })) : selectedResources.map(r => ({ id: r.id }))
        });

        if (selected) {
            const mapped = selected.map(item => ({
                id: item.id,
                title: item.title,
                handle: item.handle,
                image: item.images?.[0]?.originalSrc || item.image?.originalSrc
            }));

            if (context === "buys") setBxgyBuysResources(mapped);
            else if (context === "gets") setBxgyGetsResources(mapped);
            else setSelectedResources(mapped);
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

        if (type[0] === "bxgy") {
            items.push(`Buy ${bxgyBuysQuantity} get ${bxgyGetsQuantity} ${bxgyGetsValueType === "free" ? "free" : bxgyGetsValueType === "percentage" ? bxgyGetsValue + "% off" : "₹" + bxgyGetsValue + " off"}`);
        } else if (type[0] === "free_shipping") {
            items.push("Free shipping");
        } else {
            if (discountValueType === "percentage" && value) {
                items.push(`${value}% off`);
            } else if (value) {
                items.push(`₹${value} off`);
            }
        }

        if (type[0] === "amount_off_products" || type[0] === "amount_off_order") {
            if (appliesTo === "all_products") items.push(type[0] === "amount_off_order" ? "Applies to entire order" : "Applies to all products");
            else if (selectedResources.length > 0) {
                items.push(`Applies to ${selectedResources.length} ${appliesTo === "specific_collections" ? "collections" : "products"}`);
            }
        }

        items.push(`Code: ${code || "Not set"}`);
        items.push(`Starts ${formatDate(startDate)} at ${startTime}`);
        if (hasEndDate && endDate) items.push(`Ends ${formatDate(endDate)} at ${endTime}`);

        return items;
    }, [type, value, discountValueType, appliesTo, selectedResources, code, startDate, startTime, endDate, endTime, hasEndDate, formatDate]);

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
                    formData.append("startDate", combineDateAndTime(startDate, startTime));
                    if (hasEndDate) formData.append("endDate", combineDateAndTime(endDate, endTime));

                    if (type[0] === "bxgy") {
                        formData.append("bxgyBuysType", bxgyBuysType[0]);
                        formData.append("bxgyBuysResources", JSON.stringify(bxgyBuysResources));
                        formData.append("bxgyBuysQuantity", bxgyBuysQuantity);
                        formData.append("bxgyGetsType", bxgyGetsType[0]);
                        formData.append("bxgyGetsResources", JSON.stringify(bxgyGetsResources));
                        formData.append("bxgyGetsValueType", bxgyGetsValueType);
                        formData.append("bxgyGetsValue", bxgyGetsValue);
                        formData.append("bxgyGetsQuantity", bxgyGetsQuantity);
                        formData.append("bxgyRepeatOncePerOrder", bxgyRepeatOncePerOrder);
                    } else if (type[0] === "free_shipping") {
                        formData.append("countriesType", countriesType[0]);
                        formData.append("selectedCountries", JSON.stringify(selectedCountries));
                        formData.append("minimumRequirement", minimumRequirement[0]);
                        formData.append("minimumPurchaseAmount", minimumPurchaseAmount);
                        formData.append("minimumQuantity", minimumQuantity);
                    } else {
                        formData.append("valueType", discountValueType);
                        formData.append("value", value);
                        const selType = (type[0] === "amount_off_order") ? "all" : (appliesTo === "all_products" ? "all" : appliesTo === "specific_collections" ? "collections" : "products");
                        formData.append("selectionType", selType);
                        formData.append("selectedResources", JSON.stringify(selectedResources));
                        formData.append("minimumRequirement", minimumRequirement[0]);
                        formData.append("minimumPurchaseAmount", minimumPurchaseAmount);
                        formData.append("minimumQuantity", minimumQuantity);
                        formData.append("oncePerOrder", oncePerOrder);
                    }

                    formData.append("limitTotalUses", limitTotalUses);
                    formData.append("totalUsesLimit", totalUsesLimit);
                    formData.append("limitOnePerCustomer", limitOnePerCustomer);
                    formData.append("combineProduct", combineProduct);
                    formData.append("combineOrder", combineOrder);
                    formData.append("combineShipping", combineShipping);
                    submit(formData, { method: "post" });
                },
                loading: isSubmitting,
                disabled: !code || (type[0] !== "bxgy" && type[0] !== "free_shipping" && !value) || (type[0] === "amount_off_products" && appliesTo !== "all_products" && selectedResources.length === 0),
            }}
        >
            <Layout>
                <Layout.Section>
                    <BlockStack gap="400">
                        {/* DISCOUNT TYPE CARD */}
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Discount type</Text>
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

                        {/* DISCOUNT VALUE CARD */}
                        {type[0] !== "bxgy" && type[0] !== "free_shipping" && (
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h2">Discount value</Text>
                                    <Select
                                        label="Discount type"
                                        options={[
                                            { label: "Percentage", value: "percentage" },
                                            { label: "Fixed amount", value: "fixed_amount" },
                                        ]}
                                        value={discountValueType}
                                        onChange={setDiscountValueType}
                                    />
                                    {discountValueType === "percentage" ? (
                                        <BlockStack gap="200">
                                            <TextField
                                                label="Percentage"
                                                type="number"
                                                value={value}
                                                onChange={setValue}
                                                suffix="%"
                                                autoComplete="off"
                                            />
                                            {type[0] === "amount_off_products" ? (
                                                <Text variant="bodySm" tone="subdued">
                                                    Applies a percentage discount to each eligible product.
                                                </Text>
                                            ) : type[0] === "amount_off_order" ? (
                                                <BlockStack gap="100">
                                                    <Text variant="bodySm" tone="subdued">
                                                        Applies a percentage discount to the total order value.
                                                    </Text>
                                                    <Text variant="bodySm" tone="subdued">
                                                        Example: 10% off means 10% is deducted from the cart total at checkout.
                                                    </Text>
                                                </BlockStack>
                                            ) : null}
                                        </BlockStack>
                                    ) : (
                                        <BlockStack gap="200">
                                            <TextField
                                                label="Fixed amount"
                                                type="number"
                                                value={value}
                                                onChange={setValue}
                                                prefix="₹"
                                                autoComplete="off"
                                            />
                                            {type[0] === "amount_off_products" ? (
                                                <>
                                                    <Text variant="bodySm" tone="subdued">
                                                        Applies a fixed discount to each eligible product. Example: ₹100 off means ₹100 is deducted from every qualifying product.
                                                    </Text>
                                                    <Checkbox
                                                        label="Once per order"
                                                        helpText="If not selected, the amount will be taken off each eligible item in an order."
                                                        checked={oncePerOrder}
                                                        onChange={setOncePerOrder}
                                                    />
                                                </>
                                            ) : type[0] === "amount_off_order" ? (
                                                <BlockStack gap="100">
                                                    <Text variant="bodySm" tone="subdued">
                                                        Applies a fixed discount to the total order value.
                                                    </Text>
                                                    <Text variant="bodySm" tone="subdued">
                                                        Example: ₹200 off means ₹200 is deducted from the cart total at checkout.
                                                    </Text>
                                                </BlockStack>
                                            ) : null}
                                        </BlockStack>
                                    )}
                                </BlockStack>
                            </Card>
                        )}

                        {/* BUY X GET Y: CUSTOMER BUYS (X) */}
                        {type[0] === "bxgy" && (
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h2">Customer buys</Text>
                                    <ChoiceList
                                        label="Applies to"
                                        choices={[
                                            { label: "Specific products", value: "products" },
                                            { label: "Specific collections", value: "collections" },
                                        ]}
                                        selected={bxgyBuysType}
                                        onChange={setBxgyBuysType}
                                    />
                                    <InlineStack gap="200">
                                        <div style={{ flex: 1 }}>
                                            <TextField
                                                placeholder={`Search ${bxgyBuysType[0]}`}
                                                value={resourceSearch}
                                                onChange={setResourceSearch}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <Button onClick={() => selectResources("buys")}>Browse</Button>
                                    </InlineStack>
                                    {bxgyBuysResources.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                                            {bxgyBuysResources.map(res => (
                                                <Box key={res.id} padding="100" border="divider" borderRadius="200">
                                                    <BlockStack align="center" gap="100">
                                                        <Thumbnail source={res.image || (bxgyBuysType[0] === "collections" ? CollectionIcon : ProductIcon)} size="small" />
                                                        <Text variant="bodyXs" truncate>{res.title}</Text>
                                                    </BlockStack>
                                                </Box>
                                            ))}
                                        </div>
                                    )}
                                    <TextField
                                        label="Minimum quantity"
                                        type="number"
                                        value={bxgyBuysQuantity}
                                        onChange={setBxgyBuysQuantity}
                                        helpText="The customer must buy at least this quantity to qualify for the discount."
                                        autoComplete="off"
                                    />
                                </BlockStack>
                            </Card>
                        )}

                        {/* BUY X GET Y: CUSTOMER GETS (Y) */}
                        {type[0] === "bxgy" && (
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h2">Customer gets</Text>
                                    <ChoiceList
                                        label="Applies to"
                                        choices={[
                                            { label: "Same products as X", value: "same" },
                                            { label: "Specific products", value: "products" },
                                            { label: "Specific collections", value: "collections" },
                                        ]}
                                        selected={bxgyGetsType}
                                        onChange={setBxgyGetsType}
                                    />
                                    {bxgyGetsType[0] !== "same" && (
                                        <>
                                            <InlineStack gap="200">
                                                <div style={{ flex: 1 }}>
                                                    <TextField
                                                        placeholder={`Search ${bxgyGetsType[0]}`}
                                                        value={resourceSearch}
                                                        onChange={setResourceSearch}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <Button onClick={() => selectResources("gets")}>Browse</Button>
                                            </InlineStack>
                                            {bxgyGetsResources.length > 0 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                                                    {bxgyGetsResources.map(res => (
                                                        <Box key={res.id} padding="100" border="divider" borderRadius="200">
                                                            <BlockStack align="center" gap="100">
                                                                <Thumbnail source={res.image || (bxgyGetsType[0] === "collections" ? CollectionIcon : ProductIcon)} size="small" />
                                                                <Text variant="bodyXs" truncate>{res.title}</Text>
                                                            </BlockStack>
                                                        </Box>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <Divider />
                                    <Select
                                        label="Discount value"
                                        options={[
                                            { label: "Free", value: "free" },
                                            { label: "Percentage off", value: "percentage" },
                                            { label: "Amount off", value: "fixed_amount" },
                                        ]}
                                        value={bxgyGetsValueType}
                                        onChange={setBxgyGetsValueType}
                                    />
                                    {bxgyGetsValueType !== "free" && (
                                        <TextField
                                            label={bxgyGetsValueType === "percentage" ? "Percentage off" : "Amount off"}
                                            type="number"
                                            value={bxgyGetsValue}
                                            onChange={setBxgyGetsValue}
                                            suffix={bxgyGetsValueType === "percentage" ? "%" : null}
                                            prefix={bxgyGetsValueType === "fixed_amount" ? "₹" : null}
                                            autoComplete="off"
                                        />
                                    )}
                                    <TextField
                                        label="Quantity"
                                        type="number"
                                        value={bxgyGetsQuantity}
                                        onChange={setBxgyGetsQuantity}
                                        helpText="Number of items the customer will receive at a discount."
                                        autoComplete="off"
                                    />
                                    <Checkbox
                                        label="Apply discount once per order"
                                        helpText="If unchecked, the discount repeats for every eligible group of items."
                                        checked={bxgyRepeatOncePerOrder}
                                        onChange={setBxgyRepeatOncePerOrder}
                                    />
                                </BlockStack>
                            </Card>
                        )}

                        {/* FREE SHIPPING: COUNTRIES */}
                        {type[0] === "free_shipping" && (
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h2">Countries</Text>
                                    <ChoiceList
                                        label="Countries"
                                        choices={[
                                            { label: "All countries", value: "all" },
                                            { label: "Specific countries", value: "specific" },
                                        ]}
                                        selected={countriesType}
                                        onChange={setCountriesType}
                                    />
                                    {countriesType[0] === "specific" && (
                                        <BlockStack gap="300">
                                            <InlineStack gap="200">
                                                <div style={{ flex: 1 }}>
                                                    <TextField
                                                        placeholder="Search countries"
                                                        value={""}
                                                        autoComplete="off"
                                                        readOnly
                                                        onFocus={() => {
                                                            setTempSelectedCountries(selectedCountries);
                                                            setCountryModalActive(true);
                                                        }}
                                                    />
                                                </div>
                                                <Button onClick={() => {
                                                    setTempSelectedCountries(selectedCountries);
                                                    setCountryModalActive(true);
                                                }}>Browse</Button>
                                            </InlineStack>

                                            {selectedCountries.length > 0 && (
                                                <Box border="divider" borderRadius="200" padding="0">
                                                    <Scrollable style={{ maxHeight: '150px' }}>
                                                        <BlockStack gap="0">
                                                            {selectedCountries.map(code => {
                                                                const country = COUNTRIES.find(c => c.value === code);
                                                                return (
                                                                    <div key={code} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f1f1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                        <InlineStack gap="200" blockAlign="center">
                                                                            <Text variant="bodyMd">{country?.flag || "🏳️"}</Text>
                                                                            <Text variant="bodyMd">{country?.label || code}</Text>
                                                                        </InlineStack>
                                                                        <Button
                                                                            variant="tertiary"
                                                                            icon={DiscountIcon} // Using a placeholder for cross or just text
                                                                            onClick={() => setSelectedCountries(prev => prev.filter(c => c !== code))}
                                                                        >
                                                                            Remove
                                                                        </Button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </BlockStack>
                                                    </Scrollable>
                                                </Box>
                                            )}

                                            <Modal
                                                open={countryModalActive}
                                                onClose={() => setCountryModalActive(false)}
                                                title="Select countries"
                                                primaryAction={{
                                                    content: `Add (${tempSelectedCountries.length})`,
                                                    onAction: () => {
                                                        setSelectedCountries(tempSelectedCountries);
                                                        setCountryModalActive(false);
                                                    }
                                                }}
                                                secondaryActions={[
                                                    {
                                                        content: "Cancel",
                                                        onAction: () => setCountryModalActive(false)
                                                    }
                                                ]}
                                            >
                                                <Modal.Section>
                                                    <BlockStack gap="400">
                                                        <TextField
                                                            prefix={<Icon source={DiscountIcon} />}
                                                            placeholder="Search countries"
                                                            value={countrySearch}
                                                            onChange={setCountrySearch}
                                                            autoComplete="off"
                                                        />
                                                        <Scrollable style={{ height: '300px' }}>
                                                            <div style={{ padding: '8px 0' }}>
                                                                {COUNTRIES.filter(c => c.label.toLowerCase().includes(countrySearch.toLowerCase())).map(country => {
                                                                    const isSelected = tempSelectedCountries.includes(country.value);
                                                                    return (
                                                                        <div
                                                                            key={country.value}
                                                                            style={{
                                                                                padding: '8px 12px',
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                borderBottom: '1px solid #f1f1f1'
                                                                            }}
                                                                        >
                                                                            <InlineStack gap="200" blockAlign="center">
                                                                                <Text variant="bodyMd">{country.flag}</Text>
                                                                                <Text variant="bodyMd">{country.label}</Text>
                                                                            </InlineStack>
                                                                            <Button
                                                                                variant={isSelected ? "primary" : "secondary"}
                                                                                onClick={() => {
                                                                                    if (isSelected) {
                                                                                        setTempSelectedCountries(prev => prev.filter(c => c !== country.value));
                                                                                    } else {
                                                                                        setTempSelectedCountries(prev => [...prev, country.value]);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {isSelected ? "Remove" : "Add"}
                                                                            </Button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </Scrollable>
                                                    </BlockStack>
                                                </Modal.Section>
                                            </Modal>
                                        </BlockStack>
                                    )}
                                </BlockStack>
                            </Card>
                        )}

                        {/* APPLIES TO CARD (UNIFIED) */}
                        {(type[0] === "amount_off_products" || type[0] === "amount_off_order") && (
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h2">Applies to</Text>
                                    <Select
                                        label="Applies to"
                                        options={[
                                            { label: type[0] === "amount_off_order" ? "Entire order" : "All products", value: "all_products" },
                                            { label: "Specific collections", value: "specific_collections" },
                                            { label: "Specific products", value: "specific_products" },
                                        ]}
                                        value={appliesTo}
                                        onChange={(val) => { setAppliesTo(val); setSelectedResources([]); }}
                                    />
                                    {appliesTo === "all_products" && (
                                        <Text variant="bodyMd">
                                            {type[0] === "amount_off_order" ? "This discount applies to the entire order." : "This discount applies to all products."}
                                        </Text>
                                    )}
                                    {appliesTo === "specific_collections" && (
                                        <BlockStack gap="300">
                                            <InlineStack gap="200">
                                                <div style={{ flex: 1 }}>
                                                    <TextField
                                                        placeholder="Search collections"
                                                        value={resourceSearch}
                                                        onChange={setResourceSearch}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <Button onClick={selectResources}>Browse</Button>
                                            </InlineStack>
                                            <Text variant="bodySm" tone="subdued">
                                                The discount is applied per eligible product, not on the total order.
                                            </Text>
                                            {selectedResources.length > 0 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                                                    {selectedResources.map(res => (
                                                        <Box key={res.id} padding="100" border="divider" borderRadius="200">
                                                            <BlockStack align="center" gap="100">
                                                                <Thumbnail source={res.image || CollectionIcon} size="small" />
                                                                <Text variant="bodyXs" truncate>{res.title}</Text>
                                                            </BlockStack>
                                                        </Box>
                                                    ))}
                                                </div>
                                            )}
                                        </BlockStack>
                                    )}
                                    {appliesTo === "specific_products" && (
                                        <BlockStack gap="300">
                                            <InlineStack gap="200">
                                                <div style={{ flex: 1 }}>
                                                    <TextField
                                                        placeholder="Search products"
                                                        value={resourceSearch}
                                                        onChange={setResourceSearch}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <Button onClick={selectResources}>Browse</Button>
                                            </InlineStack>
                                            {selectedResources.length > 0 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                                                    {selectedResources.map(res => (
                                                        <Box key={res.id} padding="100" border="divider" borderRadius="200">
                                                            <BlockStack align="center" gap="100">
                                                                <Thumbnail source={res.image || ProductIcon} size="small" />
                                                                <Text variant="bodyXs" truncate>{res.title}</Text>
                                                            </BlockStack>
                                                        </Box>
                                                    ))}
                                                </div>
                                            )}
                                        </BlockStack>
                                    )}
                                </BlockStack>
                            </Card>
                        )}



                        {/* MINIMUM PURCHASE REQUIREMENTS CARD (STANDARD) */}
                        {type[0] !== "bxgy" && (
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h2">Minimum purchase requirements</Text>
                                    <ChoiceList
                                        choices={[
                                            { label: "No minimum requirements", value: "none" },
                                            { label: "Minimum purchase amount (₹)", value: "amount" },
                                            { label: "Minimum quantity of items", value: "quantity" },
                                        ]}
                                        selected={minimumRequirement}
                                        onChange={setMinimumRequirement}
                                    />
                                    {minimumRequirement[0] === "amount" && (
                                        <TextField
                                            label="Minimum purchase amount"
                                            type="number"
                                            value={minimumPurchaseAmount}
                                            onChange={setMinimumPurchaseAmount}
                                            prefix="₹"
                                            autoComplete="off"
                                        />
                                    )}
                                    <Text variant="bodySm" tone="subdued">
                                        The discount is applied only if the order meets the selected requirement.
                                    </Text>
                                    {minimumRequirement[0] === "quantity" && (
                                        <TextField
                                            label="Minimum quantity of items"
                                            type="number"
                                            value={minimumQuantity}
                                            onChange={setMinimumQuantity}
                                            autoComplete="off"
                                        />
                                    )}
                                </BlockStack>
                            </Card>
                        )}

                        {/* MAXIMUM DISCOUNT USES CARD */}
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Maximum discount uses</Text>
                                <BlockStack gap="200">
                                    <Checkbox
                                        label="Limit number of times this discount can be used in total"
                                        checked={limitTotalUses}
                                        onChange={setLimitTotalUses}
                                    />
                                    {limitTotalUses && (
                                        <Box paddingInlineStart="800">
                                            <TextField
                                                label="Total usage limit"
                                                type="number"
                                                value={totalUsesLimit}
                                                onChange={setTotalUsesLimit}
                                                autoComplete="off"
                                            />
                                        </Box>
                                    )}
                                </BlockStack>
                                <Checkbox
                                    label="Limit to one use per customer"
                                    checked={limitOnePerCustomer}
                                    onChange={setLimitOnePerCustomer}
                                />
                            </BlockStack>
                        </Card>

                        {/* COMBINATIONS CARD */}
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Combinations</Text>
                                <Checkbox
                                    label="Product discounts"
                                    checked={combineProduct}
                                    onChange={setCombineProduct}
                                />
                                <Checkbox
                                    label="Order discounts"
                                    checked={combineOrder}
                                    onChange={setCombineOrder}
                                />
                                <Checkbox
                                    label="Shipping discounts"
                                    checked={combineShipping}
                                    onChange={setCombineShipping}
                                />
                            </BlockStack>
                        </Card>

                        {/* ACTIVE DATES CARD */}
                        <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd" as="h2">Active dates</Text>

                                {/* Start Date */}
                                <InlineStack gap="300" blockAlign="end">
                                    <Box minWidth="220px">
                                        <BlockStack gap="100">
                                            <Text variant="bodyMd" as="label" fontWeight="medium">Start date</Text>
                                            <Popover
                                                active={startPopoverActive}
                                                activator={
                                                    <Button
                                                        onClick={() => setStartPopoverActive(prev => !prev)}
                                                        icon={CalendarIcon}
                                                        fullWidth
                                                        textAlign="left"
                                                    >
                                                        {formatDate(startDate)}
                                                    </Button>
                                                }
                                                onClose={() => setStartPopoverActive(false)}
                                                autofocusTarget="none"
                                                preferredAlignment="left"
                                            >
                                                <div style={{ padding: "16px" }}>
                                                    <DatePicker
                                                        month={startMonth}
                                                        year={startYear}
                                                        onChange={handleStartDateChange}
                                                        onMonthChange={handleStartMonthChange}
                                                        selected={startDate}
                                                    />
                                                </div>
                                            </Popover>
                                        </BlockStack>
                                    </Box>
                                    <Box minWidth="140px">
                                        <TextField
                                            label="Start time"
                                            type="time"
                                            value={startTime}
                                            onChange={setStartTime}
                                        />
                                    </Box>
                                </InlineStack>

                                {/* End Date Toggle */}
                                <Checkbox
                                    label="Set end date"
                                    checked={hasEndDate}
                                    onChange={setHasEndDate}
                                />

                                {/* End Date (conditional) */}
                                {hasEndDate && (
                                    <InlineStack gap="300" blockAlign="end">
                                        <Box minWidth="220px">
                                            <BlockStack gap="100">
                                                <Text variant="bodyMd" as="label" fontWeight="medium">End date</Text>
                                                <Popover
                                                    active={endPopoverActive}
                                                    activator={
                                                        <Button
                                                            onClick={() => setEndPopoverActive(prev => !prev)}
                                                            icon={CalendarIcon}
                                                            fullWidth
                                                            textAlign="left"
                                                        >
                                                            {formatDate(endDate)}
                                                        </Button>
                                                    }
                                                    onClose={() => setEndPopoverActive(false)}
                                                    autofocusTarget="none"
                                                    preferredAlignment="left"
                                                >
                                                    <div style={{ padding: "16px" }}>
                                                        <DatePicker
                                                            month={endMonth}
                                                            year={endYear}
                                                            onChange={handleEndDateChange}
                                                            onMonthChange={handleEndMonthChange}
                                                            selected={endDate}
                                                            disableDatesBefore={startDate}
                                                        />
                                                    </div>
                                                </Popover>
                                            </BlockStack>
                                        </Box>
                                        <Box minWidth="140px">
                                            <TextField
                                                label="End time"
                                                type="time"
                                                value={endTime}
                                                onChange={setEndTime}
                                            />
                                        </Box>
                                    </InlineStack>
                                )}
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
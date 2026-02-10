import {
  Page,
  Card,
  IndexTable,
  Text,
  Badge,
  Tabs,
  InlineStack,
  Button,
  TextField,
  Select,
  Spinner,
} from "@shopify/polaris";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

/* ---------------- LOADER ---------------- */
// You already wrote this loader.
// Keep it EXACTLY as-is in this file.
export { loader } from "./api.shopify-coupons";

/* ---------------- HELPERS ---------------- */

function statusBadge(status) {
  switch (status) {
    case "ACTIVE":
      return <Badge tone="success">Active</Badge>;
    case "SCHEDULED":
      return <Badge tone="info">Scheduled</Badge>;
    case "EXPIRED":
      return <Badge tone="critical">Expired</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
}

function discountTypeLabel(type) {
  if (!type) return "-";
  if (type.includes("FreeShipping")) return "Free shipping";
  if (type.includes("Bxgy")) return "Buy X Get Y";
  if (type.includes("Basic")) return "Amount off";
  return type;
}

/* ---------------- COMPONENT ---------------- */

export default function AppDiscounts() {
  const navigate = useNavigate();
  const data = useLoaderData();

  const coupons = data?.coupons || [];

  /* ---------------- STATE ---------------- */

  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");

  /* ---------------- FILTER LOGIC ---------------- */

  const filteredCoupons = useMemo(() => {
    let result = [...coupons];

    // Tab filter
    if (tabIndex === 1) result = result.filter(c => c.status === "ACTIVE");
    if (tabIndex === 2) result = result.filter(c => c.status === "SCHEDULED");
    if (tabIndex === 3) result = result.filter(c => c.status === "EXPIRED");

    // Search
    if (search) {
      result = result.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sort === "latest") {
        return new Date(b.starts_at) - new Date(a.starts_at);
      }
      return new Date(a.starts_at) - new Date(b.starts_at);
    });

    return result;
  }, [coupons, tabIndex, search, sort]);

  /* ---------------- TABS ---------------- */

  const tabs = [
    { id: "all", content: "All" },
    { id: "active", content: "Active" },
    { id: "scheduled", content: "Scheduled" },
    { id: "expired", content: "Expired" },
  ];

  /* ---------------- EMPTY STATE ---------------- */

  if (!data) {
    return (
      <Page>
        <Spinner />
      </Page>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <Page
      title="Coupon"
      primaryAction={{
        content: "Create Coupon",
        onAction: () => navigate("/app/discounts/create"),
      }}
    >
      <Card>
        <InlineStack gap="300" align="space-between">
          <Tabs tabs={tabs} selected={tabIndex} onSelect={setTabIndex} />

          <InlineStack gap="200">
            <TextField
              placeholder="Search by code"
              value={search}
              onChange={setSearch}
              autoComplete="off"
            />
            <Select
              options={[
                { label: "Latest", value: "latest" },
                { label: "Oldest", value: "oldest" },
              ]}
              value={sort}
              onChange={setSort}
            />
          </InlineStack>
        </InlineStack>

        <IndexTable
          resourceName={{ singular: "discount", plural: "discounts" }}
          itemCount={filteredCoupons.length}
          selectable={false}
          headings={[
            { title: "Applies to" },
            { title: "Code" },
            { title: "Type" },
            { title: "Status" },
            { title: "Used" },
            { title: "Start date" },
            { title: "End date" },
          ]}
        >
          {filteredCoupons.map((coupon, index) => (
            <IndexTable.Row
              id={coupon.id}
              key={coupon.id}
              position={index}
              onClick={() =>
                navigate(`/app/discounts/${encodeURIComponent(coupon.id)}`)
              }
            >
              <IndexTable.Cell>
                <Text variant="bodySm" tone="subdued">
                  {coupon.subtext || "All products"}
                </Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Text>{coupon.code}</Text>
              </IndexTable.Cell>

              <IndexTable.Cell>
                {discountTypeLabel(coupon.type)}
              </IndexTable.Cell>

              <IndexTable.Cell>
                {statusBadge(coupon.status)}
              </IndexTable.Cell>

              <IndexTable.Cell>
                {coupon.used ?? 0}
              </IndexTable.Cell>

              <IndexTable.Cell>
                {coupon.starts_at
                  ? new Date(coupon.starts_at).toLocaleDateString()
                  : "-"}
              </IndexTable.Cell>

              <IndexTable.Cell>
                {coupon.ends_at
                  ? new Date(coupon.ends_at).toLocaleDateString()
                  : "-"}
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </Card>
    </Page >
  );
}

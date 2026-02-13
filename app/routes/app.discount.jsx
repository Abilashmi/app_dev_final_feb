import {
  Page,
  Card,
  IndexTable,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Text,
  Badge,
  BlockStack,
  Spinner,
  EmptyState,
  Icon,
  ChoiceList,
  LegacyCard,
  Modal,
  RadioButton,
  InlineStack,
  Box,
} from "@shopify/polaris";
import { DiscountIcon, ExportIcon } from "@shopify/polaris-icons";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";

/* ---------------- LOADER ---------------- */
export { loader } from "./api.shopify-coupons";

/* ---------------- HELPERS ---------------- */

function statusBadge(status) {
  switch (status) {
    case "ACTIVE":
      return <Badge tone="success">Active</Badge>;
    case "SCHEDULED":
      return <Badge tone="attention">Scheduled</Badge>;
    case "EXPIRED":
      return (
        <span style={{
          backgroundColor: "#d5ebff",
          color: "#004499",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "500",
          display: "inline-block"
        }}>
          Expired
        </span>
      );
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

function formatDiscountValue(coupon) {
  if (coupon.discountType === "percentage" && coupon.discountValue) {
    return `${coupon.discountValue}% off`;
  }
  if (coupon.discountType === "fixed" && coupon.discountValue) {
    return `₹${coupon.discountValue} off`;
  }
  if (coupon.discountType === "free_shipping") return "Free shipping";
  if (coupon.discountType === "bxgy") return "BXGY";
  return "-";
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildCSV(coupons, format) {
  const headers = ["Title", "Code", "Type", "Discount", "Status", "Used", "Limit", "Start Date", "End Date"];
  const rows = coupons.map((c) => [
    c.heading || c.code || "",
    c.code || "",
    discountTypeLabel(c.type),
    formatDiscountValue(c),
    c.status || "",
    c.used ?? 0,
    c.limit ?? "Unlimited",
    c.starts_at ? formatDate(c.starts_at) : "",
    c.ends_at ? formatDate(c.ends_at) : "",
  ]);

  const escapeCSV = (val) => {
    const str = String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  // For "excel" format, prepend BOM so Excel opens it correctly
  const bom = format === "excel" ? "\uFEFF" : "";
  const csv = bom + [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `coupons-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- STAT CARD ---------------- */

const STAT_STYLES = {
  total: { bg: "#f4f6f8", iconBg: "#e4e5e7" },
  active: { bg: "#e6f4ea", iconBg: "#bdf1d0" }, // Success Green theme
  scheduled: { bg: "#fff4e5", iconBg: "#ffe3b2" }, // Attention Yellow theme
  expired: { bg: "#d5ebff", iconBg: "#aed9ff" }, // Light Blue theme
};

function StatCard({ label, value, variant }) {
  const s = STAT_STYLES[variant] || STAT_STYLES.total;
  return (
    <div
      style={{
        flex: 1,
        minWidth: "140px",
        padding: "16px 20px",
        borderRadius: "12px",
        background: s.bg,
        display: "flex",
        alignItems: "center",
        gap: "14px",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: s.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon source={DiscountIcon} tone="base" />
      </div>
      <BlockStack gap="050">
        <Text variant="bodySm" tone="subdued">{label}</Text>
        <Text variant="headingLg" fontWeight="bold">{value}</Text>
      </BlockStack>
    </div>
  );
}

/* ========================================== */
/*              MAIN COMPONENT                */
/* ========================================== */

export default function AppDiscounts() {
  const navigate = useNavigate();
  const data = useLoaderData();
  const coupons = data?.coupons || [];

  // ── IndexFilters mode ──
  const { mode, setMode } = useSetIndexFiltersMode();
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // ── State ──
  const [selected, setSelected] = useState(0);
  const [queryValue, setQueryValue] = useState("");
  const [sortSelected, setSortSelected] = useState(["date desc"]);
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);

  // ── Export modal state ──
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState("current_page");
  const [exportFormat, setExportFormat] = useState("excel");

  // ── Counts ──
  const counts = useMemo(() => {
    const active = coupons.filter((c) => c.status === "ACTIVE").length;
    const scheduled = coupons.filter((c) => c.status === "SCHEDULED").length;
    const expired = coupons.filter((c) => c.status === "EXPIRED").length;
    return { total: coupons.length, active, scheduled, expired };
  }, [coupons]);

  // ── Tabs ──
  const tabs = [
    { id: "all", content: `All (${counts.total})`, index: 0 },
    { id: "active", content: `Active (${counts.active})`, index: 1 },
    { id: "scheduled", content: `Scheduled (${counts.scheduled})`, index: 2 },
    { id: "expired", content: `Expired (${counts.expired})`, index: 3 },
  ];

  // ── Sort Options ──
  const sortOptions = [
    { label: "Date", value: "date asc", directionLabel: "Oldest first" },
    { label: "Date", value: "date desc", directionLabel: "Newest first" },
    { label: "Code", value: "code asc", directionLabel: "A–Z" },
    { label: "Code", value: "code desc", directionLabel: "Z–A" },
    { label: "Usage", value: "usage asc", directionLabel: "Least used" },
    { label: "Usage", value: "usage desc", directionLabel: "Most used" },
    { label: "Value", value: "value asc", directionLabel: "Lowest" },
    { label: "Value", value: "value desc", directionLabel: "Highest" },
  ];

  // ── Filter callbacks ──
  const handleTypeFilterChange = useCallback((value) => setTypeFilter(value), []);
  const handleStatusFilterChange = useCallback((value) => setStatusFilter(value), []);
  const handleTypeFilterRemove = useCallback(() => setTypeFilter(undefined), []);
  const handleStatusFilterRemove = useCallback(() => setStatusFilter(undefined), []);
  const handleQueryChange = useCallback((value) => setQueryValue(value), []);
  const handleQueryClear = useCallback(() => setQueryValue(""), []);
  const handleFiltersClearAll = useCallback(() => {
    handleTypeFilterRemove();
    handleStatusFilterRemove();
    handleQueryClear();
  }, [handleTypeFilterRemove, handleStatusFilterRemove, handleQueryClear]);

  const onHandleCancel = () => { };
  const onHandleSave = async () => {
    await sleep(1);
    return true;
  };

  // ── Filters config ──
  const filters = [
    {
      key: "type",
      label: "Discount type",
      filter: (
        <ChoiceList
          title="Discount type"
          titleHidden
          choices={[
            { label: "Amount off", value: "Basic" },
            { label: "Buy X Get Y", value: "Bxgy" },
            { label: "Free shipping", value: "FreeShipping" },
          ]}
          selected={typeFilter || []}
          onChange={handleTypeFilterChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: "status",
      label: "Status",
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            { label: "Active", value: "ACTIVE" },
            { label: "Scheduled", value: "SCHEDULED" },
            { label: "Expired", value: "EXPIRED" },
          ]}
          selected={statusFilter || []}
          onChange={handleStatusFilterChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  // ── Applied filters ──
  const appliedFilters = [];
  if (typeFilter && typeFilter.length > 0) {
    appliedFilters.push({
      key: "type",
      label: `Type: ${typeFilter.map((t) => {
        if (t === "Basic") return "Amount off";
        if (t === "Bxgy") return "Buy X Get Y";
        if (t === "FreeShipping") return "Free shipping";
        return t;
      }).join(", ")}`,
      onRemove: handleTypeFilterRemove,
    });
  }
  if (statusFilter && statusFilter.length > 0) {
    appliedFilters.push({
      key: "status",
      label: `Status: ${statusFilter.join(", ")}`,
      onRemove: handleStatusFilterRemove,
    });
  }

  // ── Filter + Sort logic ──
  const filteredCoupons = useMemo(() => {
    let result = [...coupons];

    if (selected === 1) result = result.filter((c) => c.status === "ACTIVE");
    if (selected === 2) result = result.filter((c) => c.status === "SCHEDULED");
    if (selected === 3) result = result.filter((c) => c.status === "EXPIRED");

    if (queryValue) {
      const q = queryValue.toLowerCase();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          (c.heading && c.heading.toLowerCase().includes(q))
      );
    }

    if (typeFilter && typeFilter.length > 0) {
      result = result.filter((c) =>
        typeFilter.some((t) => c.type && c.type.includes(t))
      );
    }

    if (statusFilter && statusFilter.length > 0) {
      result = result.filter((c) => statusFilter.includes(c.status));
    }

    const [sortKey, sortDir] = (sortSelected[0] || "date desc").split(" ");
    const dir = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      switch (sortKey) {
        case "date":
          return dir * (new Date(a.starts_at) - new Date(b.starts_at));
        case "code":
          return dir * (a.code || "").localeCompare(b.code || "");
        case "usage":
          return dir * ((a.used || 0) - (b.used || 0));
        case "value":
          return dir * ((a.discountValue || 0) - (b.discountValue || 0));
        default:
          return dir * (new Date(a.starts_at) - new Date(b.starts_at));
      }
    });

    return result;
  }, [coupons, selected, queryValue, typeFilter, statusFilter, sortSelected]);

  // ── useIndexResourceState ──
  const resourceName = { singular: "coupon", plural: "coupons" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredCoupons);

  // ── Determine if search/filter is active ──
  const hasActiveSearch = queryValue.length > 0 || (typeFilter && typeFilter.length > 0) || (statusFilter && statusFilter.length > 0) || selected !== 0;
  const selectedCount = selectedResources.length;

  // ── Export handler ──
  const handleExport = useCallback(() => {
    let dataToExport;
    switch (exportScope) {
      case "all":
        dataToExport = coupons;
        break;
      case "selected":
        dataToExport = filteredCoupons.filter((c) =>
          selectedResources.includes(c.id)
        );
        break;
      case "search":
        dataToExport = filteredCoupons;
        break;
      case "current_page":
      default:
        dataToExport = filteredCoupons;
        break;
    }
    buildCSV(dataToExport, exportFormat);
    setExportModalOpen(false);
  }, [exportScope, exportFormat, coupons, filteredCoupons, selectedResources]);

  // ── Row markup ──
  const rowMarkup = filteredCoupons.map(
    (coupon, index) => (
      <IndexTable.Row
        id={coupon.id}
        key={coupon.id}
        selected={selectedResources.includes(coupon.id)}
        position={index}
        onClick={() =>
          navigate(`/app/discounts/${encodeURIComponent(coupon.id)}`)
        }
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {coupon.heading || coupon.code}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" tone="subdued">
            {coupon.code}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{discountTypeLabel(coupon.type)}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            {formatDiscountValue(coupon)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{statusBadge(coupon.status)}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" numeric>
            {coupon.used ?? 0}{coupon.limit ? ` / ${coupon.limit}` : ""}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{formatDate(coupon.starts_at)}</IndexTable.Cell>
        <IndexTable.Cell>{formatDate(coupon.ends_at)}</IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  // ── Export Modal ──
  const exportModal = (
    <Modal
      open={exportModalOpen}
      onClose={() => setExportModalOpen(false)}
      title="Export discounts"
      primaryAction={{
        content: "Export discounts",
        onAction: handleExport,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: () => setExportModalOpen(false),
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text variant="headingSm" as="h3">Export</Text>
            <RadioButton
              label="Current page"
              checked={exportScope === "current_page"}
              id="export-current"
              name="exportScope"
              onChange={() => setExportScope("current_page")}
            />
            <RadioButton
              label="All discounts"
              checked={exportScope === "all"}
              id="export-all"
              name="exportScope"
              onChange={() => setExportScope("all")}
            />
            <RadioButton
              label={`Selected: ${selectedCount} discount${selectedCount !== 1 ? "s" : ""}`}
              checked={exportScope === "selected"}
              id="export-selected"
              name="exportScope"
              onChange={() => setExportScope("selected")}
              disabled={selectedCount === 0}
            />
            <RadioButton
              label={`${filteredCoupons.length} discount${filteredCoupons.length !== 1 ? "s" : ""} matching your search`}
              checked={exportScope === "search"}
              id="export-search"
              name="exportScope"
              onChange={() => setExportScope("search")}
              disabled={!hasActiveSearch}
            />
          </BlockStack>

          <BlockStack gap="200">
            <Text variant="headingSm" as="h3">Export as</Text>
            <RadioButton
              label="CSV for Excel, Numbers, or other spreadsheet programs"
              checked={exportFormat === "excel"}
              id="format-excel"
              name="exportFormat"
              onChange={() => setExportFormat("excel")}
            />
            <RadioButton
              label="Plain CSV file"
              checked={exportFormat === "plain"}
              id="format-plain"
              name="exportFormat"
              onChange={() => setExportFormat("plain")}
            />
          </BlockStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );

  // ── Loading ──
  if (!data) {
    return (
      <Page title="Coupons" fullWidth>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <Spinner accessibilityLabel="Loading coupons" size="large" />
        </div>
      </Page>
    );
  }

  // ── Empty state ──
  if (coupons.length === 0) {
    return (
      <Page
        title="Coupons"
        fullWidth
        primaryAction={{
          content: "Create Coupon",
          onAction: () => navigate("/app/discounts/create"),
        }}
      >
        <Card>
          <EmptyState
            heading="Create your first coupon"
            action={{
              content: "Create Coupon",
              onAction: () => navigate("/app/discounts/create"),
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>
              Start offering discounts to boost conversions and drive more
              sales. Your coupons will appear here once created.
            </p>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  // ══════════════════════════════════════════
  //                  RENDER
  // ══════════════════════════════════════════

  return (
    <Page
      title="Coupons"
      fullWidth
      primaryAction={{
        content: "Create Coupon",
        onAction: () => navigate("/app/discounts/create"),
      }}
      secondaryActions={[
        {
          content: "Export",
          icon: ExportIcon,
          onAction: () => setExportModalOpen(true),
        },
      ]}
    >
      {exportModal}

      <BlockStack gap="400">
        {/* ── Summary Stats ── */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <StatCard label="Total Coupons" value={counts.total} variant="total" />
          <StatCard label="Active" value={counts.active} variant="active" />
          <StatCard label="Scheduled" value={counts.scheduled} variant="scheduled" />
          <StatCard label="Expired" value={counts.expired} variant="expired" />
        </div>

        {/* ── IndexFilters + IndexTable ── */}
        <LegacyCard>
          <IndexFilters
            sortOptions={sortOptions}
            sortSelected={sortSelected}
            queryValue={queryValue}
            queryPlaceholder="Searching in all"
            onQueryChange={handleQueryChange}
            onQueryClear={handleQueryClear}
            onSort={setSortSelected}
            cancelAction={{
              onAction: onHandleCancel,
              disabled: false,
              loading: false,
            }}
            tabs={tabs}
            selected={selected}
            onSelect={setSelected}
            filters={filters}
            appliedFilters={appliedFilters}
            onClearAll={handleFiltersClearAll}
            mode={mode}
            setMode={setMode}
          />
          <IndexTable
            resourceName={resourceName}
            itemCount={filteredCoupons.length}
            selectedItemsCount={
              allResourcesSelected ? "All" : selectedResources.length
            }
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Title" },
              { title: "Code" },
              { title: "Type" },
              { title: "Discount" },
              { title: "Status" },
              { title: "Used" },
              { title: "Start date" },
              { title: "End date" },
            ]}
          >
            {rowMarkup}
          </IndexTable>
        </LegacyCard>
      </BlockStack>
    </Page>
  );
}

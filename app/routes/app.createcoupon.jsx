import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Page,
  Card,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Divider,
  Text,
  Badge,
  Select,
  Popover,
  ActionList,
  Icon,
  Pagination,
  Modal,
  Checkbox,
  ChoiceList,
} from "@shopify/polaris";
import { SearchIcon, PlusIcon, DiscountIcon, ChevronLeftIcon, ChevronRightIcon, ExportIcon } from "@shopify/polaris-icons";

function CouponList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [sortMenuActive, setSortMenuActive] = useState(false);
  const [sortField, setSortField] = useState("created");
  const [sortDirection, setSortDirection] = useState("latest");
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 16;
const [exportModalOpen, setExportModalOpen] = useState(false);
const [exportFormat, setExportFormat] = useState("current");
const [exportFileFormat, setExportFileFormat] = useState("csv-excel");
const [selectedProducts, setSelectedProducts] = useState([]);
const [selectedDiscountType, setSelectedDiscountType] = useState(null);
const [selectedCoupons, setSelectedCoupons] = useState([]);
const [showTypeModal, setShowTypeModal] = useState(false);

// Fetch discounts from Shopify API
  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/shopify-coupons");
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          setDiscounts([]);
        } else {
          // Transform API data to match UI format
          const transformedDiscounts = (data.coupons || []).map((discount) => {
            // Determine status based on dates and Shopify status
            let status = "Active";
            const now = new Date();
            const startsAt = discount.starts_at ? new Date(discount.starts_at) : null;
            const endsAt = discount.ends_at ? new Date(discount.ends_at) : null;
            
            if (discount.status === "EXPIRED" || (endsAt && endsAt < now)) {
              status = "Expired";
            } else if (discount.status === "SCHEDULED" || (startsAt && startsAt > now)) {
              status = "Scheduled";
            } else if (discount.status === "ACTIVE") {
              status = "Active";
            }

            // Get discount type from __typename
            let type = "Code discount";
            if (discount.type) {
              if (discount.type.includes("DiscountCodeBasic")) {
                type = "Amount off products";
              } else if (discount.type.includes("DiscountAutomaticBasic")) {
                type = "Automatic discount";
              } else if (discount.type.includes("Bxgy")) {
                type = "Buy X Get Y";
              } else if (discount.type.includes("FreeShipping")) {
                type = "Free shipping";
              }
            }

            return {
              id: discount.id,
              code: discount.code || discount.heading,
              name: discount.heading,
              status: status,
              type: type,
              created: discount.starts_at ? new Date(discount.starts_at).toISOString().split('T')[0] : "",
              createdAt: discount.starts_at,
              startDate: discount.starts_at,
              endDate: discount.ends_at,
              combination: "Yes",
              used: 0,
            };
          });
          setDiscounts(transformedDiscounts);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch discounts:", err);
        setError("Failed to load discounts. Please try again.");
        setDiscounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  // Filter and sort discounts
  const filteredDiscounts = useMemo(() => {
    let filtered = discounts.filter((discount) => {
      const matchesSearch =
        discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        discount.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || discount.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Apply sorting based on sortField and sortDirection
    filtered = [...filtered].sort((a, b) => {
      let compareValue = 0;
      
      if (sortField === "created") {
        const dateA = new Date(a.created || a.createdAt || 0);
        const dateB = new Date(b.created || b.createdAt || 0);
        compareValue = dateA - dateB;
      } else if (sortField === "start") {
        const dateA = new Date(a.startDate || a.created || 0);
        const dateB = new Date(b.startDate || b.created || 0);
        compareValue = dateA - dateB;
      } else if (sortField === "end") {
        const dateA = new Date(a.endDate || a.created || 0);
        const dateB = new Date(b.endDate || b.created || 0);
        compareValue = dateA - dateB;
      } else if (sortField === "title") {
        compareValue = (a.name || a.title || "").localeCompare(b.name || b.title || "");
      } else if (sortField === "updated") {
        const dateA = new Date(a.updatedAt || a.created || 0);
        const dateB = new Date(b.updatedAt || b.created || 0);
        compareValue = dateA - dateB;
      } else if (sortField === "used") {
        compareValue = (a.used || 0) - (b.used || 0);
      }

      // Apply direction (latest = descending, earliest = ascending)
      return sortDirection === "latest" ? -compareValue : compareValue;
    });

    return filtered;
  }, [discounts, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDiscounts.length / itemsPerPage);
  const paginatedDiscounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDiscounts.slice(startIndex, endIndex);
  }, [filteredDiscounts, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusTone = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "Expired":
        return "subdued";
      case "Scheduled":
        return "attention";
      default:
        return "subdued";
    }
  };

  const handleStatusChange = (discountId, newStatus) => {
    setDiscounts(discounts.map((d) =>
      d.id === discountId ? { ...d, status: newStatus } : d
    ));
  };

  // Export functionality
  const handleExport = () => {
    // Determine which discounts to export
    let dataToExport = [];
    
    if (exportFormat === "current") {
      dataToExport = paginatedDiscounts;
    } else if (exportFormat === "all") {
      dataToExport = discounts;
    } else if (exportFormat === "selected") {
      dataToExport = discounts.filter(d => selectedCoupons.includes(d.id));
    }

    // Convert to CSV
    const headers = ["Code", "Name", "Status", "Type", "Created", "Start Date", "End Date", "Combination", "Used"];
    
    let csvContent = "";
    
    // Add headers
    if (exportFileFormat === "csv-excel") {
      csvContent = "\uFEFF"; // BOM for Excel
    }
    csvContent += headers.join(",") + "\n";
    
    // Add data rows
    dataToExport.forEach(discount => {
      const row = [
        `"${discount.code || ""}"`,
        `"${discount.name || ""}"`,
        `"${discount.status || ""}"`,
        `"${discount.type || ""}"`,
        `"${discount.created || ""}"`,
        `"${discount.startDate || ""}"`,
        `"${discount.endDate || ""}"`,
        `"${discount.combination || ""}"`,
        `"${discount.used || 0}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: exportFileFormat === "csv-excel" ? "text/csv;charset=utf-8;" : "text/csv" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `discounts-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setExportModalOpen(false);
  };

  if (loading) {
    return (
      <Page fullWidth>
        <div style={{ height: "100px" }}>
          <div className="Polaris-Frame-Loading" role="progressbar" aria-label="Page loading bar">
            <div className="Polaris-Frame-Loading__Level" style={{ transform: "scaleX(0.5)", animation: "loading 2s ease-in-out infinite" }}>
            </div>
          </div>
          <style>{`
            .Polaris-Frame-Loading {
              position: relative;
              width: 100%;
              height: 3px;
              background-color: #e1e3e5;
              overflow: hidden;
            }
            .Polaris-Frame-Loading__Level {
              position: absolute;
              top: 0;
              left: 0;
              height: 100%;
              background: linear-gradient(to right, #008060, #00b894);
              transform-origin: left;
              transition: transform 0.3s ease;
            }
            @keyframes loading {
              0% { transform: scaleX(0.1) translateX(0); }
              50% { transform: scaleX(0.5) translateX(50%); }
              100% { transform: scaleX(0.1) translateX(100%); }
            }
          `}</style>
        </div>
      </Page>
    );
  }

  return (
    <>
      <style>{`
        .Polaris-Modal-Dialog {
          max-width: 600px !important;
        }
        .Polaris-Modal-Dialog__Container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .Polaris-Modal__Content {
          width: 100%;
          max-width: 600px;
        }
      `}</style>
      <Page fullWidth>
      <BlockStack gap="300">
        {error && (
          <Card>
            <div style={{ padding: "16px", backgroundColor: "#fef3f2", borderLeft: "4px solid #d92d20" }}>
              <Text variant="bodyMd" tone="critical">{error}</Text>
            </div>
          </Card>
        )}
        {/* Header Section */}
        <BlockStack gap="200">
          <InlineStack align="space-between" blockAlign="center">
         
              <InlineStack gap="100" blockAlign="center" wrap={false}>
                <Icon source={DiscountIcon} tone="base" />
                <Text variant="headingLg" fontWeight="bold">
                  Coupons
                </Text>
              </InlineStack>  
              
              <InlineStack gap="200" blockAlign="center">
                <Button variant="secondary" size="medium" icon={ExportIcon} onClick={() => setExportModalOpen(true)}>
                  Export
                </Button>
                <Button variant="primary" size="medium" icon={PlusIcon} onClick={() => setShowTypeModal(true)}>
                  Create Discount
                </Button>
              </InlineStack>
          </InlineStack>
        </BlockStack>

       

        {/* Search Section */}
        <Card>
          <BlockStack gap="300">
            <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <TextField
                  label="Search discounts"
                  labelHidden
                  type="text"
                  placeholder="Search by code or name..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  clearButton
                  onClearButtonClick={() => setSearchTerm("")}
                />
              </div>
              <Popover
                active={sortMenuActive}
                activator={
                  <Button
                    variant="tertiary"
                    onClick={() => setSortMenuActive((open) => !open)}
                    accessibilityLabel="Sort discounts"
                  >
                    Sort
                  </Button>
                }
                onClose={() => setSortMenuActive(false)}
              >
                <div style={{ padding: "16px", minWidth: "200px" }}>
                  <BlockStack gap="300">
                    <Text variant="headingSm" fontWeight="semibold">
                      Sort by
                    </Text>
                    <BlockStack gap="200">
                      {[
                        { label: "Created at date", value: "created" },
                        { label: "Start date", value: "start" },
                        { label: "End date", value: "end" },
                        { label: "Title", value: "title" },
                        { label: "Updated at date", value: "updated" },
                        { label: "Used", value: "used" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            padding: "4px 0",
                          }}
                        >
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              border: sortField === option.value ? "5px solid #000" : "2px solid #8c9196",
                              backgroundColor: sortField === option.value ? "#fff" : "transparent",
                              flexShrink: 0,
                            }}
                          />
                          <input
                            type="radio"
                            name="sortField"
                            value={option.value}
                            checked={sortField === option.value}
                            onChange={() => setSortField(option.value)}
                            style={{ display: "none" }}
                          />
                          <Text variant="bodyMd">{option.label}</Text>
                        </label>
                      ))}
                    </BlockStack>
                    <Divider />
                    <InlineStack gap="200">
                      <Button
                        size="slim"
                        variant={sortDirection === "earliest" ? "primary" : "secondary"}
                        onClick={() => setSortDirection("earliest")}
                      >
                        ↑ Earliest
                      </Button>
                      <Button
                        size="slim"
                        variant={sortDirection === "latest" ? "primary" : "secondary"}
                        onClick={() => setSortDirection("latest")}
                      >
                        ↓ Latest
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </div>
              </Popover>
            </div>
          </BlockStack>
        </Card>
 {/* Filter Tabs */}
        <div style={{ 
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#fff"
        }}>
          <InlineStack gap="0">
            {["All", "Active", "Scheduled", "Expired"].map((status) => {
              const filterValue = status === "All" ? "all" : status;
              const isActive = statusFilter === filterValue;
              return (
                <button
                  key={filterValue}
                  onClick={() => setStatusFilter(filterValue)}
                  style={{
                    padding: "12px 16px",
                    border: "none",
                    backgroundColor: "transparent",
                    borderBottom: isActive ? "2px solid #000" : "2px solid transparent",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#000" : "#6d7175",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#000";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#6d7175";
                  }}
                >
                  {status}
                </button>
              );
            })}
            
          </InlineStack>
        </div>
        {/* Discounts Table */}
        <Card>
          {filteredDiscounts.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <th
                      style={{
                        padding: "6px 10px",
                        textAlign: "center",
                        fontWeight: 600,
                        color: "#202223",
                        fontSize: "11px",
                        width: "40px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={paginatedDiscounts.length > 0 && paginatedDiscounts.every(d => selectedCoupons.includes(d.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCoupons([...selectedCoupons, ...paginatedDiscounts.filter(d => !selectedCoupons.includes(d.id)).map(d => d.id)]);
                          } else {
                            setSelectedCoupons(selectedCoupons.filter(id => !paginatedDiscounts.map(d => d.id).includes(id)));
                          }
                        }}
                        style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#000" }}
                      />
                    </th>
                    <th
                      style={{
                        padding: "6px 10px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#202223",
                        fontSize: "11px",
                      }}
                    >
                      Code
                    </th>
                    <th
                      style={{
                        padding: "6px 10px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#202223",
                        fontSize: "11px",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#202223",
                        fontSize: "12px",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#202223",
                        fontSize: "12px",
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#202223",
                        fontSize: "12px",
                      }}
                    >
                      Created
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#202223",
                        fontSize: "12px",
                      }}
                    >
                      Combination
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#202223",
                        fontSize: "12px",
                      }}
                    >
                      Used
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "center",
                        fontWeight: 600,
                        color: "#202223",
                        fontSize: "12px",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDiscounts.map((discount, idx) => (
                    <tr
                      key={discount.id}
                      style={{
                        borderBottom:
                          idx < filteredDiscounts.length - 1
                            ? "1px solid #e5e7eb"
                            : "none",
                        backgroundColor: selectedCoupons.includes(discount.id) ? "#f5f5f5" : (idx % 2 === 0 ? "#ffffff" : "#fafbfc"),
                        borderLeft: selectedCoupons.includes(discount.id) ? "3px solid #000" : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedCoupons.includes(discount.id)) {
                          e.currentTarget.style.backgroundColor = "#f5f5f5";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedCoupons.includes(discount.id)) {
                          e.currentTarget.style.backgroundColor =
                            idx % 2 === 0 ? "#ffffff" : "#fafbfc";
                        }
                      }}
                    >
                      <td
                        style={{
                          padding: "8px 10px",
                          textAlign: "center",
                          width: "40px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCoupons.includes(discount.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCoupons([...selectedCoupons, discount.id]);
                            } else {
                              setSelectedCoupons(selectedCoupons.filter(id => id !== discount.id));
                            }
                          }}
                          style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#000" }}
                        />
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontWeight: 600,
                          color: "#000",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          // Extract discount ID from Shopify GID
                          const discountId = discount.id.split('/').pop();
                          window.location.href = `https://admin.shopify.com/store/${window.shopify?.config?.shop?.split('.')[0]}/discounts/${discountId}`;
                        }}
                      >
                        {discount.code}
                      </td>
                      <td 
                        style={{ padding: "8px 12px", color: "#202223", cursor: "pointer" }}
                        onClick={() => {
                          const discountId = discount.id.split('/').pop();
                          window.location.href = `https://admin.shopify.com/store/${window.shopify?.config?.shop?.split('.')[0]}/discounts/${discountId}`;
                        }}
                      >
                        {discount.name}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <Badge tone={getStatusTone(discount.status)}>
                          {discount.status}
                        </Badge>
                      </td>
                      <td style={{ padding: "8px 12px", color: "#202223" }}>
                        {discount.type}
                      </td>
                      <td style={{ padding: "8px 12px", color: "#6d7175" }}>
                        {discount.created}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <Badge
                          tone={
                            discount.combination === "Yes"
                              ? "success"
                              : "subdued"
                          }
                        >
                          {discount.combination}
                        </Badge>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            backgroundColor: "#f0f0f0",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            display: "inline-block",
                            fontWeight: 500,
                            fontSize: "12px",
                          }}
                        >
                          {discount.used}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ minWidth: "120px" }}>
                          <Select
                            label=""
                            labelHidden
                            options={
                              discount.status === "Active"
                                ? [
                                    { label: "Active", value: "Active" },
                                    { label: "Deactivate", value: "Expired" },
                                  ]
                                : discount.status === "Expired"
                                ? [
                                    { label: "Expired", value: "Expired" },
                                    { label: "Activate", value: "Active" },
                                  ]
                                : discount.status === "Scheduled"
                                ? [
                                    { label: "Scheduled", value: "Scheduled" },
                                    { label: "Cancel", value: "Expired" },
                                  ]
                                : []
                            }
                            value={discount.status}
                            onChange={(newStatus) => {
                              handleStatusChange(discount.id, newStatus);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : discounts.length > 0 ? (
            <div style={{ 
              padding: "80px 16px", 
              display: "flex", 
              justifyContent: "center",
              minHeight: "400px",
              alignItems: "center"
            }}>
              <BlockStack gap="200" align="center">
                <Text variant="headingMd" as="p" alignment="center">
                  {statusFilter === "Scheduled"
                    ? "No scheduled discounts"
                    : "No discounts found"}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued" alignment="center">
                  Try adjusting your search or filter to find what you're looking for.
                </Text>
              </BlockStack>
            </div>
          ) : null}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <BlockStack gap="300" align="center">
            <Pagination
              hasPrevious={currentPage > 1}
              onPrevious={() => setCurrentPage(currentPage - 1)}
              hasNext={currentPage < totalPages}
              onNext={() => setCurrentPage(currentPage + 1)}
            />
          </BlockStack>
        )}

        {/* Results Summary */}
        {filteredDiscounts.length > 0 && (
          <Text variant="bodySm" tone="subdued">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredDiscounts.length)} of {filteredDiscounts.length} discounts
          </Text>
        )}

        {/* Export Modal */}
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
            <BlockStack gap="300">
              {/* Export Options */}
              <BlockStack gap="200">
                <Text variant="headingMd" fontWeight="semibold">
                  Export
                </Text>
                <ChoiceList
                  choices={[
                    { label: "Current page", value: "current" },
                    { label: "All discounts", value: "all" },
                    { label: `Selected: ${selectedCoupons.length} discounts`, value: "selected", disabled: selectedCoupons.length === 0 },
                    { label: `${filteredDiscounts.length} discounts matching your search`, value: "matching", disabled: true },
                  ]}
                  selected={[exportFormat]}
                  onChange={(value) => setExportFormat(value[0])}
                  allowMultiple={false}
                />
              </BlockStack>

              <Divider />

              {/* File Format Options */}
              <BlockStack gap="200">
                <Text variant="headingMd" fontWeight="semibold">
                  Export as
                </Text>
                <ChoiceList
                  choices={[
                    { label: "CSV for Excel, Numbers, or other spreadsheet programs", value: "csv-excel" },
                    { label: "Plain CSV file", value: "plain-csv" },
                  ]}
                  selected={[exportFileFormat]}
                  onChange={(value) => setExportFileFormat(value[0])}
                  allowMultiple={false}
                />
              </BlockStack>
            </BlockStack>
          </Modal.Section>
        </Modal>

        {/* Discount Type Selection Modal */}
        <Modal
          open={showTypeModal}
          onClose={() => setShowTypeModal(false)}
          title="Select discount type"
          size="large"
        >
          <Modal.Section>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              {/* Amount off products */}
              <div
                onClick={() => navigate("/app/discount-create?type=amount_off_products")}
                style={{
                  padding: "14px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  backgroundColor: "#ffffff",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#d0d0d0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <div style={{ color: "#6d7175", flexShrink: 0, marginTop: "2px" }}>
                  <Icon source={DiscountIcon} tone="base" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodySm" fontWeight="semibold" as="p" style={{ margin: "0 0 4px 0" }}>
                    Amount off products
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p" style={{ margin: 0 }}>
                    Discount specific products or collections of products
                  </Text>
                </div>
                <div style={{ color: "#6d7175", fontSize: "18px", flexShrink: 0, marginTop: "2px" }}>›</div>
              </div>

              {/* Buy X get Y */}
              <div
                onClick={() => navigate("/app/discount-create?type=buy_x_get_y")}
                style={{
                  padding: "14px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  backgroundColor: "#ffffff",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#d0d0d0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <div style={{ color: "#6d7175", flexShrink: 0, marginTop: "2px" }}>
                  <Icon source={DiscountIcon} tone="base" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodySm" fontWeight="semibold" as="p" style={{ margin: "0 0 4px 0" }}>
                    Buy X get Y
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p" style={{ margin: 0 }}>
                    Discount specific products or collections of products
                  </Text>
                </div>
                <div style={{ color: "#6d7175", fontSize: "18px", flexShrink: 0, marginTop: "2px" }}>›</div>
              </div>

              {/* Amount off order */}
              <div
                onClick={() => navigate("/app/discount-create?type=amount_off_order")}
                style={{
                  padding: "14px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  backgroundColor: "#ffffff",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#d0d0d0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <div style={{ color: "#6d7175", flexShrink: 0, marginTop: "2px" }}>
                  <Icon source={DiscountIcon} tone="base" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodySm" fontWeight="semibold" as="p" style={{ margin: "0 0 4px 0" }}>
                    Amount off order
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p" style={{ margin: 0 }}>
                    Discount the total order amount
                  </Text>
                </div>
                <div style={{ color: "#6d7175", fontSize: "18px", flexShrink: 0, marginTop: "2px" }}>›</div>
              </div>

              {/* Free shipping */}
              <div
                onClick={() => navigate("/app/discount-create?type=free_shipping")}
                style={{
                  padding: "14px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  backgroundColor: "#ffffff",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#d0d0d0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <div style={{ color: "#6d7175", flexShrink: 0, marginTop: "2px" }}>
                  <Icon source={DiscountIcon} tone="base" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodySm" fontWeight="semibold" as="p" style={{ margin: "0 0 4px 0" }}>
                    Free shipping
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p" style={{ margin: 0 }}>
                    Offer free shipping on an order
                  </Text>
                </div>
                <div style={{ color: "#6d7175", fontSize: "18px", flexShrink: 0, marginTop: "2px" }}>›</div>
              </div>
            </div>
          </Modal.Section>
        </Modal>
      </BlockStack>
      </Page>
    </>
  );
}
export default CouponList;
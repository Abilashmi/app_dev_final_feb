import React, { useEffect, useState, useRef } from 'react';
import { getCoupons, saveCoupon } from '../services/api.cart-settings.jsx';
import { IndexFilters, DataTable, Card, TextField, Button, Select, Badge, Spinner } from '@shopify/polaris';

function CouponDashboard() {
  const SHOP_ID = 'example.myshopify.com'; // Replace with dynamic shopId later

  const COUPON_TYPES = [
    { value: 'amount_off_order', label: 'Amount off order' },
    { value: 'free_shipping', label: 'Free shipping' },
    { value: 'buy_x_get_y', label: 'Buy X Get Y' },
    { value: 'amount_off_product', label: 'Amount off product' },
  ];

  // Sort options like Shopify Discounts
  const SORT_FIELDS = [
    { label: 'Created at date', value: 'createdAt' },
    { label: 'Start date', value: 'startDate' },
    { label: 'End date', value: 'endDate' },
    { label: 'Title', value: 'title' },
    { label: 'Updated at date', value: 'updatedAt' },
    { label: 'Used', value: 'usedCount' },
  ];
  const FILTER_OPTIONS = [
    { label: 'All discounts', value: 'all' },
    { label: 'Shopify discounts', value: 'shopify' },
    { label: 'App coupons', value: 'app' },
  ];

  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc'); // 'desc' = Latest, 'asc' = Earliest
  const [filterSource, setFilterSource] = useState('all');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [selectedCouponType, setSelectedCouponType] = useState(null);
  const [search, setSearch] = useState('');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getCoupons(SHOP_ID).then((data) => {
      setCoupons(data.coupons);
      setLoading(false);
    });
  }, []);

  // Add mock usedCount and createdAt to each coupon if not present
  const couponsWithUsed = coupons.map((c, idx) => ({
    ...c,
    usedCount: typeof c.usedCount === 'number' ? c.usedCount : Math.floor(Math.random() * 20),
    createdAt: c.createdAt || (Date.now() - idx * 1000 * 60 * 60 * 24), // mock date, newest first
  }));

  // Filter and sort
  let filteredCoupons = couponsWithUsed.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );
  if (filterSource === 'shopify') {
    filteredCoupons = filteredCoupons.filter(c => c.source === 'SHOPIFY');
  } else if (filterSource === 'app') {
    filteredCoupons = filteredCoupons.filter(c => c.source === 'APP');
  }
  filteredCoupons = filteredCoupons.slice();
  filteredCoupons.sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';
    if (sortField === 'usedCount') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    } else if (sortField === 'title') {
      aVal = a.code || '';
      bVal = b.code || '';
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle click outside for dropdown
  useEffect(() => {
    function handleClick(e) {
      if (showSortDropdown && sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSortDropdown]);
  // IndexFilters config
  const filterTabs = [
    {
      key: 'all',
      label: 'All discounts',
      filter: () => true,
    },
    {
      key: 'shopify',
      label: 'Shopify discounts',
      filter: c => c.source === 'SHOPIFY',
    },
    {
      key: 'app',
      label: 'App coupons',
      filter: c => c.source === 'APP',
    },
  ];

  const handleFiltersChange = (selected) => {
    setFilterSource(selected);
  };
  // Coupon type selection UI
  const handleSortChange = (value) => {
    setSortField(value);
  };
  function renderTypeSelection() {
    const handleSearchChange = (value) => {
      setSearch(value);
    };
    // DataTable rows (not used in this function, so remove or move if needed)
    // const rows = filteredCoupons.map((c) => [
    //   c.code,
    //   COUPON_TYPES.find(t => t.value === c.type)?.label || c.type,
    //   <Badge status={c.status === 'active' ? 'success' : c.status === 'expired' ? 'critical' : 'info'}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Badge>,
    //   <Badge status={c.source === 'APP' ? 'info' : 'warning'}>{c.source === 'APP' ? 'Created in App' : 'Created in Shopify'}</Badge>,
    //   c.usedCount || 0,
    // ]);
    return (
      <div style={{ padding: 32 }}>
        <button onClick={() => { setIsCreatingCoupon(false); setSelectedCouponType(null); }} style={{ marginBottom: 16, background: 'none', border: 'none', color: '#0052cc', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>Select coupon type</div>
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {COUPON_TYPES.map((t) => (
            <div
              key={t.value}
              onClick={() => setSelectedCouponType(t.value)}
              style={{
                minWidth: 180,
                minHeight: 90,
                border: selectedCouponType === t.value ? '2px solid #0052cc' : '1px solid #dfe3e8',
                background: selectedCouponType === t.value ? '#f0f6fe' : '#fff',
                borderRadius: 12,
                boxShadow: selectedCouponType === t.value ? '0 2px 8px #e3e8ee' : '0 1px 4px #f6f6f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                transition: 'border 0.2s, box-shadow 0.2s',
                outline: selectedCouponType === t.value ? '2px solid #b4d6fa' : 'none',
                position: 'relative',
              }}
              onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 8px #e3e8ee'}
              onMouseOut={e => e.currentTarget.style.boxShadow = selectedCouponType === t.value ? '0 2px 8px #e3e8ee' : '0 1px 4px #f6f6f7'}
            >
              {t.label}
              {selectedCouponType === t.value && (
                <span style={{ position: 'absolute', top: 8, right: 12, color: '#0052cc', fontSize: 18 }}>✓</span>
              )}
            </div>
          ))}
        </div>
        {selectedCouponType && (
          <button style={{ padding: '10px 24px', background: '#0052cc', color: '#fff', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 16 }}>Next</button>
        )}
      </div>
    );
  }

  // Main render
  if (isCreatingCoupon) {
    return renderTypeSelection();
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontWeight: 700 }}>Coupons</h1>
        <button onClick={() => setIsCreatingCoupon(true)} style={{ padding: '10px 24px', background: '#222', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600 }}>Create Coupon +</button>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by code"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px', borderRadius: 4, border: '1px solid #ccc', width: 200 }}
        />
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSortDropdown(v => !v)}
            style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <span style={{ fontWeight: 500 }}>Sort</span>
            <span style={{ fontSize: 18, lineHeight: 1 }}>▼</span>
          </button>
          {showSortDropdown && (
            <div ref={sortDropdownRef} style={{ position: 'absolute', top: 40, left: 0, minWidth: 220, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 12px #eee', zIndex: 10, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Sort by</div>
              {SORT_FIELDS.map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="sortField"
                    value={opt.value}
                    checked={sortField === opt.value}
                    onChange={() => setSortField(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
              <div style={{ borderTop: '1px solid #eee', margin: '10px 0' }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        style={{
          background: sortDir === 'asc' ? '#f0f6fe' : 'none',
          border: 'none',
          borderRadius: 4,
          padding: '6px 0',
          fontWeight: sortDir === 'asc' ? 600 : 400,
          cursor: 'pointer',
        }}
        onClick={() => setSortDir('asc')}
      >↑ Earliest</button>
      <button
        style={{
          background: sortDir === 'desc' ? '#f0f6fe' : 'none',
          border: 'none',
          borderRadius: 4,
          padding: '6px 0',
          fontWeight: sortDir === 'desc' ? 600 : 400,
          cursor: 'pointer',
        }}
        onClick={() => setSortDir('desc')}
      >↓ Latest</button>
    </div>
  </div>
)}
        </div>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ padding: '8px', borderRadius: 4, border: '1px solid #ccc', width: 180 }}>
          {FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #eee' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ textAlign: 'left', padding: '12px' }}>Coupon code</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Discount type</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Source</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Used</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center' }}>Loading...</td></tr>
          ) : filteredCoupons.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center' }}>No coupons found</td></tr>
          ) : filteredCoupons.map((c, idx) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{c.code}</td>
              <td style={{ padding: '12px' }}>{COUPON_TYPES.find(t => t.value === c.type)?.label || c.type}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ color: c.status === 'active' ? '#0a0' : c.status === 'expired' ? '#d00' : '#888', fontWeight: 600 }}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span>
              </td>
              <td style={{ padding: '12px' }}>
                <span style={{ background: c.source === 'APP' ? '#eaf4ff' : '#fffbe6', color: c.source === 'APP' ? '#0052cc' : '#b59f00', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{c.source === 'APP' ? 'Created in App' : 'Created in Shopify'}</span>
                {c.source === 'SHOPIFY' && <span style={{ marginLeft: 8, background: '#fffbe6', color: '#b59f00', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>Read-only</span>}
              </td>
              <td style={{ padding: '12px' }}>{c.usedCount || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CouponDashboard;

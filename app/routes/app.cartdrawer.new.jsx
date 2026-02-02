import React, { useState } from 'react';

export default function CartDrawerAdmin() {
  const [cartStatus, setCartStatus] = useState('active');
  const [previewCartState, setPreviewCartState] = useState('items');
  const [selectedTab, setSelectedTab] = useState('progress-bar');
  const [featureStates, setFeatureStates] = useState({
    progressBarEnabled: true,
    couponSliderEnabled: false,
    upsellEnabled: false,
  });

  const mockCartItems = [
    { id: 1, name: 'Premium Hoodie', price: 49.99, quantity: 1 },
    { id: 2, name: 'Classic T-Shirt', price: 24.99, quantity: 2 },
  ];

  const cartTotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const toggleFeature = (feature) => {
    setFeatureStates(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const renderEditorPanel = () => {
    const renderFeatureEditor = (tabKey, title, featureStateKey) => {
      if (selectedTab !== tabKey) return null;
      return (
        <div key={tabKey} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>{title}</h2>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={featureStates[featureStateKey]}
                  onChange={() => toggleFeature(featureStateKey)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px' }}>Enable</span>
              </label>
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              {title} settings will appear here
            </div>
          </div>
        </div>
      );
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {renderFeatureEditor('progress-bar', 'Progress Bar', 'progressBarEnabled')}
        {renderFeatureEditor('coupon', 'Coupon Slider', 'couponSliderEnabled')}
        {renderFeatureEditor('upsell', 'Upsell Products', 'upsellEnabled')}
      </div>
    );
  };

  const renderCartPreview = () => {
    return (
      <div style={{ position: 'relative', height: '100%', overflow: 'hidden', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#fff', opacity: 0.3 }} />
        <div style={{ position: 'relative', width: '90%', height: '90%', maxWidth: '420px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#000' }}>Your Cart</h3>
            <button style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {previewCartState === 'empty' ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px' }}>
                <div style={{ fontSize: '40px' }}>🛒</div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111' }}>Your cart is empty</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Add items to get started</p>
              </div>
            ) : (
              <>
                {featureStates.progressBarEnabled && (
                  <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#16a34a' }}>Free shipping in $50+</p>
                    <div style={{ height: '6px', backgroundColor: '#bbf7d0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '65%', backgroundColor: '#16a34a' }} />
                    </div>
                  </div>
                )}
                {mockCartItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: '#e5e7eb', borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#111' }}>{item.name}</p>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280' }}>${item.price.toFixed(2)}</p>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: 'none', cursor: 'pointer' }}>−</button>
                        <span style={{ fontSize: '13px', fontWeight: '500', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: 'none', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#111' }}>${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
                {featureStates.couponSliderEnabled && (
                  <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>Apply Coupon</label>
                    <input type="text" placeholder="Enter code" style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #fbbf24', borderRadius: '4px' }} />
                  </div>
                )}
                {featureStates.upsellEnabled && (
                  <div style={{ padding: '12px', backgroundColor: '#e0e7ff', borderRadius: '8px', border: '1px solid #a5b4fc' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#3730a3' }}>✨ Recommended for you</p>
                    <div style={{ fontSize: '12px', color: '#4c1d95', padding: '6px', backgroundColor: '#f3e8ff', borderRadius: '4px' }}>Add Premium Bundle for $19.99</div>
                  </div>
                )}
              </>
            )}
          </div>
          {previewCartState !== 'empty' && (
            <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontWeight: '600', color: '#111' }}>${cartTotal.toFixed(2)}</span>
              </div>
              <button style={{ width: '100%', padding: '10px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Checkout</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 480px', height: '100vh', gap: 0, backgroundColor: '#fff', fontFamily: 'system-ui' }}>
      {/* LEFT PANEL */}
      <div style={{ borderRight: '1px solid #e5e7eb', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#000' }}>Cart Settings</h1>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Cart Status</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={cartStatus === 'active'} onChange={(e) => setCartStatus(e.target.checked ? 'active' : 'inactive')} style={{ cursor: 'pointer' }} />
            <span style={{ fontSize: '14px', color: cartStatus === 'active' ? '#111' : '#9ca3af' }}>{cartStatus === 'active' ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Preview State</p>
          <select value={previewCartState} onChange={(e) => setPreviewCartState(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer' }}>
            <option value="items">Show items in cart</option>
            <option value="empty">Show empty cart</option>
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 20px' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Features</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[{ id: 'progress-bar', label: 'Progress Bar' }, { id: 'coupon', label: 'Coupon Slider' }, { id: 'upsell', label: 'Upsell Products' }].map(tab => (
              <button key={tab.id} onClick={() => setSelectedTab(tab.id)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '14px', fontWeight: selectedTab === tab.id ? '600' : '500', color: selectedTab === tab.id ? '#fff' : '#374151', backgroundColor: selectedTab === tab.id ? '#000' : '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MIDDLE PANEL */}
      <div style={{ backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderRight: '1px solid #e5e7eb' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#000' }}>
            {selectedTab === 'progress-bar' && 'Progress Bar'}
            {selectedTab === 'coupon' && 'Coupon Slider'}
            {selectedTab === 'upsell' && 'Upsell Products'}
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {renderEditorPanel()}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderLeft: '1px solid #e5e7eb' }}>
        <div style={{ padding: '12px 16px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Live Preview</div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderCartPreview()}
        </div>
      </div>
    </div>
  );
}

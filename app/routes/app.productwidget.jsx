import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
} from '@shopify/polaris';
import { useState } from 'react';
import React from 'react';
import { Link, AccountConnection } from '@shopify/polaris';

// Convert HSBA to HEX string
function hsbaToHex(hsba) {
  if (!hsba) return '#000000';
  // Convert HSBA to RGB
  let { h, s, b } = hsba;
  h = h / 360;
  s = s / 100;
  b = b / 100;
  let r, g, l;
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = b * (1 - s);
  let q = b * (1 - f * s);
  let t = b * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = b, g = t, l = p; break;
    case 1: r = q, g = b, l = p; break;
    case 2: r = p, g = b, l = t; break;
    case 3: r = p, g = q, l = b; break;
    case 4: r = t, g = p, l = b; break;
    case 5: r = b, g = p, l = q; break;
  }
    r = Math.round(r * 255);
    g = Math.round(g * 255);
    l = Math.round(l * 255);
    // Convert RGB to HEX
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | l).toString(16).slice(1);
  }

// --- JSON-safe localStorage helpers ---
function saveConfig(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // fallback: do nothing
  }
}
function loadConfig(key) {
  try {
    const val = window.localStorage.getItem(key);
    return val ? JSON.parse(val) : undefined;
  } catch (e) {
    return undefined;
  }
}

// --- Coupon Styles ---
const COUPON_STYLES = [
  {
    id: 'soft-card',
    label: 'Soft Card Coupon',
    preview: (
      <Card padding="0" style={{ background: '#fff0fa', border: '1px solid #ffd6e7', borderRadius: 16, boxShadow: '0 2px 8px #ffe6f3', minWidth: 220, minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="headingMd" fontWeight="bold" color="critical">
          <span role="img" aria-label="family">👨‍👩‍👧‍👦</span> BAWSE5
        </Text>
        <Text variant="bodyMd">Enjoy 5% off sitewide—just for you!</Text>
        <div style={{ marginTop: 16 }}>
          <Card padding="0" style={{ background: '#ffe6f3', borderRadius: 24, display: 'inline-block' }}>
            <Text variant="bodySm" color="critical" style={{ padding: '6px 18px', display: 'inline-block' }}>Tap to Apply</Text>
          </Card>
        </div>
      </Card>
    ),
  },
  {
    id: 'ticket',
    label: 'Ticket / Voucher',
    preview: (
      <div style={{ background: '#e53935', border: '2px dashed #fff', borderRadius: 12, minWidth: 220, minHeight: 90, color: '#fff', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}>
        <div style={{ padding: 16, flex: 1 }}>
          <Text variant="headingLg" fontWeight="bold" color="text-inverse">SAVE 40%</Text>
          <Text variant="bodySm" color="text-inverse">DISCOUNT VOUCHER</Text>
        </div>
        <div style={{ background: '#fff', color: '#e53935', borderRadius: '0 12px 12px 0', padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center' }}>
          <Text variant="bodySm" fontWeight="bold">COUPON</Text>
        </div>
      </div>
    ),
  },
  {
    id: 'conditional',
    label: 'Conditional Offer',
    preview: (
      <Card padding="0" style={{ background: '#f9f6f2', border: '1px solid #e0d7c6', borderRadius: 12, minWidth: 220, minHeight: 90, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: 16 }}>
        <Text variant="headingMd" fontWeight="bold">Buy 2 Sale</Text>
        <Text variant="bodySm">Flat 10% off when you buy both a topwear and a bottomwear</Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Card padding="0" style={{ background: '#f5ede2', borderRadius: 16, display: 'inline-block' }}>
            <Text variant="bodySm" color="subdued" style={{ padding: '4px 12px', display: 'inline-block' }}>BUY2SALE</Text>
          </Card>
          <Card padding="0" style={{ background: '#bdbdbd', borderRadius: 16, display: 'inline-block' }}>
            <Text variant="bodySm" color="text-inverse" style={{ padding: '4px 12px', display: 'inline-block' }}>Not Eligible</Text>
          </Card>
        </div>
      </Card>
    ),
  },
];

function AccountConnectionSection() {
  const [connected, setConnected] = useState(true);
  const accountName = connected ? 'example.myshopify.com' : '';
  const handleAction = React.useCallback(() => {
    setConnected((c) => !c);
  }, []);
  const buttonText = connected ? 'Disconnect' : 'Connect';
  const details = connected ? 'Account connected' : 'No account connected';
  const terms = connected ? null : (
    <p>
      By clicking <strong>Connect</strong>, you agree to accept Sample App’s{' '}
      <Link url="https://www.shopify.com/legal/terms">terms and conditions</Link>.
    </p>
  );
  return (
    <AccountConnection
      accountName={accountName}
      connected={connected}
      title="Shopify Store"
      action={{
        content: buttonText,
        onAction: handleAction,
      }}
      details={details}
      termsOfService={terms}
    />
  );
}

export default function ProductWidget() {
  // --- State ---
  const shopId = 'demo-shop-123';
  const [activeWidget, setActiveWidget] = useState('coupon'); // 'coupon' | 'fbt'
  const [enabled, setEnabled] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [couponConfig, setCouponConfig] = useState({
    style: COUPON_STYLES[0].id,
    code: 'BAWSE5',
    description: 'Enjoy 5% off sitewide—just for you!',
    cta: 'Tap to Apply',
    eligibility: 'Not Eligible',
  });
  const [fbtConfig, setFbtConfig] = useState({
    mode: 'manual',
    products: [{ title: 'T-Shirt', price: '$19.99' }, { title: 'Jeans', price: '$39.99' }],
    collections: [{ title: 'Summer Sale' }],
    ai: false,
  });
  const [lastSaved, setLastSaved] = useState(null);
  // --- Load/Save ---
  React.useEffect(() => {
    const saved = loadConfig('widgetConfig-' + shopId);
    if (saved) {
      setActiveWidget(saved.activeWidget);
      setEnabled(saved.enabled);
      setSelectedStyle(saved.selectedStyle);
      setCouponConfig(saved.couponConfig);
      setFbtConfig(saved.fbtConfig);
      setLastSaved(saved);
    }
  }, []);
  const handleSave = () => {
    const config = {
      shopId,
      activeWidget,
      enabled,
      selectedStyle,
      couponConfig,
      fbtConfig,
    };
    saveConfig('widgetConfig-' + shopId, config);
    setLastSaved(config);
  };
  const handleCancel = () => {
    if (!lastSaved) return;
    setActiveWidget(lastSaved.activeWidget);
    setEnabled(lastSaved.enabled);
    setSelectedStyle(lastSaved.selectedStyle);
    setCouponConfig(lastSaved.couponConfig);
    setFbtConfig(lastSaved.fbtConfig);
  };
  // --- Layout ---
  return (
    <Page title="Product Widget">
      {/* Top Row: Wide Account Connection */}
      <div style={{ marginBottom: 24 }}>
        <Card>
          <AccountConnectionSection />
        </Card>
      </div>
      {/* Coupon Style Selector (centered, only if coupon widget is active) */}
      {activeWidget === 'coupon' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          {!selectedStyle ? (
            <InlineStack gap="400">
              {COUPON_STYLES.map((style) => (
                <Card
                  key={style.id}
                  sectioned
                  style={{
                    border: '2px solid ' + (couponConfig.style === style.id ? '#008060' : '#ddd'),
                    borderRadius: 16,
                    boxShadow: couponConfig.style === style.id ? '0 0 0 3px #B6E1C3' : '0 1px 4px rgba(0,0,0,0.08)',
                    background: '#fff',
                    cursor: 'pointer',
                    minWidth: 240,
                    maxWidth: 260,
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => { setSelectedStyle(style.id); setCouponConfig({ ...couponConfig, style: style.id }); }}
                >
                  <BlockStack gap="100" align="center">
                    <Text variant="headingMd" fontWeight={couponConfig.style === style.id ? 'bold' : undefined} color={couponConfig.style === style.id ? 'success' : undefined}>
                      {style.label}
                    </Text>
                    <Text variant="bodySm" color="subdued" style={{ textAlign: 'center' }}>
                      {style.id === 'soft-card' && 'Card with code, description, and CTA'}
                      {style.id === 'ticket' && 'Voucher style, code on right'}
                      {style.id === 'conditional' && 'Conditional offer, code + eligibility'}
                    </Text>
                  </BlockStack>
                </Card>
              ))}
            </InlineStack>
          ) : null}
        </div>
      )}
      {/* Main Area: Left = Product Widgets, Right = Settings+Preview */}
      <div style={{ display: 'flex', width: '100%', minHeight: 400 }}>
        {/* Left Panel: Product Widgets */}
        <div style={{ flex: '0 0 260px', minWidth: 200, marginRight: 32 }}>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingSm">Product Widgets</Text>
              <div>
                <Button
                  fullWidth
                  primary={activeWidget === 'coupon'}
                  outline={activeWidget !== 'coupon'}
                  onClick={() => setActiveWidget('coupon')}
                  style={{ marginBottom: 8 }}
                >
                  Coupon Slider
                </Button>
                <Button
                  fullWidth
                  primary={activeWidget === 'fbt'}
                  outline={activeWidget !== 'fbt'}
                  onClick={() => setActiveWidget('fbt')}
                >
                  Frequently Bought Together
                </Button>
              </div>
            </BlockStack>
          </Card>
        </div>
        {/* Right Panel: Settings + Preview */}
        <div style={{ flex: 1 }}>
          <Card>
            <BlockStack gap="400">
              {/* Coupon Settings+Preview */}
              {activeWidget === 'coupon' && (
                <>
                  {/* Style Tabs */}
                  {selectedStyle && (
                    <InlineStack gap="200" style={{ marginBottom: 24 }}>
                      {COUPON_STYLES.map((style) => (
                        <Button
                          key={style.id}
                          destructive={selectedStyle === style.id}
                          outline={selectedStyle !== style.id}
                          onClick={() => setSelectedStyle(style.id)}
                        >
                          {style.label}
                        </Button>
                      ))}
                    </InlineStack>
                  )}
                  {selectedStyle && (
                    <>
                      <Text variant="headingSm">Coupon Customization</Text>
                      <BlockStack gap="200" style={{ maxWidth: 400 }}>
                        <Text>Coupon Code</Text>
                        <input style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} value={couponConfig.code} onChange={e => setCouponConfig({ ...couponConfig, code: e.target.value })} />
                        <Text>Description</Text>
                        <input style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} value={couponConfig.description} onChange={e => setCouponConfig({ ...couponConfig, description: e.target.value })} />
                        {selectedStyle === 'conditional' && <>
                          <Text>Eligibility</Text>
                          <input style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} value={couponConfig.eligibility} onChange={e => setCouponConfig({ ...couponConfig, eligibility: e.target.value })} />
                        </>}
                        <Text>CTA Button</Text>
                        <input style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} value={couponConfig.cta} onChange={e => setCouponConfig({ ...couponConfig, cta: e.target.value })} />
                      </BlockStack>
                      <div style={{ marginTop: 32 }}>
                        <Text variant="headingSm">Live Preview</Text>
                        <div style={{ marginTop: 16, marginBottom: 16 }}>
                          {/* Coupon preview, code-based only */}
                          {selectedStyle === 'soft-card' && (
                            <Card padding="0" style={{ background: '#fff0fa', border: '1px solid #ffd6e7', borderRadius: 16, boxShadow: '0 2px 8px #ffe6f3', minWidth: 220, minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <Text variant="headingMd" fontWeight="bold" color="critical">
                                <span role="img" aria-label="family">👨‍👩‍👧‍👦</span> {couponConfig.code}
                              </Text>
                              <Text variant="bodyMd">{couponConfig.description}</Text>
                              <div style={{ marginTop: 16 }}>
                                <Card padding="0" style={{ background: '#ffe6f3', borderRadius: 24, display: 'inline-block' }}>
                                  <Text variant="bodySm" color="critical" style={{ padding: '6px 18px', display: 'inline-block' }}>{couponConfig.cta}</Text>
                                </Card>
                              </div>
                            </Card>
                          )}
                          {selectedStyle === 'ticket' && (
                            <div style={{ background: '#e53935', border: '2px dashed #fff', borderRadius: 12, minWidth: 220, minHeight: 90, color: '#fff', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}>
                              <div style={{ padding: 16, flex: 1 }}>
                                <Text variant="headingLg" fontWeight="bold" color="text-inverse">{couponConfig.description || 'SAVE 40%'}</Text>
                                <Text variant="bodySm" color="text-inverse">DISCOUNT VOUCHER</Text>
                              </div>
                              <div style={{ background: '#fff', color: '#e53935', borderRadius: '0 12px 12px 0', padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center' }}>
                                <Text variant="bodySm" fontWeight="bold">{couponConfig.code || 'COUPON'}</Text>
                              </div>
                            </div>
                          )}
                          {selectedStyle === 'conditional' && (
                            <Card padding="0" style={{ background: '#f9f6f2', border: '1px solid #e0d7c6', borderRadius: 12, minWidth: 220, minHeight: 90, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: 16 }}>
                              <Text variant="headingMd" fontWeight="bold">{couponConfig.description || 'Buy 2 Sale'}</Text>
                              <Text variant="bodySm">Flat 10% off when you buy both a topwear and a bottomwear</Text>
                              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <Card padding="0" style={{ background: '#f5ede2', borderRadius: 16, display: 'inline-block' }}>
                                  <Text variant="bodySm" color="subdued" style={{ padding: '4px 12px', display: 'inline-block' }}>{couponConfig.code || 'BUY2SALE'}</Text>
                                </Card>
                                <Card padding="0" style={{ background: '#bdbdbd', borderRadius: 16, display: 'inline-block' }}>
                                  <Text variant="bodySm" color="text-inverse" style={{ padding: '4px 12px', display: 'inline-block' }}>{couponConfig.eligibility || 'Not Eligible'}</Text>
                                </Card>
                              </div>
                            </Card>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
              {/* FBT Settings+Preview */}
              {activeWidget === 'fbt' && (
                <div style={{ display: 'flex', gap: 32 }}>
                  <div style={{ flex: 1 }}>
                    <Text variant="headingSm">FBT Configuration</Text>
                    <BlockStack gap="100" style={{ marginTop: 16 }}>
                      <Text>Mode</Text>
                      <select value={fbtConfig.mode} onChange={e => setFbtConfig({ ...fbtConfig, mode: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }}>
                        <option value="manual">Manual Product Selection</option>
                        <option value="collection">Collection Selection</option>
                        <option value="ai">AI Recommended</option>
                      </select>
                      {fbtConfig.mode === 'manual' && <Text>Manual: 2 products selected</Text>}
                      {fbtConfig.mode === 'collection' && <Text>Collection: 1 collection selected</Text>}
                      {fbtConfig.mode === 'ai' && <Text>AI Recommended Mode <span style={{ background: '#e0f7fa', color: '#00796b', borderRadius: 8, padding: '2px 8px', marginLeft: 8 }}>AI Recommended</span></Text>}
                      <Text>Sample Product JSON</Text>
                      <pre style={{ background: '#f4f6f8', borderRadius: 8, padding: 12, fontSize: 13, overflow: 'auto' }}>{JSON.stringify(fbtConfig.products, null, 2)}</pre>
                    </BlockStack>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text variant="headingSm">Bundle Preview</Text>
                    <div style={{ marginTop: 16, marginBottom: 16 }}>
                      <BlockStack gap="100">
                        {fbtConfig.products.map((prod, idx) => (
                          <Card key={idx} padding="0" style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
                            <Text variant="bodyMd" fontWeight="bold">{prod.title}</Text>
                            <Text variant="bodySm">{prod.price}</Text>
                          </Card>
                        ))}
                        <button disabled style={{ marginTop: 8, padding: '8px 24px', borderRadius: 8, background: '#eee', color: '#888', border: 'none', fontWeight: 'bold' }}>Add all to cart</button>
                        {fbtConfig.mode === 'ai' && <span style={{ background: '#e0f7fa', color: '#00796b', borderRadius: 8, padding: '2px 8px', marginLeft: 8 }}>AI Recommended</span>}
                      </BlockStack>
                    </div>
                  </div>
                </div>
              )}
              {/* Save/Cancel */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <button onClick={handleCancel} style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid #008060', background: '#008060', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
              </div>
            </BlockStack>
          </Card>
        </div>
      </div>
    </Page>
  );
}

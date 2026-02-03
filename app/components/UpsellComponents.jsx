/**
 * Upsell Storefront Components
 * Components for displaying upsell products in the cart drawer
 */

import React from 'react';

/**
 * Add to Cart Button Component
 * Handles adding upsell products to cart
 */
export function UpsellAddButton({
  productId,
  buttonText = 'Add to Cart',
  onClick = () => {},
  loading = false,
  disabled = false,
  style = {},
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        padding: '10px 16px',
        backgroundColor: disabled ? '#d1d5db' : '#000000',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s ease',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.target.style.backgroundColor = '#1f2937';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.target.style.backgroundColor = '#000000';
        }
      }}
    >
      {loading ? 'Adding...' : buttonText}
    </button>
  );
}

/**
 * Upsell Product Card Component
 * Individual product card for slider/list layout
 */
export function UpsellProductCard({
  product,
  buttonText = 'Add to Cart',
  showPrice = true,
  onAddClick = () => {},
  layout = 'slider',
  loading = false,
}) {
  if (!product) return null;

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: layout === 'slider' ? 'column' : 'row',
        gap: '12px',
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Product Image */}
      <div
        style={{
          width: layout === 'slider' ? '100%' : '80px',
          height: layout === 'slider' ? '120px' : '80px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        ) : (
          <span style={{ color: '#9ca3af', fontSize: '12px' }}>
            No Image
          </span>
        )}
      </div>

      {/* Product Info */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <h4
          style={{
            margin: '0 0 4px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {product.title}
        </h4>

        {showPrice && (
          <p
            style={{
              margin: '0',
              fontSize: '13px',
              color: '#6b7280',
              fontWeight: '500',
            }}
          >
            ₹{product.price.toFixed(2)}
          </p>
        )}

        {product.description && (
          <p
            style={{
              margin: '0',
              fontSize: '12px',
              color: '#9ca3af',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {product.description}
          </p>
        )}

        {/* Add to Cart Button */}
        <div style={{ marginTop: '8px' }}>
          <UpsellAddButton
            productId={product.id}
            buttonText={buttonText}
            onClick={() => onAddClick(product.id)}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Upsell Container Component
 * Main wrapper for upsell section in cart drawer
 */
export function UpsellContainer({
  config,
  products = [],
  onProductAdd = () => {},
  isLoading = false,
}) {
  if (!config || !config.enabled || products.length === 0) {
    return null;
  }

  const displayProducts = products.slice(0, config.limit || 3);

  return (
    <div
      id="cart-drawer-upsell"
      style={{
        padding: '16px 0',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        marginTop: '16px',
        marginBottom: '16px',
      }}
    >
      {/* Upsell Header */}
      <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: '700',
            color: '#111827',
          }}
        >
          {config.ui.title || 'Recommended for you'}
        </h3>
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          Complete your order
        </p>
      </div>

      {/* Slider Layout */}
      {config.ui.layout === 'slider' && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            padding: '0 16px',
            marginBottom: '12px',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayProducts.map((product) => (
            <div
              key={product.id}
              style={{
                minWidth: '160px',
                flex: '0 0 auto',
              }}
            >
              <UpsellProductCard
                product={product}
                buttonText={config.ui.buttonText || 'Add to Cart'}
                showPrice={config.ui.showPrice !== false}
                onAddClick={(productId) => {
                  onProductAdd(productId, product.gid);
                }}
                layout="slider"
                loading={isLoading}
              />
            </div>
          ))}
        </div>
      )}

      {/* Vertical List Layout */}
      {config.ui.layout === 'vertical' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '0 16px',
            marginBottom: '12px',
          }}
        >
          {displayProducts.map((product) => (
            <UpsellProductCard
              key={product.id}
              product={product}
              buttonText={config.ui.buttonText || 'Add to Cart'}
              showPrice={config.ui.showPrice !== false}
              onAddClick={(productId) => {
                onProductAdd(productId, product.gid);
              }}
              layout="vertical"
              loading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default UpsellContainer;

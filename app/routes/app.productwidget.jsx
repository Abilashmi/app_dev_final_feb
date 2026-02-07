import React, { useState } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Card,
  Button,
  Badge,
  Box,
  Divider,
  Tag,
  Icon,
  InlineGrid,
} from '@shopify/polaris';
import { CheckIcon } from '@shopify/polaris-icons';


/**
 * @typedef {Object} Coupon
 * @property {string} code
 * @property {string} emoji
 * @property {string} title
 * @property {string} description
 * @property {'style1' | 'style2' | 'style3'} style
 */

function CouponScroller() {
  const [appliedCode, setAppliedCode] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('all');

  const coupons = [
    {
      code: 'BAWSE30',
      emoji: '🍼',
      title: 'BAWSE30',
      description: 'Flat ₹30 OFF on All Orders – Just for You!',
      style: 'style1',
    },
    {
      code: 'BABY50',
      emoji: '👶',
      title: 'BABY50',
      description: '50% OFF on First Baby Product Purchase',
      style: 'style2',
    },
    {
      code: 'NEWBORN25',
      emoji: '🌟',
      title: 'NEWBORN25',
      description: '₹25 OFF sitewide + Free Shipping',
      style: 'style1',
    },
    // Add more styles as needed
  ];

  const hasItems = true;
  if (!hasItems) return null;

  // Filter coupons based on selected style
  const visibleCoupons = coupons.filter(
    (c) => selectedStyle === 'all' || c.style === selectedStyle
  );

  // Preview: show the first coupon of the selected style (or nothing)
  const previewCoupon = visibleCoupons.length > 0 ? visibleCoupons[0] : null;

  const isApplied = (code) => appliedCode === code;

  return (
    <BlockStack gap="400">
      {/* Header */}
      <Text as="h2" variant="headingMd" alignment="center" tone="success">
        🎀 Baby Special Offers
      </Text>

      {/* Style selector */}
      <InlineStack gap="300" align="center" blockAlign="center" wrap>
        <Button
          size="slim"
          variant={selectedStyle === 'all' ? 'primary' : 'tertiary'}
          onClick={() => setSelectedStyle('all')}
        >
          All Styles
        </Button>

        <Button
          size="slim"
          variant={selectedStyle === 'style1' ? 'primary' : 'tertiary'}
          onClick={() => setSelectedStyle('style1')}
        >
          Style 1 (Classic)
        </Button>

        <Button
          size="slim"
          variant={selectedStyle === 'style2' ? 'primary' : 'tertiary'}
          onClick={() => setSelectedStyle('style2')}
        >
          Style 2 (Bold)
        </Button>

        {/* Add more style buttons as you define more styles */}
      </InlineStack>

      <Divider />

      {/* Preview Area – only shows when a specific style is selected */}
      {selectedStyle !== 'all' && (
        <Box
          background="bg-surface-secondary"
          padding="400"
          borderWidth="025"
          borderColor="border"
          borderRadius="200"
        >
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="start">
              <Text variant="headingSm">Preview – {selectedStyle}</Text>
            </InlineStack>

            {previewCoupon ? (
              renderCouponCard(previewCoupon, true, isApplied, setAppliedCode)
            ) : (
              <Text tone="subdued" alignment="center">
                No coupons in this style yet
              </Text>
            )}
          </BlockStack>
        </Box>
      )}

      {/* Actual coupon list */}
      <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="300">
        {visibleCoupons.map((coupon) => (
          <React.Fragment key={coupon.code}>
            {renderCouponCard(coupon, false, isApplied, setAppliedCode)}
          </React.Fragment>
        ))}
      </InlineGrid>

      {visibleCoupons.length === 0 && selectedStyle !== 'all' && (
        <Text alignment="center" tone="subdued">
          No coupons available for the selected style.
        </Text>
      )}
    </BlockStack>
  );
}

// Helper: render a single coupon card with style-specific look
function renderCouponCard(
  coupon,
  isPreview = false,
  isApplied,
  setAppliedCode
) {
  const applied = isApplied(coupon.code);

  let cardProps = {
    background: applied ? 'bg-surface-success' : 'bg-surface',
    borderWidth: '025',
  };

  // Style-specific customization
  if (coupon.style === 'style1') {
    // Your original style – clean card
    cardProps = {
      ...cardProps,
      roundedAbove: 'sm',
    };
  } else if (coupon.style === 'style2') {
    // Example: bolder look, dashed border, bigger emoji
    cardProps = {
      ...cardProps,
      borderStyle: 'dashed',
      borderColor: applied ? 'border-success' : 'border-critical',
      background: applied ? 'bg-surface-success' : 'bg-surface-warning-subdued',
    };
  } 
  // else if (coupon.style === 'style3') { ... add more }

  return (
    <Card key={coupon.code} {...cardProps}>
      <BlockStack gap="200" align={isPreview ? 'center' : undefined}>
        <InlineStack gap="200" align="center" blockAlign="center">
          <Text variant={isPreview ? 'headingLg' : 'headingMd'}>
            {coupon.emoji}
          </Text>
          <Text variant={isPreview ? 'headingLg' : 'headingSm'}>
            {coupon.title}
          </Text>
        </InlineStack>

        <Text tone="subdued" alignment="center">
          {coupon.description}
        </Text>

        {coupon.style && (
          <Box paddingBlock="100">
            <Tag size="small">{coupon.style.replace('style', 'Style ')}</Tag>
          </Box>
        )}

        <Button
          fullWidth
          size="slim"
          variant={applied ? 'primarySuccess' : 'secondary'}
          onClick={() => setAppliedCode(coupon.code)}
          disabled={applied}
          icon={applied ? CheckIcon : undefined}
        >
          {applied ? '✓ Applied' : 'Tap to Apply'}
        </Button>
      </BlockStack>
    </Card>
  );
}

export default CouponScroller;
// ==========================================
// SAMPLE COUPON DATA - SINGLE SOURCE OF TRUTH
// ==========================================

// Global style configuration (applies to ALL coupons)
export const COUPON_STYLES = {
  STYLE_1: 'style-1',
  STYLE_2: 'style-2', 
  STYLE_3: 'style-3',
};

// Style metadata with preview images
export const COUPON_STYLE_METADATA = {
  [COUPON_STYLES.STYLE_1]: {
    name: 'Blue Banner',
    description: 'Classic discount badge with shop branding',
    previewImage: 'https://via.placeholder.com/320x140/0052cc/ffffff?text=25%25+OFF', // Replace with actual preview
  },
  [COUPON_STYLES.STYLE_2]: {
    name: 'Pink Card',
    description: 'Rounded card with soft colors',
    previewImage: 'https://via.placeholder.com/320x140/fce7f3/db2777?text=BAWSE5', // Replace with actual preview
  },
  [COUPON_STYLES.STYLE_3]: {
    name: 'Ticket Design',
    description: 'Event-style ticket with side banner',
    previewImage: 'https://via.placeholder.com/320x140/fbbf24/ffffff?text=TICKET', // Replace with actual preview
  },
};

// Global selected style (applies to all coupons)
export let globalCouponStyle = COUPON_STYLES.STYLE_1;

// Sample coupon data (simplified per-coupon configuration)
export const sampleCoupons = [
  {
    id: 'coupon-1',
    enabled: true,
    code: 'SAVE25',
    label: "Sam's CLUB",
    description: 'Valid until 01-31-2025',
    textAlign: 'left',
    iconUrl: '🏪',
    backgroundColor: '#0052cc',
    textColor: '#ffffff',
    borderRadius: 4,
    discountType: 'percentage',
    discountValue: 25,
    button: {
      text: 'Shop Now',
      textColor: '#ffffff',
      backgroundColor: '#ff9500',
      borderRadius: 4,
    },
  },
  {
    id: 'coupon-2',
    enabled: true,
    code: 'BAWSE5',
    label: 'Baby Sale',
    description: 'Enjoy 5% off sitewide—just for you!',
    textAlign: 'center',
    iconUrl: '✨',
    backgroundColor: '#fce7f3',
    textColor: '#db2777',
    borderRadius: 12,
    discountType: 'percentage',
    discountValue: 5,
    button: {
      text: 'Tap to Apply',
      textColor: '#ffffff',
      backgroundColor: '#ec4899',
      borderRadius: 20,
    },
  },
  {
    id: 'coupon-3',
    enabled: true,
    code: 'TICKET2024',
    label: 'Event Special',
    description: 'Get your tickets now!',
    textAlign: 'center',
    iconUrl: '🎟️',
    backgroundColor: '#ffffff',
    textColor: '#374151',
    borderRadius: 4,
    discountType: 'fixed',
    discountValue: 50,
    button: {
      text: 'BUY TICKETS',
      textColor: '#ffffff',
      backgroundColor: '#ef4444',
      borderRadius: 6,
    },
  },
];

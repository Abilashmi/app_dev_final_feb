# Business Requirements Document (BRD)
## Cart Ninja — Shopify Cart Enhancement App

**Document Version:** 1.0  
**Date:** 2026-05-24  
**Author:** Abilashmi

---

## 1. Executive Summary

Cart Ninja is a Shopify application designed to increase merchant revenue by enhancing the default Shopify cart experience. It replaces the native cart with a feature-rich, customizable slide-out cart drawer that integrates rewards gamification, AI-powered upselling, coupon management, and Frequently Bought Together (FBT) recommendations. The app provides merchants with a unified dashboard to configure all features and track performance through a real-time analytics suite.

---

## 2. Business Objectives

| # | Objective |
|---|-----------|
| 1 | Increase Average Order Value (AOV) for Shopify merchants |
| 2 | Improve cart-to-checkout conversion rate |
| 3 | Provide merchants a no-code solution to deploy cart enhancements |
| 4 | Enable data-driven decisions through actionable cart analytics |
| 5 | Maximize coupon redemption and upsell click-through rates |

---

## 3. Scope

### 3.1 In Scope

- Shopify Admin dashboard application (merchant-facing configuration)
- Theme App Extension injected into the storefront (customer-facing cart UI)
- Rewards progress bar with multi-tier milestone gamification
- AI and manual upsell product recommendation engine
- Coupon slider widget with Shopify discount sync
- Frequently Bought Together (FBT) product widget
- Real-time analytics dashboard with date-range filtering
- Billing and subscription management
- GDPR-compliant webhook handlers

### 3.2 Out of Scope

- Custom storefront (Hydrogen/Headless) support
- Native mobile app (iOS / Android)
- Email or SMS marketing integrations
- Inventory management
- Multi-store management panel

---

## 4. Stakeholders

| Role | Responsibility |
|------|---------------|
| Product Owner | Define feature requirements and acceptance criteria |
| Developer | Build, test, and deploy the application |
| Shopify Merchant | End-user configuring and operating the app |
| Shopify Customer | End-consumer interacting with the cart drawer on storefront |
| Analytics Backend (int.thecartninja.com) | Aggregates and serves event data |

---

## 5. User Personas

### 5.1 Merchant (Primary User)
- Shopify store owner or manager
- Non-technical; expects a no-code setup via a guided dashboard
- Goal: Increase revenue without developer involvement
- Needs: Easy configuration, clear analytics, reliable coupon/upsell management

### 5.2 Shopify Customer (End Consumer)
- Visitor browsing and shopping on a merchant's storefront
- Interacts with cart drawer, reward milestones, coupon codes, and upsell offers
- Goal: Complete purchase; optionally discover relevant products or redeem discounts

---

## 6. Functional Requirements

### 6.1 Cart Drawer

| ID | Requirement |
|----|-------------|
| CD-01 | Replace the default Shopify cart with a customizable slide-out drawer |
| CD-02 | Display cart line items with quantity controls and remove buttons |
| CD-03 | Show real-time cart subtotal in the store's currency |
| CD-04 | Provide a customizable Checkout button with configurable label and color |
| CD-05 | Support empty cart state with configurable messaging |
| CD-06 | Render responsively on desktop and mobile |
| CD-07 | Allow merchants to configure border radius, background color, and text colors |
| CD-08 | Inject into storefront via Shopify Theme App Extension without theme code edits |

### 6.2 Rewards Progress Bar

| ID | Requirement |
|----|-------------|
| RP-01 | Display a visual progress bar showing proximity to the next reward milestone |
| RP-02 | Support up to 5 configurable milestone tiers |
| RP-03 | Support two progress modes: cart value (amount) and cart quantity (items) |
| RP-04 | Allow per-tier configuration: icon, reward type, title, and messaging |
| RP-05 | Provide icon presets: gift, shipping, discount, star, trophy, heart, diamond, lock; and support custom SVG icons |
| RP-06 | Show "almost there" message as customer approaches a milestone |
| RP-07 | Trigger confetti animation (toggleable) upon milestone completion |
| RP-08 | Support gradient fill styling on the progress bar |
| RP-09 | Allow merchants to set a custom completion message per tier |

### 6.3 Upsell Engine

| ID | Requirement |
|----|-------------|
| US-01 | Provide AI-powered product recommendation mode |
| US-02 | Provide a manual rules engine with three rule types |
| US-03 | Rule Type 1 — Global: Display selected products to all customers |
| US-04 | Rule Type 2 — Trigger-based: Display products only if specific products or collections are in the cart |
| US-05 | Rule Type 3 — Cart Value: Display products only if cart subtotal exceeds a configured threshold |
| US-06 | Allow carousel or grid layout selection |
| US-07 | Allow configuration of maximum number of products to display |
| US-08 | Allow toggling product reviews/ratings display |
| US-09 | Allow configuring custom Add-to-Cart button label |
| US-10 | Allow showing upsell section even when cart is empty (optional) |

### 6.4 Frequently Bought Together (FBT)

| ID | Requirement |
|----|-------------|
| FBT-01 | Display complementary product suggestions based on cart contents |
| FBT-02 | Show product image, title, price, and quick-add button per suggestion |
| FBT-03 | Configurable as a standalone storefront widget |
| FBT-04 | Log FBT interaction events to the analytics backend |

### 6.5 Coupon Slider

| ID | Requirement |
|----|-------------|
| CPN-01 | Sync available coupons from Shopify Admin API (Basic %, BXGY, Free Shipping) |
| CPN-02 | Display coupons in three visual style presets |
| CPN-03 | Support per-coupon style overrides (color, icon, background, text) |
| CPN-04 | Allow positioning the coupon section at top or bottom of drawer |
| CPN-05 | Support grid and carousel layout options |
| CPN-06 | Support horizontal and vertical alignment |
| CPN-07 | Enable one-click coupon application to the cart (exclusive — one active at a time) |
| CPN-08 | Allow configuring section title with font size, color, and alignment |
| CPN-09 | Track coupon click events to the analytics backend |

### 6.6 Analytics Dashboard

| ID | Requirement |
|----|-------------|
| AN-01 | Display KPI cards: Checkout Clicks, Coupon Clicks, Upsell Clicks, Upsell Revenue, Total Cart Revenue, Total Coupons Applied |
| AN-02 | Provide a date range picker with presets: Today, Yesterday, Last 7 / 30 / 90 Days, Last 12 Months |
| AN-03 | Support Fixed and Rolling date range modes |
| AN-04 | Render an area chart for revenue trends over time |
| AN-05 | Render a bar chart for performance breakdown by metric |
| AN-06 | Render a composed chart (bars + line) for click-through rate |
| AN-07 | Render a pie chart for cart journey breakdown (abandoned vs. completed) |
| AN-08 | Format all revenue values using the shop's currency and locale |

### 6.7 Coupon / Discount Management

| ID | Requirement |
|----|-------------|
| DM-01 | List all Shopify discounts with status (Active, Scheduled, Expired), type, and source |
| DM-02 | Filter discounts by status, type, and source |
| DM-03 | Sort discounts by creation date or usage count |
| DM-04 | Allow deletion of app-created coupons |
| DM-05 | Display usage count versus usage limit per coupon |
| DM-06 | Provide a form to create new discount coupons via Shopify GraphQL mutations |

### 6.8 Billing & Subscription

| ID | Requirement |
|----|-------------|
| BL-01 | Display a subscription plan selection screen |
| BL-02 | Show billing history with charge dates and amounts |
| BL-03 | Support one-time charge triggers via Shopify Billing API |
| BL-04 | Handle subscription update webhooks from Shopify |

### 6.9 Onboarding / Setup

| ID | Requirement |
|----|-------------|
| SU-01 | Provide a step-by-step installation guide |
| SU-02 | Include deep links to the merchant's Shopify theme editor |
| SU-03 | Track onboarding completion steps |

### 6.10 Webhooks & Compliance

| ID | Requirement |
|----|-------------|
| WH-01 | Handle `app/uninstalled` webhook to clean up merchant data |
| WH-02 | Handle `app_subscriptions/update` webhook |
| WH-03 | Handle `customers/redact` webhook for GDPR compliance |
| WH-04 | Handle `shop/redact` webhook for GDPR compliance |
| WH-05 | Handle `app/scopes_update` webhook for OAuth scope changes |

---

## 7. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NF-01 | Performance | Cart drawer should render and become interactive within 300ms of page load |
| NF-02 | Availability | Admin dashboard and API endpoints must maintain 99.9% uptime |
| NF-03 | Security | All admin routes must be authenticated via Shopify OAuth; API routes must validate shop session |
| NF-04 | Scalability | Architecture must support horizontal scaling; database should support PostgreSQL in production |
| NF-05 | Compatibility | Cart drawer must support the latest two major versions of Chrome, Firefox, Safari, and Edge |
| NF-06 | GDPR | All customer data must be erasable on merchant request via GDPR webhooks |
| NF-07 | Accessibility | Admin dashboard UI must follow Shopify Polaris accessibility guidelines |
| NF-08 | Responsiveness | Storefront cart drawer must function correctly on viewport widths from 320px to 2560px |

---

## 8. Technical Architecture

### 8.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18.3 with React Router 7.x |
| Admin UI Library | Shopify Polaris v13.9.5 |
| Database ORM | Prisma 6.x |
| Database (Dev) | SQLite |
| Database (Prod) | PostgreSQL / MySQL |
| Charts | Recharts 3.7.0 |
| Shopify Integration | @shopify/shopify-app-react-router, App Bridge React |
| Theme Extension | Shopify Theme App Extension (Liquid + Vanilla JS/CSS) |
| Analytics Backend | Remote PHP service at `https://int.thecartninja.com` |

### 8.2 Database Models

| Model | Purpose |
|-------|---------|
| Session | Stores Shopify OAuth sessions and admin credentials |
| UpsellRule | Stores manual upsell configurations per shop (GLOBAL, TRIGGERED, CART_CONDITIONS) |
| WidgetSettings | JSON-based storage for all widget configurations (coupons, FBT, progress bar, upsell) per shop |

### 8.3 Key Integration Flows

1. **Merchant Configuration** → Admin Dashboard → Prisma DB + Remote PHP Backend
2. **Theme Activation** → Merchant enables App Embed in Shopify Theme Editor
3. **Storefront Load** → Liquid block injects JS/CSS → JS fetches config via `/api/cartdrawer-config`
4. **Customer Interaction** → Cart events → Analytics tracking to `https://int.thecartninja.com`
5. **Analytics View** → Dashboard fetches aggregated data via `/api/analytics`

---

## 9. User Stories

| ID | As a… | I want to… | So that… |
|----|--------|-----------|----------|
| S-01 | Merchant | Configure a slide-out cart drawer with my brand colors | My cart matches my store's visual identity |
| S-02 | Merchant | Set up milestone rewards for customers | Customers are motivated to add more items |
| S-03 | Merchant | Create upsell rules to show relevant products | I can increase AOV without manual merchandising |
| S-04 | Merchant | Sync my Shopify coupons into the cart drawer | Customers can easily discover and apply discounts |
| S-05 | Merchant | View analytics on coupon usage and upsell clicks | I can measure the ROI of my cart optimizations |
| S-06 | Merchant | Create new discount coupons directly from the app | I don't have to leave the app to manage promotions |
| S-07 | Customer | See a rewards progress bar in the cart | I know how much more I need to spend for a reward |
| S-08 | Customer | Apply a coupon code with one click | Checkout is faster and more convenient |
| S-09 | Customer | See recommended products in the cart | I can discover relevant items before checking out |
| S-10 | Customer | View FBT suggestions for products in my cart | I can complete my purchase more easily |

---

## 10. Assumptions & Constraints

### Assumptions
- Merchants are using online Shopify stores (not POS-only)
- Merchants have at least one active Shopify theme
- The remote analytics backend (`https://int.thecartninja.com`) is maintained separately
- Shopify App Store listing and review are handled outside this document's scope

### Constraints
- App must comply with Shopify's Partner Program policies
- All storefront-side code must be injected via Theme App Extension (no direct theme file edits)
- GDPR webhook handlers must respond within Shopify's required timeframes
- App billing must use Shopify's native Billing API

---

## 11. Acceptance Criteria

| Feature | Acceptance Criteria |
|---------|-------------------|
| Cart Drawer | Cart opens on cart icon click; items display with correct prices; checkout button routes to Shopify checkout |
| Progress Bar | Bar fills proportionally to cart value/quantity; milestone icon and message update at each tier |
| Upsell | Products matching configured rules appear in carousel/grid; clicking Add adds item to cart |
| Coupons | Synced coupons appear in drawer; clicking a coupon applies it and shows confirmation |
| FBT | Relevant products appear below cart items; quick-add button works without page reload |
| Analytics | Dashboard loads within 3 seconds; all KPIs match data from analytics backend for selected date range |
| Billing | Merchant can view plan options and upgrade; billing history loads accurately |

---

## 12. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Shopify API breaking changes | Medium | High | Pin API version; monitor Shopify changelog |
| Analytics backend downtime | Low | Medium | Graceful degradation; dashboard shows cached/empty state |
| Theme conflict with cart drawer injection | Medium | High | Test on top 10 Shopify themes; provide conflict resolution guide |
| App Store rejection | Low | High | Follow Shopify review guidelines; test on dev store before submission |
| Data loss on uninstall | Low | High | Webhooks clean up data; merchants warned before uninstall |

---

## 13. Glossary

| Term | Definition |
|------|-----------|
| AOV | Average Order Value — average spend per transaction |
| FBT | Frequently Bought Together — product recommendation strategy |
| Cart Drawer | A slide-out panel replacing the default Shopify cart page |
| Theme App Extension | Shopify mechanism for injecting app code into storefronts without editing theme files |
| Upsell | Suggesting a higher-value or complementary product to increase order value |
| Milestone | A reward threshold in the progress bar system |
| KPI | Key Performance Indicator |
| GDPR | General Data Protection Regulation (EU data privacy law) |

---

*End of Document*

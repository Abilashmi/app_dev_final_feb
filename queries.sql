-- Real SQL Queries for Cart Drawer Database
-- These are the actual SQL queries used in the application based on Prisma operations
-- Database: SQLite (dev.sqlite)

-- 1. Fetch widget settings for a shop (used in product-widget.server.js)
SELECT id, shop, coupons, fbt, progressBar, upsell, updatedAt
FROM WidgetSettings
WHERE shop = ?;

-- 2. Upsert widget settings for coupons (used in product-widget.server.js)
INSERT OR REPLACE INTO WidgetSettings (id, shop, coupons, fbt, updatedAt)
VALUES (
  COALESCE((SELECT id FROM WidgetSettings WHERE shop = ?), lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  ?,
  ?,
  COALESCE((SELECT fbt FROM WidgetSettings WHERE shop = ?), '{"activeTemplate":"grid","mode":"manual","templates":{},"manualRules":[]}'),
  datetime('now')
);

-- 3. Upsert widget settings for FBT (used in product-widget.server.js)
INSERT OR REPLACE INTO WidgetSettings (id, shop, fbt, coupons, updatedAt)
VALUES (
  COALESCE((SELECT id FROM WidgetSettings WHERE shop = ?), lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
  ?,
  ?,
  COALESCE((SELECT coupons FROM WidgetSettings WHERE shop = ?), '{"activeTemplate":"slider","templates":{},"selectedActiveCoupons":[],"couponOverrides":{}}'),
  datetime('now')
);

-- 4. Fetch all upsell rules for a shop ordered by priority (used in api.upsell.jsx)
SELECT id, shop, name, enabled, ruleType, priority, triggerProducts, triggerCollections,
       upsellProducts, upsellCollections, excludedProducts, excludedCollections,
       cartValueThreshold, displayLimit, layout, buttonText, showPrice, title,
       trackViews, trackClicks, createdAt, updatedAt
FROM UpsellRule
WHERE shop = ?
ORDER BY priority ASC;

-- 5. Upsert upsell rule (used in api.upsell.jsx)
INSERT OR REPLACE INTO UpsellRule (id, shop, enabled, title, ruleType, triggerProducts,
  triggerCollections, upsellProducts, upsellCollections, priority, layout, cartValueThreshold, updatedAt)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));

-- 6. Delete all sessions for a shop (used in webhooks.app.uninstalled.jsx)
DELETE FROM Session WHERE shop = ?;

-- 7. Update session (used in webhooks.app.scopes_update.jsx)
UPDATE Session SET scope = ?, updatedAt = datetime('now') WHERE shop = ?;

-- 8. Count total sessions
SELECT COUNT(*) as total_sessions FROM Session;

-- 9. Get all shops with sessions
SELECT DISTINCT shop FROM Session;

-- 10. Get all widget settings
SELECT shop, updatedAt FROM WidgetSettings ORDER BY updatedAt DESC;
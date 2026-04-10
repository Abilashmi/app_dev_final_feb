<?php
require_once __DIR__ . '/config.php';

/**
 * POST /shop-redact.php
 * GDPR: Permanently delete ALL data for a shop.
 * Triggered 48 hours after the merchant uninstalls the app.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST only']);
    exit;
}

$input  = json_decode(file_get_contents('php://input'), true);
$shop   = $input['shop_domain'] ?? null;
$shopId = $input['shop_id']     ?? null;

if (!$shop) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'shop_domain required']);
    exit;
}

$deleted = [];

try {
    // List every table that has a shop_domain or shop column and delete the rows.
    // Add / remove tables here to match your actual schema.
    $shopTables = [
        ['table' => 'cart_drawer',       'column' => 'shop'],
        ['table' => 'shops',             'column' => 'shop_domain'],
        ['table' => 'billing_usage',     'column' => 'shop_domain'],
        ['table' => 'billing_charges',   'column' => 'shop_domain'],
        ['table' => 'analytics',         'column' => 'shop_domain'],
        ['table' => 'gdpr_data_requests','column' => 'shop_domain'],
        ['table' => 'gdpr_redactions',   'column' => 'shop_domain'],
    ];

    $existingTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

    foreach ($shopTables as $entry) {
        if (!in_array($entry['table'], $existingTables)) continue;

        $stmt = $pdo->prepare(
            "DELETE FROM `{$entry['table']}` WHERE `{$entry['column']}` = :shop"
        );
        $stmt->execute([':shop' => $shop]);
        $rows = $stmt->rowCount();

        if ($rows > 0) {
            $deleted[] = "{$entry['table']} ({$rows} rows)";
        }
    }

    // ── Log the shop redaction ────────────────────────────────────────────
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS gdpr_shop_redactions (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            shop_domain VARCHAR(255) NOT NULL,
            shop_id     BIGINT       DEFAULT NULL,
            redacted_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->prepare("
        INSERT INTO gdpr_shop_redactions (shop_domain, shop_id) VALUES (:shop, :sid)
    ")->execute([':shop' => $shop, ':sid' => $shopId]);

    echo json_encode([
        'success' => true,
        'message' => "All data deleted for $shop",
        'deleted' => $deleted,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

<?php
require_once __DIR__ . '/config.php';

/**
 * POST /customers-redact.php
 * GDPR: Anonymize / delete all personal data for the given customer.
 * Must be completed within 30 days of receiving this request.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST only']);
    exit;
}

$input         = json_decode(file_get_contents('php://input'), true);
$shop          = $input['shop_domain']      ?? null;
$customerId    = $input['customer_id']      ?? null;
$customerEmail = $input['customer_email']   ?? null;
$customerPhone = $input['customer_phone']   ?? null;
$ordersToRedact= $input['orders_to_redact'] ?? [];

if (!$shop || !$customerId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'shop_domain and customer_id required']);
    exit;
}

$redacted = [];

try {
    // ── Anonymize any analytics/click rows tied to this customer ──────────
    // Adjust table/column names to match your actual schema.

    // Example: anonymize in analytics table if customer_id column exists
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

    // Anonymize email references in any table that has both shop + email columns
    $emailTables = ['analytics']; // add any tables that store customer email
    foreach ($emailTables as $table) {
        if (!in_array($table, $tables)) continue;

        $cols = array_column(
            $pdo->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_ASSOC),
            'Field'
        );

        if (in_array('customer_email', $cols) && in_array('shop_domain', $cols)) {
            $stmt = $pdo->prepare("
                UPDATE `$table`
                SET customer_email = '[redacted]'
                WHERE shop_domain = :shop AND customer_email = :email
            ");
            $stmt->execute([':shop' => $shop, ':email' => $customerEmail]);
            $redacted[] = $table;
        }
    }

    // ── Log the redaction ─────────────────────────────────────────────────
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS gdpr_redactions (
            id             INT AUTO_INCREMENT PRIMARY KEY,
            shop_domain    VARCHAR(255) NOT NULL,
            customer_id    BIGINT       DEFAULT NULL,
            customer_email VARCHAR(255) DEFAULT NULL,
            redacted_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->prepare("
        INSERT INTO gdpr_redactions (shop_domain, customer_id, customer_email)
        VALUES (:shop, :cid, :email)
    ")->execute([':shop' => $shop, ':cid' => $customerId, ':email' => $customerEmail]);

    echo json_encode([
        'success'       => true,
        'message'       => 'Customer data redacted',
        'tables_updated'=> $redacted,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

<?php
require_once __DIR__ . '/config.php';

/**
 * POST /customers-data-request.php
 * GDPR: Log a customer data request so the shop owner can respond.
 * Shopify does NOT expect this endpoint to return data — it expects the
 * merchant to be notified so they can manually provide the data.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST only']);
    exit;
}

$input        = json_decode(file_get_contents('php://input'), true);
$shop         = $input['shop_domain']      ?? null;
$customerId   = $input['customer_id']      ?? null;
$customerEmail= $input['customer_email']   ?? null;
$orders       = $input['orders_requested'] ?? [];
$requestId    = $input['data_request_id']  ?? null;

if (!$shop) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'shop_domain required']);
    exit;
}

try {
    // Ensure table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS gdpr_data_requests (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            shop_domain     VARCHAR(255) NOT NULL,
            customer_id     BIGINT       DEFAULT NULL,
            customer_email  VARCHAR(255) DEFAULT NULL,
            orders_requested TEXT        DEFAULT NULL,
            data_request_id BIGINT       DEFAULT NULL,
            requested_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $stmt = $pdo->prepare("
        INSERT INTO gdpr_data_requests
            (shop_domain, customer_id, customer_email, orders_requested, data_request_id)
        VALUES
            (:shop, :cid, :email, :orders, :req_id)
    ");
    $stmt->execute([
        ':shop'    => $shop,
        ':cid'     => $customerId,
        ':email'   => $customerEmail,
        ':orders'  => json_encode($orders),
        ':req_id'  => $requestId,
    ]);

    echo json_encode(['success' => true, 'message' => 'Data request logged']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

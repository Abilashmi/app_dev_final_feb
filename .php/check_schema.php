<?php
require_once __DIR__ . '/config.php';

header('Content-Type: text/plain');

try {
    echo "Checking schema for table 'cart_drawer'...\n\n";
    
    $stmt = $pdo->query("DESCRIBE cart_drawer");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $col) {
        printf("%-20s | %-20s | %-10s | %-10s\n", 
            $col['Field'], 
            $col['Type'], 
            $col['Null'], 
            $col['Key']
        );
    }
    
    echo "\nIMPORTANT: 'progress_data', 'coupon_data', and 'upsell_data' should be 'text' or 'longtext'.\n";
    echo "If they are 'varchar(255)', they will truncate and break the cart drawer functionality.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}

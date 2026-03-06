<?php

$conn = new mysqli("localhost","user","pass","database");

$data = json_decode(file_get_contents("php://input"), true);

$shop_id = $data['shop_id'];
$domain = $data['domain'];
$event_type = $data['event_type'];

$stmt = $conn->prepare("
INSERT INTO cart_click_events (shop_id, domain, event_type)
VALUES (?, ?, ?)
");

$stmt->bind_param("sss", $shop_id, $domain, $event_type);
$stmt->execute();

echo json_encode(["status"=>"success"]);

<?php

require_once __DIR__ . '/vendor/autoload.php';
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

$host = getenv('RABBITMQ_HOST') ?: 'rabbit';
$port = getenv('RABBITMQ_PORT') ?: 5673;
$user = 'guest';
$pass = 'guest';

$dbHost = getenv('MYSQL_HOST') ?: 'mysql';
$dbPort = getenv('MYSQL_PORT') ?: 3306;
$dbName = getenv('MYSQL_DATABASE') ?: 'app_db';
$dbUser = getenv('MYSQL_USER') ?: 'user';
$dbPass = getenv('MYSQL_PASSWORD') ?: 'password';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400"); // Cache preflight requests for 24 hours

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['REQUEST_URI'] === '/api/send-message') {
    $input = json_decode(file_get_contents('php://input'), true);
    $message = $input['message'] ?? '';

    if (empty($message)) {
        http_response_code(400);
        echo json_encode(["error" => "Message cannot be empty."]);
        exit;
    }

    $message .= ' => Php(Mysql)';

    try {
        // insert to mysql
        $pdo = new PDO("mysql:host=$dbHost;port=$dbPort;dbname=$dbName", $dbUser, $dbPass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Create table if not exist
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");

        // Save message to MySQL database
        $stmt = $pdo->prepare("INSERT INTO messages (content, created_at) VALUES (:content, NOW())");
        $stmt->execute(['content' => $message]);

        // Send message to RabbitMQ
        $connection = new AMQPStreamConnection($host, $port, $user, $pass);
        $channel = $connection->channel();

        $channel->queue_declare('messages', false, true, false, false);

        $msg = new AMQPMessage($message . ' => Rabbit');
        $channel->basic_publish($msg, '', 'messages');

        $channel->close();
        $connection->close();

        echo json_encode(["success" => true]);
        exit;

    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
        exit;
    }
}

http_response_code(404);
echo json_encode(["error" => "Endpoint not found."]);

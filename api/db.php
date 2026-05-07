<?php
declare(strict_types=1);

const DB_HOST = 'localhost';
const DB_PORT = 3306;
const DB_NAME = 'samui_inbound';
const DB_USER = 'samui_inbound';
const DB_PASS = 'S4ZJ@_tihyenzn89';

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function json_response(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $code = 400): void {
    json_response(['success' => false, 'message' => $message], $code);
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function start_session_safe(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'secure'   => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_name('SAMUI_SID');
        session_start();
    }
}

function require_login(): array {
    start_session_safe();
    if (empty($_SESSION['user'])) {
        json_error('Unauthorized', 401);
    }
    return $_SESSION['user'];
}

function require_admin(): array {
    $u = require_login();
    if (($u['role'] ?? '') !== 'admin') {
        json_error('Forbidden', 403);
    }
    return $u;
}

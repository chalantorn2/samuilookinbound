<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

start_session_safe();

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($action === 'me' && $method === 'GET') {
        if (empty($_SESSION['user'])) {
            json_response(['success' => true, 'user' => null]);
        }
        json_response(['success' => true, 'user' => $_SESSION['user']]);
    }

    if ($action === 'login' && $method === 'POST') {
        $body = read_json_body();
        $username = trim((string)($body['username'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if ($username === '' || $password === '') {
            json_error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 400);
        }

        $stmt = db()->prepare('SELECT id, username, password, full_name, role FROM users WHERE username = :u LIMIT 1');
        $stmt->execute([':u' => $username]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($password, $row['password'])) {
            json_error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
        }

        unset($row['password']);
        $row['id'] = (int)$row['id'];

        session_regenerate_id(true);
        $_SESSION['user'] = $row;

        json_response(['success' => true, 'user' => $row]);
    }

    if ($action === 'logout' && $method === 'POST') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        json_response(['success' => true]);
    }

    json_error('Unknown action', 404);
} catch (Throwable $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}

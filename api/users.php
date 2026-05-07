<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$me = require_login();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    if ($method === 'GET') {
        $stmt = db()->query('SELECT id, username, full_name, role, created_at, updated_at FROM users ORDER BY id ASC');
        $users = array_map(function ($u) {
            $u['id'] = (int)$u['id'];
            return $u;
        }, $stmt->fetchAll());
        json_response(['success' => true, 'users' => $users]);
    }

    // Mutations require admin
    if (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
        if (($me['role'] ?? '') !== 'admin') {
            json_error('Forbidden — admin only', 403);
        }
    }

    if ($method === 'POST') {
        $body = read_json_body();
        $username  = trim((string)($body['username']  ?? ''));
        $fullName  = trim((string)($body['full_name'] ?? ''));
        $role      = (string)($body['role'] ?? 'user');
        $password  = (string)($body['password'] ?? '');

        if ($username === '' || $fullName === '' || $password === '') {
            json_error('ข้อมูลไม่ครบถ้วน', 400);
        }
        if (!in_array($role, ['user', 'admin'], true)) {
            json_error('Role ไม่ถูกต้อง', 400);
        }

        $exists = db()->prepare('SELECT 1 FROM users WHERE username = :u');
        $exists->execute([':u' => $username]);
        if ($exists->fetch()) json_error('Username นี้ถูกใช้แล้ว', 409);

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = db()->prepare('INSERT INTO users (username, password, full_name, role) VALUES (:u, :p, :f, :r)');
        $stmt->execute([
            ':u' => $username, ':p' => $hash, ':f' => $fullName, ':r' => $role,
        ]);
        json_response(['success' => true, 'id' => (int)db()->lastInsertId()], 201);
    }

    if ($method === 'PUT') {
        if ($id <= 0) json_error('Missing id', 400);

        $body = read_json_body();
        $fullName = trim((string)($body['full_name'] ?? ''));
        $role     = (string)($body['role'] ?? 'user');
        $password = (string)($body['password'] ?? '');

        if ($fullName === '') json_error('ต้องระบุชื่อ-สกุล', 400);
        if (!in_array($role, ['user', 'admin'], true)) {
            json_error('Role ไม่ถูกต้อง', 400);
        }

        // Don't let an admin demote themselves to user (would lock out admin features for self)
        if ($id === (int)$me['id'] && $role !== 'admin') {
            json_error('ไม่สามารถลด role ของตนเองได้', 400);
        }

        $sql = 'UPDATE users SET full_name = :f, role = :r';
        $params = [
            ':f' => $fullName,
            ':r' => $role,
            ':id' => $id,
        ];
        if ($password !== '') {
            $sql .= ', password = :p';
            $params[':p'] = password_hash($password, PASSWORD_DEFAULT);
        }
        $sql .= ' WHERE id = :id';

        $stmt = db()->prepare($sql);
        $stmt->execute($params);

        // Refresh own session if editing self
        if ($id === (int)$me['id']) {
            $r = db()->prepare('SELECT id, username, full_name, role FROM users WHERE id = :id');
            $r->execute([':id' => $id]);
            $u = $r->fetch();
            if ($u) {
                $u['id'] = (int)$u['id'];
                $_SESSION['user'] = $u;
            }
        }

        json_response(['success' => true]);
    }

    if ($method === 'DELETE') {
        if ($id <= 0) json_error('Missing id', 400);
        if ($id === (int)$me['id']) json_error('ไม่สามารถลบบัญชีของตนเองได้', 400);

        $stmt = db()->prepare('DELETE FROM users WHERE id = :id');
        $stmt->execute([':id' => $id]);
        json_response(['success' => true]);
    }

    json_error('Method not allowed', 405);
} catch (Throwable $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}

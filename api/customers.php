<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$me = require_login();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    if ($method === 'GET') {
        $search = trim((string)($_GET['search'] ?? ''));
        $sql = 'SELECT id, code, name, email, phone, created_at, updated_at FROM customers';
        $params = [];
        if ($search !== '') {
            $sql .= ' WHERE code LIKE :q OR name LIKE :q';
            $params[':q'] = '%' . $search . '%';
        }
        $sql .= ' ORDER BY name ASC';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = array_map(function ($r) {
            $r['id'] = (int)$r['id'];
            return $r;
        }, $stmt->fetchAll());
        json_response(['success' => true, 'items' => $rows]);
    }

    if ($method === 'POST') {
        $b = read_json_body();
        $code  = strtoupper(trim((string)($b['code']  ?? '')));
        $name  = trim((string)($b['name']  ?? ''));
        $email = trim((string)($b['email'] ?? ''));
        $phone = trim((string)($b['phone'] ?? ''));

        if ($code === '' || $name === '') json_error('กรุณาระบุ code และ name', 400);
        if (mb_strlen($code) !== 5) json_error('Code ต้องมี 5 ตัวอักษร', 400);

        $exists = db()->prepare('SELECT 1 FROM customers WHERE code = :c');
        $exists->execute([':c' => $code]);
        if ($exists->fetch()) json_error('Code นี้ถูกใช้แล้ว', 409);

        $stmt = db()->prepare(
            'INSERT INTO customers (code, name, email, phone) VALUES (:c, :n, :e, :p)'
        );
        $stmt->execute([
            ':c' => $code, ':n' => $name,
            ':e' => $email !== '' ? $email : null,
            ':p' => $phone !== '' ? $phone : null,
        ]);
        json_response(['success' => true, 'id' => (int)db()->lastInsertId()], 201);
    }

    if ($method === 'PUT') {
        if ($id <= 0) json_error('Missing id', 400);
        $b = read_json_body();
        $code  = strtoupper(trim((string)($b['code']  ?? '')));
        $name  = trim((string)($b['name']  ?? ''));
        $email = trim((string)($b['email'] ?? ''));
        $phone = trim((string)($b['phone'] ?? ''));

        if ($code === '' || $name === '') json_error('กรุณาระบุ code และ name', 400);
        if (mb_strlen($code) !== 5) json_error('Code ต้องมี 5 ตัวอักษร', 400);

        $dup = db()->prepare('SELECT 1 FROM customers WHERE code = :c AND id <> :id');
        $dup->execute([':c' => $code, ':id' => $id]);
        if ($dup->fetch()) json_error('Code นี้ถูกใช้แล้ว', 409);

        $stmt = db()->prepare(
            'UPDATE customers SET code = :c, name = :n, email = :e, phone = :p WHERE id = :id'
        );
        $stmt->execute([
            ':c' => $code, ':n' => $name,
            ':e' => $email !== '' ? $email : null,
            ':p' => $phone !== '' ? $phone : null,
            ':id' => $id,
        ]);
        json_response(['success' => true]);
    }

    if ($method === 'DELETE') {
        if ($id <= 0) json_error('Missing id', 400);
        $stmt = db()->prepare('DELETE FROM customers WHERE id = :id');
        $stmt->execute([':id' => $id]);
        json_response(['success' => true]);
    }

    json_error('Method not allowed', 405);
} catch (Throwable $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}

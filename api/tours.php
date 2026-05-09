<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$me = require_login();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    if ($method === 'GET') {
        $search = trim((string)($_GET['search'] ?? ''));
        $sql = 'SELECT id, name, description, created_at, updated_at FROM tours';
        $params = [];
        if ($search !== '') {
            $sql .= ' WHERE name LIKE :q OR description LIKE :q';
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
        $name = trim((string)($b['name'] ?? ''));
        $desc = trim((string)($b['description'] ?? ''));

        if ($name === '') json_error('กรุณาระบุชื่อทัวร์', 400);

        $exists = db()->prepare('SELECT 1 FROM tours WHERE name = :n');
        $exists->execute([':n' => $name]);
        if ($exists->fetch()) json_error('ชื่อทัวร์นี้ถูกใช้แล้ว', 409);

        $stmt = db()->prepare(
            'INSERT INTO tours (name, description) VALUES (:n, :d)'
        );
        $stmt->execute([
            ':n' => $name,
            ':d' => $desc !== '' ? $desc : null,
        ]);
        json_response(['success' => true, 'id' => (int)db()->lastInsertId()], 201);
    }

    if ($method === 'PUT') {
        if ($id <= 0) json_error('Missing id', 400);
        $b = read_json_body();
        $name = trim((string)($b['name'] ?? ''));
        $desc = trim((string)($b['description'] ?? ''));

        if ($name === '') json_error('กรุณาระบุชื่อทัวร์', 400);

        $dup = db()->prepare('SELECT 1 FROM tours WHERE name = :n AND id <> :id');
        $dup->execute([':n' => $name, ':id' => $id]);
        if ($dup->fetch()) json_error('ชื่อทัวร์นี้ถูกใช้แล้ว', 409);

        $stmt = db()->prepare(
            'UPDATE tours SET name = :n, description = :d WHERE id = :id'
        );
        $stmt->execute([
            ':n' => $name,
            ':d' => $desc !== '' ? $desc : null,
            ':id' => $id,
        ]);
        json_response(['success' => true]);
    }

    if ($method === 'DELETE') {
        if ($id <= 0) json_error('Missing id', 400);
        $stmt = db()->prepare('DELETE FROM tours WHERE id = :id');
        $stmt->execute([':id' => $id]);
        json_response(['success' => true]);
    }

    json_error('Method not allowed', 405);
} catch (Throwable $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}

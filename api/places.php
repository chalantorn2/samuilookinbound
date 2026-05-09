<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$me = require_login();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

const PLACE_TYPES = ['hotel', 'airport', 'pier', 'place', 'other'];

try {
    if ($method === 'GET') {
        $search = trim((string)($_GET['search'] ?? ''));
        $type   = trim((string)($_GET['type']   ?? ''));

        $sql = 'SELECT id, name, type, location, phone, created_at, updated_at FROM places WHERE 1=1';
        $params = [];
        if ($type !== '' && in_array($type, PLACE_TYPES, true)) {
            $sql .= ' AND type = :t';
            $params[':t'] = $type;
        }
        if ($search !== '') {
            $sql .= ' AND (name LIKE :q OR location LIKE :q)';
            $params[':q'] = '%' . $search . '%';
        }
        $sql .= ' ORDER BY type ASC, name ASC';
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
        $type = (string)($b['type'] ?? 'place');
        $location = trim((string)($b['location'] ?? ''));
        $phone = trim((string)($b['phone'] ?? ''));

        if ($name === '') json_error('กรุณาระบุชื่อสถานที่', 400);
        if (!in_array($type, PLACE_TYPES, true)) json_error('type ไม่ถูกต้อง', 400);

        $exists = db()->prepare('SELECT 1 FROM places WHERE name = :n');
        $exists->execute([':n' => $name]);
        if ($exists->fetch()) json_error('ชื่อนี้ถูกใช้แล้ว', 409);

        $stmt = db()->prepare(
            'INSERT INTO places (name, type, location, phone) VALUES (:n, :t, :l, :p)'
        );
        $stmt->execute([
            ':n' => $name, ':t' => $type,
            ':l' => $location !== '' ? $location : null,
            ':p' => $phone !== '' ? $phone : null,
        ]);
        json_response(['success' => true, 'id' => (int)db()->lastInsertId()], 201);
    }

    if ($method === 'PUT') {
        if ($id <= 0) json_error('Missing id', 400);
        $b = read_json_body();
        $name = trim((string)($b['name'] ?? ''));
        $type = (string)($b['type'] ?? 'place');
        $location = trim((string)($b['location'] ?? ''));
        $phone = trim((string)($b['phone'] ?? ''));

        if ($name === '') json_error('กรุณาระบุชื่อสถานที่', 400);
        if (!in_array($type, PLACE_TYPES, true)) json_error('type ไม่ถูกต้อง', 400);

        $dup = db()->prepare('SELECT 1 FROM places WHERE name = :n AND id <> :id');
        $dup->execute([':n' => $name, ':id' => $id]);
        if ($dup->fetch()) json_error('ชื่อนี้ถูกใช้แล้ว', 409);

        $stmt = db()->prepare(
            'UPDATE places SET name = :n, type = :t, location = :l, phone = :p WHERE id = :id'
        );
        $stmt->execute([
            ':n' => $name, ':t' => $type,
            ':l' => $location !== '' ? $location : null,
            ':p' => $phone !== '' ? $phone : null,
            ':id' => $id,
        ]);
        json_response(['success' => true]);
    }

    if ($method === 'DELETE') {
        if ($id <= 0) json_error('Missing id', 400);
        $stmt = db()->prepare('DELETE FROM places WHERE id = :id');
        $stmt->execute([':id' => $id]);
        json_response(['success' => true]);
    }

    json_error('Method not allowed', 405);
} catch (Throwable $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}

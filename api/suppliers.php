<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$me = require_login();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

const SUPPLIER_TYPES = ['transfer', 'boat', 'tour', 'hotel', 'agent', 'other'];

try {
    if ($method === 'GET') {
        $search = trim((string)($_GET['search'] ?? ''));
        $type   = trim((string)($_GET['type']   ?? ''));

        $sql = 'SELECT id, code, name, type, created_at, updated_at FROM suppliers WHERE 1=1';
        $params = [];
        if ($type !== '' && in_array($type, SUPPLIER_TYPES, true)) {
            $sql .= ' AND type = :t';
            $params[':t'] = $type;
        }
        if ($search !== '') {
            $sql .= ' AND (code LIKE :q OR name LIKE :q)';
            $params[':q'] = '%' . $search . '%';
        }
        $sql .= ' ORDER BY type ASC, code ASC';
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
        $code = strtoupper(trim((string)($b['code'] ?? '')));
        $name = trim((string)($b['name'] ?? ''));
        $type = (string)($b['type'] ?? 'other');

        if ($code === '' || $name === '') json_error('กรุณาระบุ code และ name', 400);
        if (mb_strlen($code) !== 5) json_error('Code ต้องมี 5 ตัวอักษร', 400);
        if (!in_array($type, SUPPLIER_TYPES, true)) json_error('type ไม่ถูกต้อง', 400);

        $exists = db()->prepare('SELECT 1 FROM suppliers WHERE code = :c');
        $exists->execute([':c' => $code]);
        if ($exists->fetch()) json_error('code นี้ถูกใช้แล้ว', 409);

        $stmt = db()->prepare(
            'INSERT INTO suppliers (code, name, type) VALUES (:c, :n, :t)'
        );
        $stmt->execute([
            ':c' => $code, ':n' => $name, ':t' => $type,
        ]);
        json_response(['success' => true, 'id' => (int)db()->lastInsertId()], 201);
    }

    if ($method === 'PUT') {
        if ($id <= 0) json_error('Missing id', 400);
        $b = read_json_body();
        $code = strtoupper(trim((string)($b['code'] ?? '')));
        $name = trim((string)($b['name'] ?? ''));
        $type = (string)($b['type'] ?? 'other');

        if ($code === '' || $name === '') json_error('กรุณาระบุ code และ name', 400);
        if (mb_strlen($code) !== 5) json_error('Code ต้องมี 5 ตัวอักษร', 400);
        if (!in_array($type, SUPPLIER_TYPES, true)) json_error('type ไม่ถูกต้อง', 400);

        $dup = db()->prepare('SELECT 1 FROM suppliers WHERE code = :c AND id <> :id');
        $dup->execute([':c' => $code, ':id' => $id]);
        if ($dup->fetch()) json_error('code นี้ถูกใช้แล้ว', 409);

        $stmt = db()->prepare(
            'UPDATE suppliers SET code = :c, name = :n, type = :t WHERE id = :id'
        );
        $stmt->execute([
            ':c' => $code, ':n' => $name, ':t' => $type,
            ':id' => $id,
        ]);
        json_response(['success' => true]);
    }

    if ($method === 'DELETE') {
        if ($id <= 0) json_error('Missing id', 400);
        $stmt = db()->prepare('DELETE FROM suppliers WHERE id = :id');
        $stmt->execute([':id' => $id]);
        json_response(['success' => true]);
    }

    json_error('Method not allowed', 405);
} catch (Throwable $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}

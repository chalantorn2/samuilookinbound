<?php
declare(strict_types=1);
require __DIR__ . '/db.php';

$me = require_login();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    if ($method === 'GET') {
        $search = trim((string)($_GET['search'] ?? ''));
        $sql = 'SELECT id, flight_no, origin, destination, dep_time, arr_time, airline, created_at, updated_at FROM flights';
        $params = [];
        if ($search !== '') {
            $sql .= ' WHERE flight_no LIKE :q OR origin LIKE :q OR destination LIKE :q OR airline LIKE :q';
            $params[':q'] = '%' . $search . '%';
        }
        $sql .= ' ORDER BY flight_no ASC';
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
        $fn   = strtoupper(trim((string)($b['flight_no']   ?? '')));
        $org  = strtoupper(trim((string)($b['origin']      ?? '')));
        $dst  = strtoupper(trim((string)($b['destination'] ?? '')));
        $dep  = trim((string)($b['dep_time'] ?? ''));
        $arr  = trim((string)($b['arr_time'] ?? ''));
        $al   = trim((string)($b['airline']  ?? ''));

        if ($fn === '' || $org === '' || $dst === '') json_error('กรุณาระบุ flight_no, ต้นทาง, ปลายทาง', 400);

        $exists = db()->prepare('SELECT 1 FROM flights WHERE flight_no = :f');
        $exists->execute([':f' => $fn]);
        if ($exists->fetch()) json_error('flight_no นี้ถูกใช้แล้ว', 409);

        $stmt = db()->prepare(
            'INSERT INTO flights (flight_no, origin, destination, dep_time, arr_time, airline)
             VALUES (:f, :o, :d, :dt, :at, :al)'
        );
        $stmt->execute([
            ':f'  => $fn, ':o' => $org, ':d' => $dst,
            ':dt' => $dep !== '' ? $dep : null,
            ':at' => $arr !== '' ? $arr : null,
            ':al' => $al  !== '' ? $al  : null,
        ]);
        json_response(['success' => true, 'id' => (int)db()->lastInsertId()], 201);
    }

    if ($method === 'PUT') {
        if ($id <= 0) json_error('Missing id', 400);
        $b = read_json_body();
        $fn   = strtoupper(trim((string)($b['flight_no']   ?? '')));
        $org  = strtoupper(trim((string)($b['origin']      ?? '')));
        $dst  = strtoupper(trim((string)($b['destination'] ?? '')));
        $dep  = trim((string)($b['dep_time'] ?? ''));
        $arr  = trim((string)($b['arr_time'] ?? ''));
        $al   = trim((string)($b['airline']  ?? ''));

        if ($fn === '' || $org === '' || $dst === '') json_error('กรุณาระบุ flight_no, ต้นทาง, ปลายทาง', 400);

        $dup = db()->prepare('SELECT 1 FROM flights WHERE flight_no = :f AND id <> :id');
        $dup->execute([':f' => $fn, ':id' => $id]);
        if ($dup->fetch()) json_error('flight_no นี้ถูกใช้แล้ว', 409);

        $stmt = db()->prepare(
            'UPDATE flights SET flight_no = :f, origin = :o, destination = :d, dep_time = :dt, arr_time = :at, airline = :al WHERE id = :id'
        );
        $stmt->execute([
            ':f'  => $fn, ':o' => $org, ':d' => $dst,
            ':dt' => $dep !== '' ? $dep : null,
            ':at' => $arr !== '' ? $arr : null,
            ':al' => $al  !== '' ? $al  : null,
            ':id' => $id,
        ]);
        json_response(['success' => true]);
    }

    if ($method === 'DELETE') {
        if ($id <= 0) json_error('Missing id', 400);
        $stmt = db()->prepare('DELETE FROM flights WHERE id = :id');
        $stmt->execute([':id' => $id]);
        json_response(['success' => true]);
    }

    json_error('Method not allowed', 405);
} catch (Throwable $e) {
    json_error('Server error: ' . $e->getMessage(), 500);
}
